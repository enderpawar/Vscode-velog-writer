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
        
        const { stdout } = await execAsync(
            `git log "--pretty=format:%H|%s|%an|%ad" --date=short --since=${since}`,
            { cwd: repoPath, shell: 'powershell.exe' }
        );

        if (!stdout.trim()) {
            return [];
        }

        const lines = stdout.trim().split('\n');
        const commits: GitCommit[] = [];

        for (const line of lines) {
            const [hash, message, author, date] = line.split('|');
            
            // 커밋별 통계 가져오기
            try {
                const { stdout: statOutput } = await execAsync(
                    `git show --stat "--format=" ${hash}`,
                    { cwd: repoPath, shell: 'powershell.exe' }
                );

                const additions = (statOutput.match(/(\d+) insertion/)?.[1]) || '0';
                const deletions = (statOutput.match(/(\d+) deletion/)?.[1]) || '0';

                commits.push({
                    hash,
                    message: message.trim(),
                    author: author.trim(),
                    date: date.trim(),
                    additions: parseInt(additions),
                    deletions: parseInt(deletions)
                });
            } catch {
                commits.push({
                    hash,
                    message: message.trim(),
                    author: author.trim(),
                    date: date.trim(),
                    additions: 0,
                    deletions: 0
                });
            }
        }

        return commits;
    } catch (error) {
        throw new Error(`Git 커밋을 가져오는데 실패했습니다: ${error}`);
    }
}
