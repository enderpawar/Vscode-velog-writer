import { GoogleGenerativeAI } from '@google/generative-ai';

// DOM 요소
const apiKeyInput = document.getElementById('apiKey');
const commitsInput = document.getElementById('commits');
const additionalInfoInput = document.getElementById('additionalInfo');
const generateBtn = document.getElementById('generateBtn');
const outputSection = document.getElementById('outputSection');
const outputDiv = document.getElementById('output');
const loadingDiv = document.getElementById('loading');
const copyBtn = document.getElementById('copyBtn');

// 생성 버튼 클릭 이벤트
generateBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const commits = commitsInput.value.trim();
    
    // 유효성 검사
    if (!apiKey) {
        alert('Gemini API 키를 입력해주세요!');
        apiKeyInput.focus();
        return;
    }
    
    if (!commits) {
        alert('커밋 정보를 입력해주세요!');
        commitsInput.focus();
        return;
    }
    
    // 블로그 글 생성
    await generateBlogPost(apiKey, commits, additionalInfoInput.value.trim());
});

// 복사 버튼 클릭 이벤트
copyBtn.addEventListener('click', async () => {
    const text = outputDiv.textContent;
    try {
        await navigator.clipboard.writeText(text);
        
        // 버튼 텍스트 임시 변경
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ 복사됨!';
        copyBtn.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        alert('복사에 실패했습니다.');
    }
});

// 블로그 글 생성 함수
async function generateBlogPost(apiKey, commits, additionalInfo) {
    // UI 업데이트
    generateBtn.disabled = true;
    generateBtn.textContent = '생성 중...';
    outputSection.style.display = 'block';
    loadingDiv.style.display = 'block';
    outputDiv.textContent = '';
    
    try {
        // 커밋 분석
        const analysis = analyzeCommits(commits, additionalInfo);
        
        // Gemini API 호출
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const prompt = buildPrompt(analysis);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const blogPost = response.text();
        
        // 결과 표시
        loadingDiv.style.display = 'none';
        outputDiv.textContent = blogPost;
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        outputDiv.textContent = `❌ 오류 발생: ${error.message}\n\n API 키를 확인해주세요.`;
        outputDiv.style.color = '#ef4444';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🚀 블로그 글 생성하기';
    }
}

// 커밋 분석 함수
function analyzeCommits(commitsText, additionalInfo) {
    const commitLines = commitsText.split('\n').filter(line => line.trim());
    
    // 카테고리 분류
    const categories = new Set();
    commitLines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('feat')) categories.add('기능 개발');
        if (lower.includes('fix')) categories.add('버그 수정');
        if (lower.includes('docs')) categories.add('문서화');
        if (lower.includes('refactor')) categories.add('리팩토링');
        if (lower.includes('test')) categories.add('테스트');
        if (lower.includes('style')) categories.add('스타일');
        if (lower.includes('chore')) categories.add('기타 작업');
    });
    
    return {
        totalCommits: commitLines.length,
        commits: commitLines,
        categories: Array.from(categories),
        additionalInfo: additionalInfo || '없음'
    };
}

// 프롬프트 생성 함수
function buildPrompt(analysis) {
    const commitList = analysis.commits
        .map((commit, i) => `${i + 1}. ${commit}`)
        .join('\n');
    
    return `당신은 기술 블로그 작성 전문가입니다. 아래 Git 커밋 내역을 분석해서 **Velog 스타일의 기술 블로그 글**을 작성해주세요.

## 📊 커밋 분석 데이터

**기본 정보**:
- 커밋 수: ${analysis.totalCommits}개
- 작업 카테고리: ${analysis.categories.join(', ')}

**커밋 내역**:
${commitList}

**추가 정보**:
${analysis.additionalInfo}

---

## ✍️ 작성 가이드라인

1. **제목**: 오늘 작업한 내용을 한 문장으로 요약 (이모지 포함)
2. **서론**: 오늘 무엇을 했는지 간단히 소개
3. **본문**: 
   - 주요 작업 내용을 섹션별로 정리
   - 코드나 기술적인 내용 설명
   - 어려웠던 점과 해결 방법
4. **결론**: 오늘 배운 점, 느낀 점
5. **다음 계획**: 앞으로 할 작업 간단히 언급

## 📝 스타일 요구사항

- Velog의 자연스럽고 친근한 어투 사용
- 적절한 이모지 활용 (과하지 않게)
- Markdown 문법 사용
- 코드 블록은 \`\`\`언어명 형식 사용
- 읽기 쉽게 단락 구분

**중요**: 제목부터 본문까지 완전한 블로그 글을 작성해주세요. 메타 설명이나 주석은 제외하고 바로 블로그 글 내용만 작성해주세요.`;
}
