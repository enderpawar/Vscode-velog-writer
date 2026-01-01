# ✍️ Velog Auto Writer

Git 커밋으로부터 Velog 블로그 글을 자동으로 생성하는 VSCode Extension입니다.

## ✨ 특징

- 🔍 **Git 로그 자동 분석**: 최근 N일간의 커밋을 자동으로 파싱
- 🤖 **Gemini AI 통합**: Google Gemini API로 자연스러운 블로그 글 생성
- 📝 **Velog 스타일**: 친근한 말투와 기술적 깊이의 균형
- 🎨 **웹 UI**: VSCode 내장 웹뷰로 간편한 설정 및 사용
- ⚡ **빠른 생성**: 클릭 한 번으로 블로그 글 완성

## 🚀 사용 방법

### 1. Extension 설치
VSCode Marketplace에서 "Velog Auto Writer" 검색 후 설치

### 2. Webview 패널 열기
- 왼쪽 액티비티바에서 Velog 아이콘 클릭
- 또는 `Ctrl+Shift+P` → `Velog: 블로그 글 생성하기`

### 3. API 키 설정
- Webview 패널에서 Gemini API 키 입력 및 저장
- [Gemini API 키 발급받기](https://makersuite.google.com/app/apikey)

### 4. 블로그 글 생성
- 분석할 기간(일) 설정
- "블로그 글 생성하기" 버튼 클릭
- AI가 자동으로 Git 커밋을 분석하여 블로그 글 작성
- 새 에디터 탭에서 Markdown 결과 확인

## 📋 요구사항

- VSCode 1.85.0 이상
- Git이 설치된 환경
- [Gemini API 키](https://makersuite.google.com/app/apikey)

## 🎯 주요 기능

### Git 커밋 분석
- 최근 1~365일간의 커밋 자동 수집
- 커밋 메시지, 작성자, 날짜, 변경 내역 분석
- 파일 추가/삭제 통계 계산

### AI 블로그 글 생성
- Gemini 2.0 Flash 모델 사용
- Velog 스타일에 맞춘 자연스러운 글 생성
- 제목, 서론, 본문, 결론 자동 구성
- 적절한 이모지와 Markdown 문법 적용

### 편리한 UI
- VSCode 테마 자동 적용
- 실시간 생성 상태 표시
- API 키 안전 저장 (VSCode globalState)

## 🔧 설정

Extension은 다음 설정을 VSCode globalState에 저장합니다:
- `geminiApiKey`: Gemini API 키 (암호화 저장)

## 🤝 기여하기

이슈와 PR은 언제나 환영합니다!

Repository: [GitHub](https://github.com/enderpawar/Vscode-velog-writer)

## 📝 라이선스

MIT License

## 🙋 문의

문제가 발생하거나 제안사항이 있다면 [GitHub Issues](https://github.com/enderpawar/Vscode-velog-writer/issues)에 올려주세요!

---

**즐거운 블로그 작성 되세요! ✨**

