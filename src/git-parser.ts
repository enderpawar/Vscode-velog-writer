import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
    additions: number;
    deletions: number;
    files?: string[];
}

export interface CommitStats {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    authors: Map<string, number>;
    fileTypes: Map<string, number>;
    commitsByDay: Map<string, number>;
    commitCategories?: Map<string, number>; // feat, fix, docs 등
    largeCommits?: GitCommit[]; // 큰 변경사항이 있는 커밋
    avgCommitSize?: number; // 평균 커밋 크기
    hourlyActivity?: Map<number, number>; // 시간대별 활동
}

export interface GitCommitOptions {
    days?: number;
    pathFilter?: string; // 특정 경로만 필터링 (예: "src/", "*.ts")
    author?: string; // 특정 작성자만 필터링
    includeFiles?: boolean; // 파일 목록 포함 여부
    branch?: string; // 특정 브랜치만 필터링
    maxCommits?: number; // 최대 커밋 수 제한
}

export async function getGitCommits(
    repoPath: string,
    days: number = 7,
    options?: GitCommitOptions
): Promise<GitCommit[]> {
    try {
        const since = `${options?.days || days}.days.ago`;
        let gitCommand = `git log "--pretty=format:%H|%s|%an|%ad" --date=short --numstat --since=${since}`;

        // 브랜치 필터 추가
        if (options?.branch) {
            gitCommand += ` ${options.branch}`;
        }

        // 최대 커밋 수 제한
        if (options?.maxCommits) {
            gitCommand += ` -n ${options.maxCommits}`;
        }

        // 경로 필터 추가
        if (options?.pathFilter) {
            gitCommand += ` -- "${options.pathFilter}"`;
        }

        // 작성자 필터 추가
        if (options?.author) {
            gitCommand += ` --author="${options.author}"`;
        }

        // numstat을 사용하여 한 번에 모든 정보 가져오기
        const { stdout } = await execAsync(gitCommand, { cwd: repoPath, maxBuffer: 1024 * 1024 * 10, timeout: 15000 });

        if (!stdout.trim()) {
            return [];
        }

        return parseGitLog(stdout, options?.includeFiles);
    } catch (error: any) {
        if (error.killed || error.signal === 'SIGTERM') {
            throw new Error('Git 명령 실행 시간이 초과되었습니다. 커밋이 너무 많거나 저장소가 큽니다.');
        }
        if (error.code === 'ENOENT') {
            throw new Error('Git이 설치되어 있지 않거나 경로를 찾을 수 없습니다.');
        }
        if (error.stderr?.includes('not a git repository')) {
            throw new Error('유효한 Git 저장소가 아닙니다.');
        }
        if (error.stderr?.includes('does not have any commits')) {
            return [];
        }
        throw new Error(`Git 커밋을 가져오는데 실패했습니다: ${error.message || error}`);
    }
}

/**
 * Git log 출력을 파싱하여 커밋 배열로 변환
 */
function parseGitLog(stdout: string, includeFiles?: boolean): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = stdout.trim().split('\n');

    let currentCommit: GitCommit | null = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            continue;
        }

        // 커밋 헤더 라인 (|를 포함)
        if (trimmedLine.includes('|')) {
            // 이전 커밋이 있으면 저장
            if (currentCommit) {
                commits.push(currentCommit);
            }

            // 새 커밋 시작
            const [hash, message, author, date] = trimmedLine.split('|');
            currentCommit = {
                hash: hash.trim(),
                message: message.trim(),
                author: author.trim(),
                date: date.trim(),
                additions: 0,
                deletions: 0,
                files: includeFiles ? [] : undefined,
            };
        } else if (currentCommit) {
            // numstat 라인 (additions deletions filename)
            const parts = trimmedLine.split(/\s+/);
            if (parts.length >= 3) {
                const add = parseInt(parts[0]);
                const del = parseInt(parts[1]);

                if (!isNaN(add) && !isNaN(del)) {
                    currentCommit.additions += add;
                    currentCommit.deletions += del;

                    // 파일 이름 저장
                    if (includeFiles) {
                        const fileName = parts.slice(2).join(' ');
                        currentCommit.files?.push(fileName);
                    }
                }
            }
        }
    }

    // 마지막 커밋 저장
    if (currentCommit) {
        commits.push(currentCommit);
    }

    return commits;
}

/**
 * 커밋 메시지가 유효한지 검증
 */
export function validateCommitMessage(message: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!message || message.trim().length === 0) {
        issues.push('커밋 메시지가 비어있습니다.');
    }

    if (message.length > 100) {
        issues.push('커밋 메시지가 너무 깁니다 (100자 초과).');
    }

    if (message.startsWith('WIP') || message.startsWith('wip')) {
        issues.push('WIP(작업 중) 커밋입니다.');
    }

    return {
        valid: issues.length === 0,
        issues,
    };
}

/**
 * 커밋 메시지에서 카테고리 추출 (Conventional Commits)
 */
export function extractCommitCategory(message: string): string {
    const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/i;
    const match = message.match(conventionalPattern);

    if (match) {
        return match[1].toLowerCase();
    }

    // 한글 패턴도 감지
    if (message.includes('기능') || message.includes('추가')) {
        return 'feat';
    }
    if (message.includes('수정') || message.includes('버그')) {
        return 'fix';
    }
    if (message.includes('문서')) {
        return 'docs';
    }
    if (message.includes('리팩토링') || message.includes('개선')) {
        return 'refactor';
    }
    if (message.includes('테스트')) {
        return 'test';
    }
    if (message.includes('스타일')) {
        return 'style';
    }

    return 'other';
}

/**
 * 시간대별 활동 패턴 분석을 위한 시간 추출
 */
export async function getCommitTimestamps(repoPath: string, days: number = 7): Promise<Date[]> {
    try {
        const since = `${days}.days.ago`;
        const gitCommand = `git log --pretty=format:%ai --since=${since}`;

        const { stdout } = await execAsync(gitCommand, { cwd: repoPath, maxBuffer: 1024 * 1024 });

        if (!stdout.trim()) {
            return [];
        }

        return stdout
            .trim()
            .split('\n')
            .map(dateStr => new Date(dateStr));
    } catch (error) {
        return [];
    }
}

/**
 * 코드 리뷰가 필요한 큰 커밋 찾기
 */
export function findLargeCommits(commits: GitCommit[], threshold: number = 200): GitCommit[] {
    return commits
        .filter(commit => commit.additions + commit.deletions > threshold)
        .sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
}

export function analyzeCommitStats(commits: GitCommit[]): CommitStats {
    const stats: CommitStats = {
        totalCommits: commits.length,
        totalAdditions: 0,
        totalDeletions: 0,
        authors: new Map(),
        fileTypes: new Map(),
        commitsByDay: new Map(),
        commitCategories: new Map(),
        largeCommits: [],
        avgCommitSize: 0,
    };

    let totalChanges = 0;

    commits.forEach(commit => {
        // 총 변경사항
        stats.totalAdditions += commit.additions;
        stats.totalDeletions += commit.deletions;
        totalChanges += commit.additions + commit.deletions;

        // 작성자별 커밋 수
        stats.authors.set(commit.author, (stats.authors.get(commit.author) || 0) + 1);

        // 날짜별 커밋 수
        stats.commitsByDay.set(commit.date, (stats.commitsByDay.get(commit.date) || 0) + 1);

        // 커밋 카테고리 분석
        const category = extractCommitCategory(commit.message);
        stats.commitCategories!.set(category, (stats.commitCategories!.get(category) || 0) + 1);

        // 파일 타입별 통계
        if (commit.files) {
            commit.files.forEach(file => {
                const ext = file.split('.').pop()?.toLowerCase() || 'unknown';
                stats.fileTypes.set(ext, (stats.fileTypes.get(ext) || 0) + 1);
            });
        }
    });

    // 평균 커밋 크기 계산
    stats.avgCommitSize = commits.length > 0 ? Math.round(totalChanges / commits.length) : 0;

    // 큰 커밋 찾기
    stats.largeCommits = findLargeCommits(commits, 200);

    return stats;
}

export function formatCommitStats(stats: CommitStats): string {
    let output = '## 📊 커밋 통계\n\n';

    output += `**총 커밋 수**: ${stats.totalCommits}개\n`;
    output += `**변경 사항**: +${stats.totalAdditions} -${stats.totalDeletions}\n\n`;

    // 작성자별 통계
    if (stats.authors.size > 0) {
        output += '### 👥 작성자별 커밋\n';
        const sortedAuthors = Array.from(stats.authors.entries()).sort((a, b) => b[1] - a[1]);
        sortedAuthors.forEach(([author, count]) => {
            const percentage = ((count / stats.totalCommits) * 100).toFixed(1);
            output += `- **${author}**: ${count}개 (${percentage}%)\n`;
        });
        output += '\n';
    }

    // 파일 타입별 통계
    if (stats.fileTypes.size > 0) {
        output += '### 📁 파일 타입별 변경\n';
        const sortedTypes = Array.from(stats.fileTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // 상위 10개만
        sortedTypes.forEach(([type, count]) => {
            output += `- \`.${type}\`: ${count}개 파일\n`;
        });
        output += '\n';
    }

    // 활동 히트맵
    if (stats.commitsByDay.size > 0) {
        output += '### 📅 일별 활동\n';
        const sortedDays = Array.from(stats.commitsByDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        sortedDays.forEach(([date, count]) => {
            const bar = '█'.repeat(Math.min(count, 20));
            output += `- ${date}: ${bar} (${count})\n`;
        });
    }

    // 커밋 카테고리
    if (stats.commitCategories && stats.commitCategories.size > 0) {
        output += '\n### 🏷️ 커밋 카테고리\n';
        const sortedCategories = Array.from(stats.commitCategories.entries()).sort((a, b) => b[1] - a[1]);
        const categoryEmojis: { [key: string]: string } = {
            feat: '✨',
            fix: '🐛',
            docs: '📝',
            style: '💄',
            refactor: '♻️',
            test: '✅',
            chore: '🔧',
            perf: '⚡',
            other: '📦',
        };
        sortedCategories.forEach(([category, count]) => {
            const emoji = categoryEmojis[category] || '📦';
            const percentage = ((count / stats.totalCommits) * 100).toFixed(1);
            output += `- ${emoji} **${category}**: ${count}개 (${percentage}%)\n`;
        });
        output += '\n';
    }

    // 평균 커밋 크기
    if (stats.avgCommitSize) {
        output += `### 📏 평균 커밋 크기\n`;
        output += `**${stats.avgCommitSize}**줄 변경/커밋\n\n`;
    }

    // 큰 커밋 경고
    if (stats.largeCommits && stats.largeCommits.length > 0) {
        output += '### ⚠️ 리뷰 필요 (큰 커밋)\n';
        stats.largeCommits.slice(0, 5).forEach(commit => {
            const changes = commit.additions + commit.deletions;
            output += `- \`${commit.hash.substring(0, 7)}\` ${commit.message.substring(0, 50)} (+${commit.additions}/-${commit.deletions} = ${changes}줄)\n`;
        });
        output += '\n';
    }

    return output;
}
