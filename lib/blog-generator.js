import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API를 사용해서 블로그 글 생성
 * @param {Object} analysis - 커밋 분석 결과
 * @param {string} apiKey - Gemini API 키
 * @returns {Promise<string>} 생성된 블로그 글 (Markdown)
 */
export async function generateBlogPost(analysis, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = buildPrompt(analysis);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    throw new Error(`Gemini API 오류: ${error.message}`);
  }
}

/**
 * 분석 결과로부터 프롬프트 생성
 */
function buildPrompt(analysis) {
  const commitSummary = analysis.commits
    .map((c, i) => `${i + 1}. [${c.hash.slice(0, 7)}] ${c.message} (${c.additions}+ ${c.deletions}-)`)
    .join('\n');

  const fileTypesSummary = Object.entries(analysis.fileTypes)
    .sort(([, a], [, b]) => b - a)
    .map(([ext, count]) => `${ext}: ${count}개`)
    .join(', ');

  return `당신은 기술 블로그 작성 전문가입니다. 아래 Git 커밋 내역을 분석해서 **Velog 스타일의 기술 블로그 글**을 작성해주세요.

## 📊 커밋 분석 데이터

**기본 정보**:
- 커밋 수: ${analysis.totalCommits}개
- 파일 변경: ${analysis.filesChanged}개
- 추가: ${analysis.additions}줄, 삭제: ${analysis.deletions}줄
- 작업 카테고리: ${analysis.categories.join(', ')}
- 파일 타입: ${fileTypesSummary}

**커밋 내역**:
\`\`\`
${commitSummary}
\`\`\`

**주요 커밋 메시지**:
${analysis.messages.slice(0, 10).map((m, i) => `${i + 1}. ${m}`).join('\n')}

---

## 🎯 작성 요구사항

**글의 톤앤매너**:
- 친근하고 편안한 말투 (~했어요, ~였어요)
- 1인칭 시점 (저는, 제가)
- 기술적이지만 읽기 편한 설명

**구조** (반드시 포함):
1. **제목**: 이모지 포함, 흥미롭게
2. **들어가며**: 오늘/이번에 무엇을 했는지 간단히 소개
3. **주요 작업 내용**: 커밋 분석 기반으로 2-3개 섹션
   - 무엇을 했는지
   - 왜 했는지
   - 어떻게 했는지 (핵심 코드가 있다면 짐작해서 예시)
4. **배운 점**: 기술적 인사이트 1-2가지
5. **마무리**: 짧고 간단하게

**핵심 원칙**:
- 커밋 메시지에서 **실제로 한 작업**만 언급 (추측/상상 금지)
- 구체적인 숫자 활용 (파일 수, 줄 수, 커밋 수)
- 코드 예시는 간단하게 (전체 코드 X, 핵심만 O)
- 길이: 300-500줄 정도 (너무 길지 않게)

**예시 톤**:
"오늘은 API 연동 작업을 했어요. 처음에는 CORS 에러 때문에 막혔는데, \`Access-Control-Allow-Origin\` 설정으로 해결했어요."

---

**출력 형식**: 순수 Markdown (코드 블록 외 다른 wrapper 없이)

지금 바로 작성해주세요!`;
}

/**
 * 더 간단한 요약 글 생성 (빠른 버전)
 */
export async function generateQuickSummary(analysis, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `다음 Git 커밋을 3-5문장으로 요약해주세요:

커밋 수: ${analysis.totalCommits}개
카테고리: ${analysis.categories.join(', ')}
주요 메시지:
${analysis.messages.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')}

친근한 말투 (~했어요)로 작성하고, 기술적 핵심만 간단히 언급해주세요.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Quick Summary 생성 실패: ${error.message}`);
  }
}
