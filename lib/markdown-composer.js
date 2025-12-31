import fs from 'fs/promises';
import path from 'path';

/**
 * 블로그 글을 Markdown 파일로 저장
 * @param {string} content - 블로그 글 내용
 * @param {string} outputPath - 저장할 경로
 * @returns {Promise<string>} 저장된 파일 경로
 */
export async function saveToBlogFile(content, outputPath) {
  // 출력 경로 정규화
  const fullPath = path.resolve(outputPath);
  const dir = path.dirname(fullPath);

  // 디렉토리가 없으면 생성
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // 이미 존재하면 무시
  }

  // 파일 저장
  await fs.writeFile(fullPath, content, 'utf-8');

  return fullPath;
}

/**
 * 기존 파일에 섹션 추가
 */
export async function appendToExistingPost(existingPath, newContent) {
  try {
    const existing = await fs.readFile(existingPath, 'utf-8');
    const separator = '\n\n---\n\n';
    const combined = existing + separator + newContent;
    await fs.writeFile(existingPath, combined, 'utf-8');
    return existingPath;
  } catch (error) {
    throw new Error(`파일 추가 실패: ${error.message}`);
  }
}

/**
 * 날짜별 파일명 생성
 */
export function generateDateBasedFilename(prefix = 'blog-post') {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}-${dateStr}.md`;
}

/**
 * 메타데이터 추가 (Velog 포맷)
 */
export function addVelogMetadata(content, tags = [], isPrivate = false) {
  const metadata = [
    '---',
    `tags: ${tags.join(', ')}`,
    `published: ${!isPrivate}`,
    `date: ${new Date().toISOString()}`,
    '---',
    '',
  ].join('\n');

  return metadata + content;
}
