/**
 * 커밋 목록을 분석해서 블로그 글 작성에 필요한 정보 추출
 * @param {Array} commits - 커밋 정보 배열
 * @returns {Object} 분석 결과
 */
export function analyzeCommits(commits) {
  const analysis = {
    totalCommits: commits.length,
    authors: new Set(),
    filesChanged: new Set(),
    additions: 0,
    deletions: 0,
    messages: [],
    categories: [],
    fileTypes: {},
    timeline: [],
  };

  // 커밋 분석
  commits.forEach((commit) => {
    analysis.authors.add(commit.author);
    analysis.additions += commit.additions;
    analysis.deletions += commit.deletions;
    analysis.messages.push(commit.message);

    // 파일 확장자별 분류
    commit.files.forEach((file) => {
      analysis.filesChanged.add(file);
      const ext = file.split('.').pop().toLowerCase();
      analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
    });

    // 타임라인
    analysis.timeline.push({
      hash: commit.hash,
      message: commit.message,
      date: commit.date,
      changes: commit.additions + commit.deletions,
    });
  });

  // 카테고리 추론
  analysis.categories = inferCategories(commits);

  return {
    totalCommits: analysis.totalCommits,
    authors: Array.from(analysis.authors),
    filesChanged: analysis.filesChanged.size,
    additions: analysis.additions,
    deletions: analysis.deletions,
    messages: analysis.messages,
    categories: analysis.categories,
    fileTypes: analysis.fileTypes,
    timeline: analysis.timeline,
    commits: commits, // 원본 커밋 데이터 포함
  };
}

/**
 * 커밋 메시지와 파일명으로부터 작업 카테고리 추론
 */
function inferCategories(commits) {
  const categories = new Set();

  const patterns = {
    '기능 추가': /feat|add|implement|create/i,
    '버그 수정': /fix|bug|issue|resolve/i,
    '리팩토링': /refactor|clean|improve/i,
    '스타일링': /style|css|design|ui/i,
    '문서화': /doc|readme|comment/i,
    '테스트': /test|spec/i,
    '성능 개선': /perf|optimize|speed/i,
    '의존성': /dep|package|install|upgrade/i,
    '설정': /config|setup|env/i,
  };

  commits.forEach((commit) => {
    const text = `${commit.message} ${commit.files.join(' ')}`;
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        categories.add(category);
      }
    }
  });

  return categories.size > 0 ? Array.from(categories) : ['개발'];
}

/**
 * 주요 변경 파일 추출 (변경량 기준)
 */
export function extractMajorChanges(commits, topN = 5) {
  const fileChanges = {};

  commits.forEach((commit) => {
    commit.files.forEach((file, index) => {
      if (!fileChanges[file]) {
        fileChanges[file] = {
          file,
          changes: 0,
          commits: [],
        };
      }
      fileChanges[file].changes += commit.additions + commit.deletions;
      fileChanges[file].commits.push(commit.hash);
    });
  });

  return Object.values(fileChanges)
    .sort((a, b) => b.changes - a.changes)
    .slice(0, topN);
}
