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
}

export async function getGitCommits(repoPath: string, days: number = 7): Promise<GitCommit[]> {
    try {
        const since = `${days}.days.ago`;
        
        // numstat을 사용하여 한 번에 모든 정보 가져오기 (훨씬 빠름!)
        const { stdout } = await execAsync(
            `git log "--pretty=format:%H|%s|%an|%ad" --date=short --numstat --since=${since}`,
            { cwd: repoPath, shell: 'powershell.exe', timeout: 10000 }
        );

        if (!stdout.trim()) {
            return [];
        }

        const commits: GitCommit[] = [];
        const lines = stdout.trim().split('\n');
        
        let currentCommit: Partial<GitCommit> | null = null;

        for (const line of lines) {
            if (!line.trim()) continue;

            // 커밋 헤더 라인 (|를 포함)
            if (line.includes('|')) {
                // 이전 커밋이 있으면 저장
                if (currentCommit && currentCommit.hash) {
                    commits.push({
                        hash: currentCommit.hash,
                        message: currentCommit.message || '',
                        author: currentCommit.author || '',
                        date: currentCommit.date || '',
                        additions: currentCommit.additions || 0,
                        deletions: currentCommit.deletions || 0
                    });
                }

                // 새 커밋 시작
                const [hash, message, author, date] = line.split('|');
                currentCommit = {
                    hash: hash.trim(),
                    message: message.trim(),
                    author: author.trim(),
                    date: date.trim(),
                    additions: 0,
                    deletions: 0
                };
            } else if (currentCommit) {
                // numstat 라인 (additions deletions filename)
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    const add = parseInt(parts[0]) || 0;
                    const del = parseInt(parts[1]) || 0;
                    currentCommit.additions = (currentCommit.additions || 0) + add;
                    currentCommit.deletions = (currentCommit.deletions || 0) + del;
                }
            }
        }

        // 마지막 커밋 저장
        if (currentCommit && currentCommit.hash) {
            commits.push({
                hash: currentCommit.hash,
                message: currentCommit.message || '',
                author: currentCommit.author || '',
                date: currentCommit.date || '',
                additions: currentCommit.additions || 0,
                deletions: currentCommit.deletions || 0
            });
        }

        return commits;
    } catch (error: any) {
        if (error.killed) {
            throw new Error('Git 명령 실행 시간이 초과되었습니다. 커밋이 너무 많거나 저장소가 큽니다.');
        }
        throw new Error(`Git 커밋을 가져오는데 실패했습니다: ${error.message || error}`);
    }
}
