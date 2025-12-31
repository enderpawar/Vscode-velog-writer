import { GoogleGenerativeAI } from '@google/generative-ai';
import { GitCommit } from './git-parser';

export async function generateBlogPost(commits: GitCommit[], apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = buildPrompt(commits);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        throw new Error(`Gemini API 오류: ${error}`);
    }
}

function buildPrompt(commits: GitCommit[]): string {
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);

    const commitList = commits
        .map((c, i) => `${i + 1}. [${c.hash.slice(0, 7)}] ${c.message} (+${c.additions} -${c.deletions})`)
        .join('\n');

    // 카테고리 분류
    const categories = new Set<string>();
    commits.forEach(commit => {
        const msg = commit.message.toLowerCase();
        if (msg.includes('feat')) categories.add('기능 개발');
        if (msg.includes('fix')) categories.add('버그 수정');
        if (msg.includes('docs')) categories.add('문서화');
        if (msg.includes('refactor')) categories.add('리팩토링');
        if (msg.includes('test')) categories.add('테스트');
        if (msg.includes('style')) categories.add('스타일');
    });

    return `당신은 기술 블로그 작성 전문가입니다. 아래 Git 커밋 내역을 분석해서 **Velog 스타일의 기술 블로그 글**을 작성해주세요.

## 📊 커밋 분석 데이터

**기본 정보**:
- 커밋 수: ${commits.length}개
- 추가: ${totalAdditions}줄, 삭제: ${totalDeletions}줄
- 작업 기간: ${commits[commits.length - 1]?.date} ~ ${commits[0]?.date}
- 작업 카테고리: ${Array.from(categories).join(', ') || '일반 개발'}

**커밋 내역**:
${commitList}

---

## ✍️ 작성 가이드라인

1. **제목**: 이번 주 작업한 내용을 한 문장으로 요약 (이모지 포함)
2. **서론**: 이번 주 무엇을 했는지 간단히 소개
3. **본문**: 
   - 주요 작업 내용을 섹션별로 정리
   - 커밋 메시지를 바탕으로 기술적인 내용 설명
   - 어려웠던 점과 해결 방법 (추측 가능한 경우)
4. **결론**: 배운 점, 느낀 점
5. **다음 계획**: 앞으로 할 작업 간단히 언급

## 📝 스타일 요구사항

- Velog의 자연스럽고 친근한 어투 사용
- 적절한 이모지 활용 (과하지 않게)
- Markdown 문법 사용
- 코드 블록은 \`\`\`언어명 형식 사용
- 읽기 쉽게 단락 구분

**중요**: 제목부터 본문까지 완전한 블로그 글을 작성해주세요. 메타 설명이나 주석은 제외하고 바로 블로그 글 내용만 작성해주세요.`;
}
