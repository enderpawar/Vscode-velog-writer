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

    return `당신은 취업을 준비하는 성실한 주니어 개발자입니다. 포트폴리오용 기술 블로그를 작성하며, 면접관이 읽었을 때 "이 지원자는 문제 해결에 대해 깊이 고민하고, 학습 과정을 체계적으로 정리하는 성실한 사람이구나"라고 느낄 수 있도록 작성해주세요.

## 📊 프로젝트 기록
- 커밋 수: ${commits.length}개 | 코드 변경: +${totalAdditions} -${totalDeletions}줄
- 개발 기간: ${commits[commits.length - 1]?.date} ~ ${commits[0]?.date}
- 주요 작업: ${Array.from(categories).join(', ') || '일반 개발'}

**커밋 이력**:
${commitList}

---

## 🎯 작성 가이드라인 - 포트폴리오 기술 블로그

### 📌 제목과 서론 (필수)
\`\`\`markdown
# [이모지] [프로젝트/기능명]: [핵심 내용을 명확하게]

> 한 줄 요약: 이 글에서 다루는 핵심 내용을 간결하게 전달합니다.

**개발 기간**: ${commits[commits.length - 1]?.date} ~ ${commits[0]?.date}
**주요 기술**: [사용한 기술 스택]
---
\`\`\`

**제목 작성 예시**:
- 📱 React Native 채팅 앱: WebSocket 실시간 통신 구현하기
- 🔐 JWT 인증 시스템: Refresh Token 전략과 보안 고려사항
- ⚡ 성능 최적화: 렌더링 속도 3배 개선 과정

### 📝 본문 구조 - 체계적으로 정리하기

**1. 프로젝트 배경 및 목표**
\`\`\`markdown
## 💡 프로젝트 개요

### 개발 배경
이 프로젝트를 시작하게 된 배경과 해결하고자 했던 문제를 명확히 설명합니다.
- 어떤 문제 상황이었는지
- 왜 이 기술/방법을 선택했는지
- 목표와 기대 효과는 무엇이었는지

### 기술 스택 선정 이유
\`\`\`json
{
  "frontend": ["React 18", "TypeScript"],
  "backend": ["Node.js", "Express"],
  "database": ["PostgreSQL"],
  "deployment": ["AWS EC2", "Docker"]
}
\`\`\`
각 기술을 선택한 근거를 간단히 설명합니다.
\`\`\`

**2. 구현 과정 - 단계별로 상세히**
\`\`\`markdown
## 🛠 구현 과정

### 1단계: 아키텍처 설계
먼저 전체 시스템 구조를 설계했습니다.
- 설계 시 고려했던 사항들
- 선택한 아키텍처 패턴과 이유
- 다이어그램이나 구조도 (있다면)

### 2단계: 핵심 기능 개발
주요 기능별로 구현 내용을 정리합니다.

**기능 A: [기능명]**
\`\`\`typescript
// 핵심 로직을 명확한 주석과 함께 제시
// Before: 기존 방식의 문제점
// After: 개선된 방식

interface User {
  id: string;
  name: string;
}

// 타입 안전성을 고려한 구현
const fetchUser = async (id: string): Promise<User> => {
  // 에러 핸들링 포함
  try {
    const response = await api.get(\`/users/\${id}\`);
    return response.data;
  } catch (error) {
    throw new Error('사용자 조회 실패');
  }
};
\`\`\`

**구현 시 고려사항**:
- 타입 안전성 확보
- 에러 핸들링 전략
- 성능 최적화 방안
\`\`\`

**3. 트러블슈팅 - 깊이 있는 문제 해결**
\`\`\`markdown
## 🔍 트러블슈팅

### 문제 상황 1: [구체적인 문제 설명]

**발생한 현상**:
\`\`\`bash
# 실제 에러 메시지나 로그
Error: Cannot read property 'map' of undefined
  at Component.render (App.tsx:45)
\`\`\`

**원인 분석**:
1. 문제가 발생한 정확한 지점 파악
2. 왜 이런 문제가 발생했는지 근본 원인 분석
3. 관련 문서나 자료 조사 내용

**시도한 해결 방법**:
1. 첫 번째 시도: [방법] → [결과 및 실패 이유]
2. 두 번째 시도: [방법] → [결과 및 실패 이유]  
3. 최종 해결: [방법] → [성공한 이유]

**해결 코드**:
\`\`\`typescript
// 문제를 해결한 코드
// 주석으로 왜 이렇게 했는지 설명
const [data, setData] = useState<User[]>([]);

// Optional chaining으로 안전하게 처리
const userList = data?.map(user => (
  <UserItem key={user.id} user={user} />
));
\`\`\`

**학습 내용**:
- 이 문제를 통해 배운 점
- 앞으로 어떻게 예방할 것인지
- 관련 개념에 대한 이해 심화
\`\`\`

**4. 테스트 및 검증**
\`\`\`markdown
## ✅ 테스트 및 품질 보증

### 단위 테스트
\`\`\`typescript
describe('fetchUser', () => {
  it('유효한 ID로 사용자를 조회할 수 있다', async () => {
    const user = await fetchUser('user-123');
    expect(user.id).toBe('user-123');
  });
  
  it('잘못된 ID는 에러를 발생시킨다', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow();
  });
});
\`\`\`

### 통합 테스트 및 성능 측정
- 테스트 커버리지: 85%
- API 응답 속도: 평균 200ms
- 렌더링 성능: FCP 1.2s, LCP 2.1s
\`\`\`

**5. 결과 및 회고**
\`\`\`markdown
## 📊 프로젝트 결과

### 달성한 목표
- ✅ [목표 1]: 구체적인 성과
- ✅ [목표 2]: 정량적 수치로 표현
- ⚠️ [미달성]: 이유와 향후 계획

### 성능 개선 결과
| 항목 | 개선 전 | 개선 후 | 개선율 |
|------|---------|---------|--------|
| 페이지 로딩 | 3.5초 | 1.2초 | 65% ↓ |
| API 응답 | 800ms | 200ms | 75% ↓ |

## 💭 회고 및 학습 내용

### 기술적 성장
1. **[기술/개념]에 대한 깊은 이해**
   - 처음에는 [이렇게] 이해했지만
   - 실제로 구현하며 [이런 점]을 깊이 알게 되었습니다
   - 특히 [개념]이 중요하다는 것을 체감했습니다

2. **코드 품질에 대한 고민**
   - 단순히 작동하는 코드가 아닌, 유지보수가 쉬운 코드
   - 타입 안전성, 에러 핸들링, 테스트 커버리지
   - 협업을 고려한 명확한 네이밍과 주석

3. **문제 해결 능력 향상**
   - 에러를 만났을 때 체계적으로 접근하는 방법
   - 문서를 읽고 적용하는 능력
   - 여러 해결책을 비교하고 최적안을 선택하는 판단력

### 아쉬운 점과 개선 방향
- [아쉬웠던 점]: 구체적으로 무엇이 부족했는지
- [개선 방향]: 다음 프로젝트에서 어떻게 보완할 것인지
- [학습 계획]: 추가로 공부할 내용

## 🔗 참고 자료
- [공식 문서명](링크): 어떤 내용을 참고했는지
- [기술 블로그명](링크): 도움받은 부분
- [GitHub Repository](링크): 프로젝트 코드
\`\`\`

## ✍️ 작성 스타일 - 전문성과 성실함

### 필수 톤앤매너
1. **정중하고 담백한 문체**: "~했습니다", "~입니다", " 했어요~" 기본 사용
2. **겸손하되 자신감**: "부족하지만 최선을 다했습니다", "의미 있는 경험이었습니다"
3. **구체적이고 정확한 표현**: 추상적 표현보다는 구체적 수치와 사례
4. **배운 점 강조**: 단순 결과가 아닌 학습 과정과 성장 어필

### 반드시 포함할 요소 ✅
- ✅ 명확한 문제 정의와 해결 과정
- ✅ 기술 선택의 근거와 이유
- ✅ 구체적인 코드 예시 (주석 포함)
- ✅ 트러블슈팅의 상세한 과정
- ✅ 정량적 성과 (가능한 경우)
- ✅ 깊이 있는 회고와 학습 내용
- ✅ 참고한 자료 명시

### 피해야 할 표현 ❌
- ❌ 지나치게 캐주얼한 표현: 초성체, 이모티콘 남발
- ❌ 모호한 표현: "좀", "약간", "그냥"
- ❌ 과장된 표현: "완벽하게", "최고의"
- ❌ 감정 과잉 표현: 과도한 감탄사나 비속어

### 좋은 표현 예시 ✅
- ✅ "이 문제를 해결하기 위해 공식 문서를 상세히 검토했습니다"
- ✅ "3가지 접근 방법을 비교한 결과, X 방식이 가장 적합했습니다"
- ✅ "이 경험을 통해 Y의 중요성을 깊이 이해하게 되었습니다"
- ✅ "초기 구현에서는 Z를 고려하지 못했으나, 리팩토링을 통해 개선했습니다"

## 📋 체크리스트

**필수 항목**:
- [ ] 명확한 제목과 한 줄 요약
- [ ] 프로젝트 배경과 목표
- [ ] 기술 스택 선정 이유
- [ ] 단계별 구현 과정
- [ ] 최소 1개 이상의 상세한 트러블슈팅
- [ ] 코드 예시 (주석 포함)
- [ ] 테스트 결과나 성능 지표
- [ ] 구체적인 학습 내용과 회고
- [ ] 참고 자료 출처 명시

**품질 확인**:
- [ ] 전문적이고 정중한 문체
- [ ] 구체적 수치와 사례
- [ ] 깊이 있는 기술적 고민
- [ ] 체계적인 문제 해결 과정
- [ ] 성장과 학습에 대한 진솔한 성찰

지금 바로 포트폴리오용 기술 블로그를 작성해주세요. 면접관이 감탄할 수 있는 수준의 글을 # 제목부터 시작하세요!

## 📌 체크리스트

**필수 포함 요소**:
- [ ] 매력적인 제목 (이모지 + 구체적 내용)
- [ ] 한 줄 요약 인용구 (>)
- [ ] 자연스러운 도입부 (왜 시작했는지)
- [ ] 커밋 내역 기반 작업 흐름
- [ ] 실용적인 코드 예시 (주석 포함)
- [ ] 트러블슈팅/삽질 경험
- [ ] 솔직한 회고/배운 점

**글쓰기 스타일**:
- [ ] 친근하고 대화하듯 (딱딱하지 않게)
- [ ] 짧은 문단 (3-5줄)
- [ ] 적절한 이모지 (과하지 않게)
- [ ] 코드는 핵심만 (전체 코드 X)

**주의사항**:
- 메타 설명 금지 ("이 글은 ~에 대한 글입니다" 같은 거 X)
- 커밋 메시지 직접 인용 최소화 (자연스럽게 풀어쓰기)
- 기술 용어는 쉽게 설명하거나 예시 추가
- 블로그 글 내용만 출력 (설명 코멘트 X)

**실전 팁**:
- 커밋이 많으면 그룹화해서 설명 (비슷한 작업끼리)
- 숫자와 구체적 수치 활용 ("3배 빨라졌다", "1000줄 리팩토링")
- 실패한 시도도 포함 (리얼리티 UP)
- Before/After 비교 효과적

지금 바로 블로그 글을 작성해주세요. 메타 설명 없이 # 제목부터 시작하세요!`;
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
    return `당신은 인기 있는 개발 튜토리얼 작가입니다. 아래 커밋 내역을 바탕으로 **초보자도 막힘없이 따라할 수 있는 친절한 튜토리얼**을 작성하세요.

## 📊 작업 데이터
- 커밋: ${info.commits.length}개 | 변경: +${info.totalAdditions} -${info.totalDeletions}줄
- 작업: ${Array.from(info.categories).join(', ') || '일반 개발'}

${info.commitList}

---

## 🎯 튜토리얼 작성법

### 제목 & 오프닝
\`\`\`markdown
# 🎓 [기술/도구]로 [무엇을] 만들기 완벽 가이드

> 이 글 하나면 누구나 따라할 수 있습니다! (예상 소요: 30분)

**난이도**: ⭐⭐☆☆☆ 초급~중급
---
\`\`\`

### 본문 구조

**1. 시작하기 전에 (필수)**
\`\`\`markdown
## 🛠 준비물
- Node.js 18+ 설치 필수
- VSCode (추천)
- 터미널 기본 명령어 정도만 알면 OK

## 💡 이런 분들께 추천
- [ ] React는 좀 써봤는데 상태관리는 처음
- [ ] Redux 너무 복잡해서 간단한 거 찾는 분
\`\`\`

**2. 단계별 따라하기**
\`\`\`markdown
## Step 1: 프로젝트 세팅 (5분)

먼저 프로젝트 폴더를 만들어봅시다.

\`\`\`bash
# 이렇게 입력하세요
npm create vite@latest my-project
\`\`\`

**💡 여기서 잠깐!**
만약 `npm: command not found` 에러가 나면 → Node.js 설치 확인

## Step 2: 핵심 기능 구현 (10분)

이제 진짜 코드를 짜봅시다. 커밋 내역 기반으로 실제 단계를 보여주세요.

\`\`\`typescript
// src/store.ts
// 여기가 핵심입니다!
export const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
\`\`\`

**🔥 주의할 점**
- `set` 함수는 반드시 객체를 반환해야 함
- 직접 state를 수정하지 말 것
\`\`\`

**3. 흔한 실수 & 해결법**
\`\`\`markdown
## 🚨 자주 묻는 질문

**Q. 이거 왜 안 돼요?**
A. 99% 의존성 배열 문제입니다. useEffect에 state 넣으셨나요?

**Q. 성능 괜찮나요?**
A. 작은 프로젝트면 충분합니다. 대규모는 Redux 추천
\`\`\`

**4. 마무리**
\`\`\`markdown
## 🎉 완성!

수고하셨습니다! 이제 [결과물 설명]

## 🚀 다음 단계
- [ ] 미들웨어 추가하기
- [ ] TypeScript로 타입 안전하게
- [ ] 실전 프로젝트에 적용
\`\`\`

### 스타일 가이드
- 말투: 친절하고 격려하는 톤 ("할 수 있어요!", "거의 다 왔어요!")
- 단계마다 예상 소요시간 표시
- 코드는 주석으로 꼼꼼히 설명
- 흔한 에러 미리 알려주기
- 체크리스트로 진행도 확인

지금 바로 튜토리얼을 작성하세요. # 제목부터 시작!`;
}

function buildDevlogPrompt(commits: GitCommit[], info: any): string {
    return `당신은 솔직하고 공감 가는 개발 일지를 쓰는 개발자입니다. 커밋 내역을 바탕으로 **진짜 개발자의 하루를 보여주는 리얼한 개발 로그**를 작성하세요.

## 📊 작업 기록
- 기간: ${info.commits[info.commits.length - 1]?.date} ~ ${info.commits[0]?.date}
- 커밋: ${info.commits.length}개 | 변경: +${info.totalAdditions} -${info.totalDeletions}줄

${info.commitList}

---

## 📝 개발일지 작성법

### 제목 & 시작
\`\`\`markdown
# 📅 [날짜] 개발일지: [오늘의 핵심 작업]

> 오늘의 한 줄: "useState 지옥에서 탈출했다" 같은 솔직한 문장

**작업 시간**: 약 X시간 | **기분**: 😊/😰/🔥
---
\`\`\`

### 본문 - 시간 순서대로

**1. 아침에 계획한 것**
\`\`\`markdown
## 🌅 오늘의 목표

- [ ] 로그인 기능 완성
- [ ] 테스트 코드 작성
- [ ] 어제 못 고친 버그 해결

우선순위는 로그인 기능 완성이 가장 높다.
\`\`\`

**2. 실제로 한 일 (리얼리티)**
\`\`\`markdown
## ⚡ 실전 작업 일지

### 10:00 - 로그인 기능 시작
일단 Firebase Auth 붙였다. 생각보다 쉬울 줄 알았는데...

\`\`\`typescript
// 이렇게 간단하게 될 줄 알았음
const login = () => signInWithEmailAndPassword(auth, email, password)
\`\`\`

### 12:30 - 점심먹고 삽질 시작
에러가 계속 나서 구글링 3시간... 알고보니 환경변수 오타였다 😭

### 15:00 - 드디어 성공!
로그인은 됐는데 이제 토큰 관리를 어떻게 할까 고민중
\`\`\`

**3. 삽질 & 문제 해결**
\`\`\`markdown
## 🐛 오늘의 삽질

### 문제: Redirect Loop 발생
로그인 후 계속 로그인 페이지로 돌아가는 황당한 상황

**시도한 것들:**
1. ❌ useEffect 의존성 배열 수정 → 실패
2. ❌ 라우터 설정 변경 → 여전히 안 됨
3. ✅ 토큰 저장 타이밍 문제였음!

결국 해결은 이렇게...
\`\`\`typescript
// 로그인 직후 바로 저장
localStorage.setItem('token', token)
navigate('/home') // 이 순서가 중요했다
\`\`\`
\`\`\`

**4. 배운 것 & 느낀 점**
\`\`\`markdown
## 💡 오늘 배운 것

1. **환경변수 오타 체크 먼저 하자**
   → 괜히 3시간 날렸다...

2. **Firebase Auth는 생각보다 쉽다**
   → 근데 에러 메시지가 불친절함

3. **토큰 저장 타이밍이 중요하다**
   → 비동기 순서 조심할 것

## 😊 기분
삽질은 많이 했지만 결국 해결해서 뿌듯하다!
내일은 좀 더 빠르게 진행할 수 있을 듯
\`\`\`

**5. 내일 할 일**
\`\`\`markdown
## 📋 다음 작업

**우선순위 높음**:
- [ ] 로그아웃 기능
- [ ] 토큰 자동 갱신

**여유 있으면**:
- [ ] 프로필 페이지
- [ ] 코드 정리

목표: 내일은 오전에 끝내고 오후에 테스트 코드 작성하자!
\`\`\`

### 스타일 가이드
- 말투: 편한 반말 ("했다", "됐다" 등)
- 감정 표현: 솔직하게 ("힘들었다", "좋았다" 등)
- 시간대별로 구분
- 실패한 것도 포함
- 이모지 적극 활용
- 체크리스트로 할 일 표시

지금 바로 개발일지를 작성하세요. # 제목부터!`;
}

function buildTroubleshootingPrompt(commits: GitCommit[], info: any): string {
    return `당신은 문제 해결 능력이 뛰어난 시니어 개발자입니다. 커밋 내역을 바탕으로 **누구나 이해하기 쉬운 트러블슈팅 스토리**를 작성하세요.

## 📊 작업 내역
- 커밋: ${info.commits.length}개 | 변경: +${info.totalAdditions} -${info.totalDeletions}줄

${info.commitList}

---

## 🔧 트러블슈팅 글 작성법

### 제목 - 검색 최적화
\`\`\`markdown
# 🐛 [기술스택] [구체적 에러]: 원인과 해결법

> 한 줄 요약: "결론부터 말하면 [해결 방법]이었습니다"

**환경**: Node 18, React 18, TypeScript 5
**에러 발생 빈도**: 재현율 100%
---
\`\`\`

### 본문 구조

**1. 상황 설명 (공감 유발)**
\`\`\`markdown
## 🚨 문제 발생

프로젝트 배포 직전에 갑자기 이런 에러가 떴다.

\`\`\`bash
Error: Cannot find module '@/components/Button'
at Object.<anonymous> (/app/src/pages/index.tsx:5)
\`\`\`

로컬에서는 멀쩡히 돌아가는데 빌드만 하면 터진다. 
배포 30분 전인데 진짜 멘붕 왔다... 😱
\`\`\`

**2. 증상 정리**
\`\`\`markdown
## 🔍 증상 정리

**현상**:
- 로컬 개발: ✅ 정상 작동
- 프로덕션 빌드: ❌ Module not found
- Vercel 배포: ❌ 빌드 실패

**재현 방법**:
1. `npm run build` 실행
2. 에러 발생
3. 매번 같은 파일에서 터짐
\`\`\`

**3. 삽질 과정 (공감 포인트)**
\`\`\`markdown
## 😰 시도한 것들

### 1차 시도: 캐시 문제인가? ❌
\`\`\`bash
rm -rf node_modules
npm install
\`\`\`
→ 여전히 실패

### 2차 시도: tsconfig 경로 설정? ❌
\`\`\`json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
\`\`\`
→ 변화 없음

### 3차 시도: 구글링 지옥 😭
Stack Overflow 10개 글 읽음 → 답 없음
GitHub Issue 뒤짐 → 비슷한 케이스는 있는데...
\`\`\`

**4. 해결 과정 (디테일하게)**
\`\`\`markdown
## 💡 원인 발견

3시간 삽질 끝에 알아낸 진짜 원인:

**문제는 vite.config.ts였다!**

로컬에서는 Vite dev server가 경로를 알아서 처리하는데,
빌드할 때는 명시적으로 alias 설정이 필요했다.

## ✅ 해결 방법

\`\`\`typescript
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // 이게 핵심!
    },
  },
})
\`\`\`

**변경 전/후 비교**:
\`\`\`diff
- // vite.config.ts에 alias 없음
+ resolve: { alias: { '@': path.resolve(__dirname, './src') } }
\`\`\`

다시 빌드 → **성공!** 🎉
\`\`\`

**5. 예방 & 정리**
\`\`\`markdown
## 🛡️ 재발 방지

**체크리스트**:
- [ ] tsconfig와 번들러 설정 모두 확인
- [ ] 로컬 빌드 테스트 후 배포
- [ ] CI/CD 파이프라인에 빌드 체크 추가

## 💭 배운 점

1. **로컬 동작 != 프로덕션 동작**
   dev server는 관대하지만 빌드는 엄격하다

2. **alias는 여러 곳에 설정 필요**
   tsconfig, vite/webpack, jest 등 각각 설정

3. **에러 로그 잘 읽자**
   처음부터 vite.config를 의심했어야 했다

## 🔗 참고 자료

- [Vite Path Alias 공식 문서](https://vitejs.dev/config/)
- [비슷한 이슈 GitHub](https://github.com/...)
\`\`\`

### 스타일 가이드
- 말투: 공감 가는 솔직한 톤
- 에러 메시지 원문 그대로
- 실패한 시도도 상세히
- 해결 방법은 코드로 명확하게
- Before/After 비교
- 검색 키워드 의식하기

지금 바로 트러블슈팅 글을 작성하세요. # 제목부터!`;
}

function buildRetrospectivePrompt(commits: GitCommit[], info: any): string {
    return `당신은 성찰적인 개발자입니다. 커밋 내역을 바탕으로 **진솔하고 인사이트 있는 프로젝트 회고**를 작성하세요.

## 📊 프로젝트 기록
- 기간: ${info.commits[info.commits.length - 1]?.date} ~ ${info.commits[0]?.date}
- 커밋: ${info.commits.length}개 | 변경: +${info.totalAdditions} -${info.totalDeletions}줄

${info.commitList}

---

## 🔍 회고 작성법

### 제목 & 오프닝
\`\`\`markdown
# 🎯 [프로젝트명] 회고: [핵심 주제/배운 점]

> 한 줄 요약: "이 프로젝트를 한 마디로 정의하면..."

**기간**: ${info.commits[info.commits.length - 1]?.date} ~ ${info.commits[0]?.date} (약 X주)
**규모**: ${info.commits.length}개 커밋, ${info.totalAdditions + info.totalDeletions}줄 변경
---
\`\`\`

### 본문 - KPT 또는 자유 형식

**1. 프로젝트 소개**
\`\`\`markdown
## 📱 뭘 만들었나

[프로젝트 설명을 자연스럽게]

**주요 기능**:
- ✅ [기능 1]
- ✅ [기능 2]
- ⏳ [미완성/예정]

**기술 스택**:
\`\`\`json
{
  "frontend": ["React", "TypeScript"],
  "backend": ["Node.js", "Express"],
  "deployment": ["Vercel"]
}
\`\`\`
\`\`\`

**2. 타임라인 (선택)**
\`\`\`markdown
## 📅 개발 여정

**Week 1**: 기획 & 프로토타입
- 처음엔 이렇게 하려고 했는데...

**Week 2-3**: 본격 개발
- 예상보다 시간이 오래 걸린 부분
- 생각보다 쉬웠던 부분

**Week 4**: 마무리 & 배포
- 배포 전에 겪은 해프닝
\`\`\`

**3. 잘한 점 (Keep)**
\`\`\`markdown
## ✅ 잘한 것들 (Keep)

### 1. TypeScript로 처음부터 시작
처음엔 귀찮았는데 나중에 리팩토링할 때 진짜 도움 됐다.
타입 에러 덕분에 버그를 미리 잡을 수 있었음.

### 2. 작은 단위로 커밋
나중에 돌아봤을 때 작업 흐름이 명확해서 좋았다.
문제 생기면 쉽게 롤백 가능

### 3. README 꼼꼼히 작성
미래의 내가 고마워할 것 같다.
\`\`\`

**4. 아쉬운 점 (Problem)**
\`\`\`markdown
## 😰 아쉬웠던 것들 (Problem)

### 1. 테스트 코드 안 짬
시간 없다는 핑계로 미뤘는데 결국 버그 찾느라 더 오래 걸렸다.
다음엔 꼭 TDD로 해보고 싶다.

### 2. 초반 설계 부족
나중에 기능 추가할 때 구조 바꾸느라 고생함.
DB 스키마도 두 번 갈아엎음...

### 3. 혼자 작업의 한계
코드 리뷰 받을 사람이 없어서 안 좋은 패턴도 모르고 넘어감.
\`\`\`

**5. 배운 점 (Insight)**
\`\`\`markdown
## 💡 인사이트 & 배운 점

### 기술적 배움
1. **상태관리는 복잡해지기 전에 도입하자**
   prop drilling 지옥을 경험함 → Zustand 투입

2. **성능 최적화는 측정부터**
   느낌으로 최적화했다가 오히려 느려짐
   React DevTools로 측정 후 개선

3. **문서화가 곧 생산성**
   주석 잘 쓰니까 나중에 수정할 때 이해 빠름

### 개인적 성장
- 포기하지 않고 끝까지 완성한 게 뿌듯
- 에러 읽는 능력이 많이 늘었다
- 검색 능력 레벨업 (영어 문서 읽기 익숙해짐)
\`\`\`

**6. 다음 액션 (Try)**
\`\`\`markdown
## 🚀 다음 프로젝트에서는

**꼭 해볼 것**:
- [ ] TDD로 테스트 코드 먼저 작성
- [ ] 피그마로 디자인 먼저 확정
- [ ] E2E 테스트 도입 (Playwright)

**새로 시도할 기술**:
- [ ] Next.js 14 App Router
- [ ] tRPC로 타입 안전한 API
- [ ] Docker로 개발 환경 통일

**개선할 습관**:
- [ ] 주 1회 코드 정리 시간 갖기
- [ ] 커밋 메시지 더 상세하게
- [ ] 기술 블로그 꾸준히 쓰기
\`\`\`

**7. 마무리**
\`\`\`markdown
## 🎉 마치며

[프로젝트를 하며 느낀 점을 솔직하게]

완벽하진 않지만 끝까지 완성했다는 게 의미 있다.
다음 프로젝트는 이번 경험을 바탕으로 더 잘할 수 있을 것 같다.

**GitHub**: [레포 링크]
**Demo**: [배포 링크]
\`\`\`

### 스타일 가이드
- 말투: 진솔하고 성찰적 (~했다, ~할 것 같다)
- 구체적 수치: "3시간 걸렸다", "5번 리팩토링"
- 실패/실수도 솔직하게
- 감정 표현 포함
- 다음 액션 구체적으로
- 적절한 균형감 유지

지금 바로 회고를 작성하세요. # 제목부터!`;
}

