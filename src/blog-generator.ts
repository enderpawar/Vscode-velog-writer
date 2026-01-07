import { GoogleGenerativeAI } from '@google/generative-ai';
import { GitCommit, analyzeCommitStats, formatCommitStats } from './git-parser';

export type BlogTemplate = 'default' | 'tutorial' | 'devlog' | 'troubleshooting' | 'retrospective';

export async function generateBlogPost(
    commits: GitCommit[], 
    apiKey: string, 
    customPrompt?: string, 
    stylePrompt?: string,
    template?: BlogTemplate,
    includeStats?: boolean
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // 템플릿 적용
    let prompt = customPrompt 
        ? buildCustomPrompt(commits, customPrompt) 
        : buildPromptWithTemplate(commits, template || 'default');
    
    // 예시 글 스타일이 있으면 추가
    if (stylePrompt) {
        prompt = prompt + '\n\n' + stylePrompt;
    }
    
    // 통계 정보 추가
    if (includeStats) {
        const stats = analyzeCommitStats(commits);
        const statsText = formatCommitStats(stats);
        prompt = prompt + '\n\n## 추가로 다음 통계 정보도 포함해주세요:\n' + statsText;
    }

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

function buildPromptWithTemplate(commits: GitCommit[], template: BlogTemplate): string {
    const baseInfo = getBaseCommitInfo(commits);
    
    switch (template) {
        case 'tutorial':
            return buildTutorialPrompt(commits, baseInfo);
        case 'devlog':
            return buildDevlogPrompt(commits, baseInfo);
        case 'troubleshooting':
            return buildTroubleshootingPrompt(commits, baseInfo);
        case 'retrospective':
            return buildRetrospectivePrompt(commits, baseInfo);
        default:
            return buildPrompt(commits);
    }
}

function getBaseCommitInfo(commits: GitCommit[]) {
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
    const commitList = commits
        .map((c, i) => `${i + 1}. [${c.hash.slice(0, 7)}] ${c.message} (+${c.additions} -${c.deletions})`)
        .join('\n');
    
    const categories = new Set<string>();
    commits.forEach(commit => {
        const msg = commit.message.toLowerCase();
        if (msg.includes('feat')) categories.add('기능 개발');
        if (msg.includes('fix')) categories.add('버그 수정');
        if (msg.includes('docs')) categories.add('문서화');
        if (msg.includes('refactor')) categories.add('리팩토링');
    });
    
    return { totalAdditions, totalDeletions, commitList, categories, commits };
}

function buildTutorialPrompt(commits: GitCommit[], info: any): string {
    return `당신은 기술 블로그 튜토리얼 작성 전문가입니다. 아래 Git 커밋 내역을 바탕으로 **초보자도 따라할 수 있는 단계별 튜토리얼**을 작성해주세요.

## 📊 커밋 분석
- 커밋 수: ${info.commits.length}개
- 추가: ${info.totalAdditions}줄, 삭제: ${info.totalDeletions}줄
- 작업 카테고리: ${Array.from(info.categories).join(', ') || '일반 개발'}

**커밋 내역**:
${info.commitList}

## 작성 가이드
1. **# 🎓 [주제]: [부제목]** 형식의 제목
2. **준비물/사전 지식** 섹션 필수
3. **단계별 설명**: Step 1, Step 2... 형식으로 명확하게
4. **코드 예제**: 각 단계마다 실제 작동하는 코드 포함
5. **주의사항/팁**: 초보자가 실수할 수 있는 부분 강조
6. **다음 단계**: 더 배울 수 있는 내용 제시`;
}

function buildDevlogPrompt(commits: GitCommit[], info: any): string {
    return `당신은 개발 일지 작성 전문가입니다. 아래 Git 커밋 내역을 바탕으로 **일기처럼 자연스러운 개발 로그**를 작성해주세요.

## 📊 커밋 분석
- 커밋 수: ${info.commits.length}개
- 추가: ${info.totalAdditions}줄, 삭제: ${info.totalDeletions}줄
- 작업 기간: ${info.commits[info.commits.length - 1]?.date} ~ ${info.commits[0]?.date}

**커밋 내역**:
${info.commitList}

## 작성 가이드
1. **# 📝 [날짜] 개발일지: [오늘 한 일]** 형식의 제목
2. **오늘의 목표**: 하루 시작할 때 세운 목표
3. **작업 내용**: 시간순으로 무엇을 했는지
4. **트러블슈팅**: 겪은 문제와 해결 과정
5. **배운 점**: 오늘 새로 알게 된 것
6. **내일 할 일**: 다음 작업 계획
7. 편안하고 솔직한 어투 (반말 OK)`;
}

function buildTroubleshootingPrompt(commits: GitCommit[], info: any): string {
    return `당신은 기술 문제 해결 전문가입니다. 아래 Git 커밋 내역을 바탕으로 **문제 해결 과정을 상세히 설명하는 글**을 작성해주세요.

## 📊 커밋 분석
- 커밋 수: ${info.commits.length}개
- 추가: ${info.totalAdditions}줄, 삭제: ${info.totalDeletions}줄

**커밋 내역**:
${info.commitList}

## 작성 가이드
1. **# 🐛 [문제]: [간단한 설명]** 형식의 제목
2. **## 문제 상황**: 어떤 문제가 발생했는지
3. **## 증상**: 에러 메시지, 이상 동작 등
4. **## 원인 분석**: 문제의 근본 원인 파악 과정
5. **## 해결 방법**: 단계별 해결 과정 (코드 포함)
6. **## 예방책**: 같은 문제가 재발하지 않도록
7. **## 참고 자료**: 도움이 된 문서나 링크`;
}

function buildRetrospectivePrompt(commits: GitCommit[], info: any): string {
    return `당신은 프로젝트 회고 전문가입니다. 아래 Git 커밋 내역을 바탕으로 **진솔한 프로젝트 회고록**을 작성해주세요.

## 📊 커밋 분석
- 커밋 수: ${info.commits.length}개
- 추가: ${info.totalAdditions}줄, 삭제: ${info.totalDeletions}줄
- 작업 기간: ${info.commits[info.commits.length - 1]?.date} ~ ${info.commits[0]?.date}

**커밋 내역**:
${info.commitList}

## 작성 가이드
1. **# 🔍 [프로젝트명] 회고: [핵심 주제]** 형식의 제목
2. **## 프로젝트 개요**: 무엇을 만들었는지
3. **## 잘한 점 (Keep)**: 계속 유지하고 싶은 것
4. **## 아쉬운 점 (Problem)**: 개선이 필요한 부분
5. **## 배운 점 (Insight)**: 프로젝트를 통해 얻은 인사이트
6. **## 다음에 시도할 것 (Try)**: 앞으로 적용할 방법
7. 솔직하고 개인적인 감정 표현 포함`;
}

