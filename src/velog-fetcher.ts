import axios from 'axios';

export interface VelogPost {
    title: string;
    content: string;
    url: string;
}

export interface PostStyle {
    hasEmoji: boolean;
    averageSectionLength: number;
    codeBlockCount: number;
    headingLevels: number[];
    commonPhrases: string[];
    toneAnalysis: string;
}

/**
 * Velog URL에서 글 내용을 가져옵니다
 */
export async function fetchVelogPost(url: string): Promise<VelogPost> {
    try {
        // URL 검증
        const urlPattern = /velog\.io\/@[\w-]+\/[\w-]+/;
        if (!urlPattern.test(url)) {
            throw new Error('올바른 Velog URL 형식이 아닙니다. (예: https://velog.io/@username/post-title)');
        }

        // Velog GraphQL API 사용
        const username = url.match(/@([\w-]+)\//)?.[1];
        const urlSlug = url.split('/').pop();

        if (!username || !urlSlug) {
            throw new Error('URL에서 사용자명 또는 글 제목을 추출할 수 없습니다.');
        }

        // HTML 페이지 가져오기 (서버사이드 렌더링된 콘텐츠 포함)
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const html = response.data;

        // 제목 추출
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : '';

        // 본문 추출 (여러 방법 시도)
        let content = '';
        
        // 방법 1: script 태그에서 JSON 데이터 추출
        const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
        if (scriptMatch) {
            try {
                const jsonData = JSON.parse(scriptMatch[1]);
                content = jsonData?.props?.pageProps?.post?.body || '';
            } catch (e) {
                // JSON 파싱 실패 시 다음 방법으로
            }
        }

        // 방법 2: meta description 활용 (짧은 내용이라도 가져오기)
        if (!content) {
            const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
            if (descMatch) {
                content = descMatch[1];
            }
        }

        // 방법 3: article 태그 내용 추출
        if (!content) {
            const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
            if (articleMatch) {
                // HTML 태그 제거 및 텍스트만 추출 (간단한 방법)
                content = articleMatch[1]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
        }

        if (!content) {
            throw new Error('글 내용을 가져올 수 없습니다. 비공개 글이거나 접근할 수 없는 글일 수 있습니다.');
        }

        return {
            title: title || '제목 없음',
            content,
            url
        };

    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error('글을 찾을 수 없습니다. URL을 확인해주세요.');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
        }
        throw new Error(`글을 가져오는 중 오류 발생: ${error.message}`);
    }
}

/**
 * 여러 Velog 글의 스타일을 분석합니다
 */
export function analyzePostStyle(posts: VelogPost[]): PostStyle {
    let totalEmoji = 0;
    let totalSections = 0;
    let totalSectionLength = 0;
    let totalCodeBlocks = 0;
    const allHeadings: number[] = [];
    const phrases: string[] = [];

    posts.forEach(post => {
        const content = post.content;

        // 이모지 사용 여부
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        if (emojiRegex.test(content)) {
            totalEmoji++;
        }

        // 섹션 분석 (# 헤딩으로 구분)
        const sections = content.split(/^#{1,6}\s/m);
        totalSections += sections.length;
        sections.forEach(section => {
            totalSectionLength += section.length;
        });

        // 코드 블록 개수
        const codeBlocks = content.match(/```[\s\S]*?```/g);
        totalCodeBlocks += codeBlocks ? codeBlocks.length : 0;

        // 헤딩 레벨 수집
        const headings = content.match(/^#{1,6}/gm);
        if (headings) {
            headings.forEach(h => allHeadings.push(h.length));
        }

        // 자주 사용하는 표현 수집
        const commonExpressions = [
            '이번 주', '저번 주', '이번에는', '오늘은',
            '배웠습니다', '공부했습니다', '구현했습니다', '개발했습니다',
            '느낀 점', '배운 점', '다음 계획', '앞으로',
            '💡', '🚀', '✨', '🔥', '💻', '📚', '🎯', '🐛'
        ];
        
        commonExpressions.forEach(expr => {
            if (content.includes(expr)) {
                phrases.push(expr);
            }
        });
    });

    // 톤 분석 (간단한 휴리스틱)
    const hasEmoji = totalEmoji > 0;
    const avgSectionLength = totalSections > 0 ? Math.floor(totalSectionLength / totalSections) : 0;
    
    let tone = '전문적이고 객관적인';
    if (hasEmoji && phrases.length > 5) {
        tone = '친근하고 개인적인';
    } else if (hasEmoji) {
        tone = '캐주얼하면서도 전문적인';
    }

    return {
        hasEmoji: hasEmoji,
        averageSectionLength: avgSectionLength,
        codeBlockCount: Math.floor(totalCodeBlocks / posts.length),
        headingLevels: [...new Set(allHeadings)].sort(),
        commonPhrases: [...new Set(phrases)],
        toneAnalysis: tone
    };
}

/**
 * 분석된 스타일을 프롬프트 형식으로 변환합니다
 */
export function styleToPrompt(style: PostStyle, examplePosts: VelogPost[]): string {
    const examples = examplePosts.map(post => 
        `### 예시 글: ${post.title}\n${post.content.substring(0, 500)}...\n`
    ).join('\n');

    return `
## 📝 작성 스타일 가이드 (기존 글 분석 기반)

작성자의 기존 블로그 글들을 분석한 결과:
- **톤**: ${style.toneAnalysis} 스타일
- **이모지 사용**: ${style.hasEmoji ? '자주 사용함 (각 섹션에 적절히 활용)' : '거의 사용하지 않음'}
- **평균 섹션 길이**: ${style.averageSectionLength}자 정도
- **코드 블록**: 평균 ${style.codeBlockCount}개 사용
- **헤딩 레벨**: ${style.headingLevels.join(', ')}레벨 주로 사용
- **자주 쓰는 표현**: ${style.commonPhrases.slice(0, 10).join(', ')}

### 예시 글 참고

${examples}

**위 예시 글의 스타일과 톤을 반영하여 새로운 글을 작성해주세요.**
특히 다음을 유지해주세요:
1. 문장의 길이와 리듬
2. 이모지 사용 패턴
3. 섹션 구성 방식
4. 전문성과 친근함의 밸런스
`;
}
