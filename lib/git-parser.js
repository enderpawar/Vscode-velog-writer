import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git 로그를 파싱해서 커밋 정보 추출
 * @param {string} repoPath - Git 저장소 경로
 * @param {number} days - 최근 N일간의 커밋
 * @returns {Promise<Array>} 커밋 정보 배열
 */
export async function parseGitLog(repoPath, days = 1) {
  try {
    // Git 저장소인지 확인
    await execAsync('git rev-parse --git-dir', { cwd: repoPath });
  } catch {
    throw new Error('Git 저장소가 아니에요. Git 프로젝트에서 실행해주세요.');
  }

  // 최근 N일간의 커밋 가져오기
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);
  const since = sinceDate.toISOString().split('T')[0];

  const gitLogFormat = [
    '%H',        // commit hash
    '%an',       // author name
    '%ae',       // author email
    '%ad',       // author date
    '%s',        // subject (message)
  ].join('%x1f'); // ASCII unit separator

  const command = `git log --since="${since}" --pretty=format:"${gitLogFormat}%x1e" --numstat`;

  try {
    const { stdout } = await execAsync(command, { cwd: repoPath, maxBuffer: 1024 * 1024 * 10 });
    
    if (!stdout.trim()) {
      return [];
    }

    return parseGitLogOutput(stdout);
  } catch (error) {
    throw new Error(`Git 로그 파싱 실패: ${error.message}`);
  }
}

/**
 * Git 로그 출력을 파싱
 */
function parseGitLogOutput(output) {
  const commits = [];
  const commitBlocks = output.split('\x1e').filter(Boolean);

  for (const block of commitBlocks) {
    const lines = block.trim().split('\n');
    const [hash, author, email, date, message] = lines[0].split('\x1f');

    // 파일 변경 정보 파싱
    const files = [];
    let additions = 0;
    let deletions = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const match = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
      if (match) {
        const [, added, deleted, filepath] = match;
        files.push(filepath);
        additions += added === '-' ? 0 : parseInt(added);
        deletions += deleted === '-' ? 0 : parseInt(deleted);
      }
    }

    commits.push({
      hash,
      author,
      email,
      date,
      message,
      files,
      additions,
      deletions,
    });
  }

  return commits;
}

/**
 * 특정 커밋의 diff 가져오기
 */
export async function getCommitDiff(repoPath, commitHash) {
  try {
    const { stdout } = await execAsync(`git show ${commitHash} --pretty=format:""`, {
      cwd: repoPath,
      maxBuffer: 1024 * 1024 * 10
    });
    return stdout;
  } catch (error) {
    throw new Error(`Diff 가져오기 실패: ${error.message}`);
  }
}
