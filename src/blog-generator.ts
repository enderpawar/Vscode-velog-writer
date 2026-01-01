import { GoogleGenerativeAI } from '@google/generative-ai';
import { GitCommit } from './git-parser';

export async function generateBlogPost(commits: GitCommit[], apiKey: string, customPrompt?: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = customPrompt ? buildCustomPrompt(commits, customPrompt) : buildPrompt(commits);

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

### 📌 헤더 형식 (필수)
블로그 글은 반드시 다음 형식으로 시작해야 합니다:

\`\`\`
# 🎯 [이모지] [핵심 주제]: [구체적인 작업 내용]

> [한 줄 요약: 이번 작업의 핵심을 간단명료하게]

**🔗 관련 링크**: [GitHub 레포/배포 링크 등이 있다면]

---
\`\`\`

**헤더 작성 예시**:
- \`# 🎓 방학 프로젝트: 노드 기반 ML 파이프라인 빌더 만들기\`
- \`# 🚀 성능 최적화: API 응답 속도 50% 개선하기\`
- \`# 🐛 버그 픽스: 메모리 누수 문제 해결 과정\`

### 📝 본문 구조

1. **서론** (## 🤔 왜 이걸 했냐면... / ## 💡 배경):
   - 작업을 하게 된 이유나 배경을 친근하게 설명
   - 개인적인 경험이나 불편함에서 시작

2. **작업 과정** (## ⏱️ 개발 여정 / ## 🛠️ 작업 내용):
   - 주요 커밋을 시간순으로 정리
   - 각 단계별 작업 내용을 구체적으로
   - Week 1-2 형식으로 기간별 정리 가능

3. **기술 스택** (## 🛠 기술 스택):
   - 사용한 라이브러리/프레임워크를 JSON 코드블록으로
   - 왜 이 기술을 선택했는지 간단히 설명

4. **핵심 구현** (## 💻 핵심 구현 / ## 🎯 주요 기능):
   - 중요한 기능을 섹션별로
   - 코드 예시 포함 (커밋 내용 기반)
   - 어려웠던 점과 해결 방법

5. **결과/회고** (## 🎉 결과 / ## 💭 배운 점):
   - 작업 결과와 성과
   - 개인적으로 배우고 느낀 점
   - 앞으로의 계획

## 📝 스타일 요구사항

- **어투**: 자연스럽고 친근한 구어체 (반말 가능, ~했어요 체도 좋음)
- **이모지**: 각 섹션 제목마다 적절하게 활용
- **코드 블록**: \`\`\`typescript 또는 \`\`\`javascript 형식 사용
- **단락**: 짧고 읽기 쉽게 구분
- **구체성**: "버그 수정"보다는 "메모리 누수 문제 해결"처럼 구체적으로

**중요**: 
1. 반드시 위의 헤더 형식(# + > 인용구 + --- 구분선)으로 시작하세요
2. 메타 설명이나 주석 없이 바로 블로그 글 내용만 작성하세요
3. 커밋 내역을 바탕으로 실제 작업한 것처럼 자연스럽게 풀어쓰세요`;
}

function buildCustomPrompt(commits: GitCommit[], customPrompt: string): string {
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);

    const commitList = commits
        .map((c, i) => `${i + 1}. [${c.hash.slice(0, 7)}] ${c.message} (+${c.additions} -${c.deletions})`)
        .join('\n');

    return `${customPrompt}

## 📊 커밋 분석 데이터

**기본 정보**:
- 커밋 수: ${commits.length}개
- 추가: ${totalAdditions}줄, 삭제: ${totalDeletions}줄
- 작업 기간: ${commits[commits.length - 1]?.date} ~ ${commits[0]?.date}

**커밋 내역**:
${commitList}`;
}
