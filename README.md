# 🚀 Velog Auto Writer

Git 커밋으로부터 Velog 블로그 글을 자동으로 생성하는 CLI 도구입니다.

## ✨ 특징

- 🔍 **Git 로그 자동 분석**: 최근 N일간의 커밋을 자동으로 파싱
- 🤖 **Gemini AI 통합**: Google Gemini API로 자연스러운 블로그 글 생성
- 📝 **Velog 스타일**: 친근한 말투 (~했어요)와 기술적 깊이의 균형
- ⚡ **빠른 프로토타입**: CLI로 간단하게 사용

## 📦 설치

```bash
cd velog-auto-writer
npm install
```

## 🔑 API 키 설정

Gemini API 키가 필요합니다:

```bash
# 환경변수로 설정 (권장)
export GEMINI_API_KEY=your_api_key_here

# 또는 명령어 옵션으로 전달
node index.js generate --api-key your_api_key_here
```

## 🎯 사용법

### 1. 커밋 미리보기

```bash
# 오늘의 커밋 보기
node index.js preview

# 최근 7일 커밋 보기
node index.js preview -d 7

# 다른 저장소 분석
node index.js preview --repo /path/to/repo
```

### 2. 블로그 글 생성

```bash
# 오늘의 커밋으로 블로그 생성
node index.js generate

# 최근 3일 커밋으로 생성
node index.js generate -d 3

# 출력 경로 지정
node index.js generate -o ./posts/2025-01-01-post.md

# 전체 옵션 사용
node index.js generate -d 7 -o ./my-blog.md --api-key YOUR_KEY --repo /path/to/repo
```

## 📋 옵션

### `generate` 명령어

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-d, --days <number>` | 최근 N일간의 커밋 분석 | 1 |
| `-o, --output <path>` | 출력 파일 경로 | ./blog-post.md |
| `--api-key <key>` | Gemini API 키 | 환경변수 사용 |
| `--repo <path>` | Git 저장소 경로 | 현재 디렉토리 |

### `preview` 명령어

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-d, --days <number>` | 최근 N일간의 커밋 | 1 |
| `--repo <path>` | Git 저장소 경로 | 현재 디렉토리 |

## 💡 예시

### 1. 빠른 시작

```bash
# CREATIVE_AI 프로젝트의 오늘 작업 글쓰기
cd /path/to/CREATIVE_AI
export GEMINI_API_KEY=your_key
node /path/to/velog-auto-writer/index.js generate
```

### 2. 주간 회고 작성

```bash
# 한 주간의 작업 정리
node index.js generate -d 7 -o ./weekly-retrospective.md
```

### 3. 다른 프로젝트 분석

```bash
# 다른 저장소의 커밋으로 글 생성
node index.js generate --repo ../other-project -d 3
```

## 📂 프로젝트 구조

```
velog-auto-writer/
├── index.js                 # CLI 진입점
├── lib/
│   ├── git-parser.js       # Git 로그 파싱
│   ├── commit-analyzer.js  # 커밋 분석 & 카테고리 추론
│   ├── blog-generator.js   # Gemini API 통합
│   └── markdown-composer.js # Markdown 파일 생성
├── package.json
└── README.md
```

## 🛠 기술 스택

- **Node.js**: ES Modules
- **@google/generative-ai**: Gemini API
- **commander**: CLI 프레임워크
- **chalk**: 터미널 컬러 출력
- **ora**: 로딩 스피너

## 📝 생성되는 글의 구조

1. **제목**: 이모지 포함, 흥미롭게
2. **들어가며**: 오늘/이번에 무엇을 했는지
3. **주요 작업 내용**:
   - 무엇을 했는지
   - 왜 했는지
   - 어떻게 했는지 (코드 예시)
4. **배운 점**: 기술적 인사이트
5. **마무리**

## ⚙️ 커스터마이징

### 프롬프트 수정

`lib/blog-generator.js`의 `buildPrompt()` 함수를 수정하면 글의 톤, 구조, 길이를 조정할 수 있습니다.

```javascript
// 예: 더 짧은 글 생성
function buildPrompt(analysis) {
  return `...
  - 길이: 150-200줄 (간단하게)
  ...`;
}
```

### 카테고리 추가

`lib/commit-analyzer.js`의 `patterns` 객체에 패턴 추가:

```javascript
const patterns = {
  'CI/CD': /ci|cd|deploy|pipeline/i,
  'DB 작업': /database|sql|migration/i,
  // ...
};
```

## 🚀 향후 계획

- [ ] 대화형 모드 (질문하며 글 작성)
- [ ] 코드 diff 분석 (실제 변경 내용 포함)
- [ ] 템플릿 시스템 (프로젝트 타입별)
- [ ] Velog API 직접 업로드
- [ ] GitHub Actions 통합

## 🐛 문제 해결

### "Git 저장소가 아니에요"

```bash
# Git 저장소로 초기화
git init

# 또는 --repo 옵션으로 경로 지정
node index.js generate --repo /path/to/git/repo
```

### "Gemini API 키가 필요해요"

```bash
# API 키 발급: https://makersuite.google.com/app/apikey
export GEMINI_API_KEY=your_key_here
```

### "최근 N일간 커밋이 없어요"

```bash
# 더 긴 기간 설정
node index.js preview -d 30
```

## 📄 라이선스

MIT

