# ✍️ Velog Auto Writer

> Git 커밋으로부터 Velog 스타일의 기술 블로그 글을 자동 생성하는 VSCode 확장 프로그램

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VSCode Version](https://img.shields.io/badge/VSCode-1.85.0+-blue.svg)](https://code.visualstudio.com/)

## 📌 소개

개발하면서 쌓은 Git 커밋 내역을 바탕으로 자동으로 기술 블로그 글을 작성해주는 확장 프로그램입니다. Google Gemini AI를 활용하여 커밋 내역을 분석하고, Velog 스타일에 맞춰 자연스러운 블로그 포스트를 생성합니다.

### ✨ 주요 특징

- 🔍 **스마트 커밋 분석**: 지정한 기간의 Git 커밋을 자동으로 수집하고 분석
- 🤖 **AI 기반 글쓰기**: Google Gemini 2.0 Flash 모델로 자연스러운 블로그 글 생성
- 📝 **Velog 최적화**: Velog 스타일에 맞춘 말투, 구조, 이모지 자동 적용
- 🎨 **직관적인 UI**: VSCode 내장 웹뷰로 간편한 설정과 사용
- ⚡ **원클릭 생성**: 클릭 한 번으로 완성된 블로그 글 획득
- 📊 **커밋 통계**: 추가/삭제 라인 수, 작업 카테고리 자동 분석

## 🚀 빠른 시작

### 1. 설치 및 설정

1. VSCode에서 확장 프로그램 설치 (또는 개발 중인 경우 F5로 디버깅)
2. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 Gemini API 키 발급
3. VSCode 좌측 액티비티 바에서 Velog 아이콘 클릭
4. 웹뷰 패널에서 API 키 입력 및 저장

### 2. 블로그 글 생성

1. Git 프로젝트를 VSCode로 열기
2. Velog Auto Writer 패널에서 분석 기간 설정 (1~365일)
3. "블로그 글 생성하기" 버튼 클릭
4. 생성된 Markdown 글을 새 탭에서 확인
5. 내용 수정 후 Velog에 복사 붙여넣기

### 명령어 팔레트 사용

- `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)를 누르고:
  - **Velog: 블로그 글 생성하기** - 블로그 글 생성 시작
  - **Velog: Gemini API 키 설정** - API 키 설정/변경

## 📋 요구사항

- **VSCode**: 1.85.0 이상
- **Git**: 설치 및 프로젝트에 커밋 내역 존재
- **Gemini API 키**: [Google AI Studio](https://makersuite.google.com/app/apikey)에서 무료 발급

## 🎯 작동 원리

### 1. Git 커밋 수집
```
git log --since=N.days.ago
├─ 커밋 해시, 메시지, 작성자, 날짜 추출
└─ 각 커밋별 추가/삭제 라인 수 계산
```

### 2. 커밋 분석
- 커밋 메시지 기반 카테고리 분류 (기능 개발, 버그 수정, 리팩토링 등)
- 전체 작업량 통계 계산 (총 추가/삭제 라인)
- 작업 기간 및 주요 변경사항 파악

### 3. AI 글 생성
- Gemini 2.0 Flash 모델에 커밋 정보 전달
- Velog 스타일 프롬프트로 자연스러운 블로그 글 작성
- 제목, 서론, 본문, 결론 포함한 완성된 Markdown 반환

### 4. 결과 표시
- VSCode 새 에디터 탭에 Markdown 파일로 열기
- 바로 편집 가능한 형태로 제공

## 🛠️ 개발 및 빌드

### 프로젝트 구조

```
velog-auto-writer/
├── src/
│   ├── extension.ts          # 확장 프로그램 진입점
│   ├── blog-generator.ts     # Gemini AI 블로그 생성
│   ├── git-parser.ts          # Git 커밋 파싱
│   └── webview-provider.ts    # 웹뷰 UI 제공
├── public/                    # 웹뷰 HTML/CSS/JS
├── lib/                       # 컴파일된 JS 파일
└── package.json
```

### 로컬 개발

```bash
# 의존성 설치
npm install

# TypeScript 컴파일
npm run compile

# Watch 모드 (자동 컴파일)
npm run watch

# VSCode 디버깅
F5 키 (Extension Development Host 실행)
```

### 배포

```bash
# 프로덕션 빌드
npm run vscode:prepublish

# VSIX 패키지 생성 (vsce 설치 필요)
vsce package
```

## ⚙️ 설정

확장 프로그램은 다음 데이터를 VSCode의 globalState에 저장합니다:

- **geminiApiKey**: Gemini API 키 (안전하게 암호화 저장)

설정은 웹뷰 패널에서 직접 관리하거나, 명령어 팔레트에서 변경할 수 있습니다.

## 🐛 알려진 이슈

- Windows 환경에서 PowerShell 사용이 필요합니다
- 매우 큰 커밋 내역(100개 이상)은 생성 시간이 오래 걸릴 수 있습니다
- Gemini API 할당량 초과 시 오류가 발생할 수 있습니다

## 🤝 기여하기

프로젝트 개선에 기여하고 싶으신가요?

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

이슈와 PR은 언제나 환영합니다!

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 링크

- **GitHub**: [https://github.com/enderpawar/Vscode-velog-writer](https://github.com/enderpawar/Vscode-velog-writer)
- **Issues**: [https://github.com/enderpawar/Vscode-velog-writer/issues](https://github.com/enderpawar/Vscode-velog-writer/issues)
- **Gemini API**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

## 💡 팁

- **최적의 기간**: 7~14일 정도의 커밋이 가장 좋은 결과를 만듭니다
- **커밋 메시지**: 명확한 커밋 메시지가 더 좋은 블로그 글을 만듭니다
- **후처리**: AI가 생성한 글을 검토하고 개인적인 인사이트를 추가하세요

---

**즐거운 블로그 작성 되세요! ✨**

Made with ❤️ by developers, for developers

