import * as vscode from 'vscode';
import { generateBlogPost, BlogTemplate } from './blog-generator';
import { getGitCommits, GitCommitOptions, analyzeCommitStats, formatCommitStats } from './git-parser';
import { VelogWebviewProvider } from './webview-provider';
import { fetchVelogPost, analyzePostStyle, styleToPrompt } from './velog-fetcher';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Velog Auto Writer extension is now active!');

    // Webview Provider 등록
    try {
        const provider = new VelogWebviewProvider(context.extensionUri, context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(VelogWebviewProvider.viewType, provider)
        );
    } catch (error) {
        console.log('Webview provider already registered, skipping...');
    }

    // 블로그 글 생성 명령어
    const generateCommand = vscode.commands.registerCommand('velog-auto-writer.generate', async () => {
        try {
            // API 키 확인
            const apiKey = await getApiKey(context);
            if (!apiKey) {
                vscode.window.showErrorMessage('Gemini API 키를 먼저 설정해주세요!');
                return;
            }

            // 워크스페이스 확인
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Git 저장소가 있는 폴더를 먼저 열어주세요!');
                return;
            }

            // 진행 상황 표시
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Velog 블로그 글 생성 중...",
                cancellable: false
            }, async (progress) => {
                // 1. 템플릿 선택
                const template = await vscode.window.showQuickPick(
                    [
                        { label: '📝 기본', description: '일반적인 기술 블로그 글', value: 'default' },
                        { label: '🎯 튜토리얼', description: '단계별 따라하기 가이드', value: 'tutorial' },
                        { label: '📝 개발일지', description: '일기 형식의 개발 로그', value: 'devlog' },
                        { label: '🐛 문제해결', description: '트러블슈팅 과정 공유', value: 'troubleshooting' },
                        { label: '🔍 회고', description: '프로젝트 회고록', value: 'retrospective' }
                    ],
                    { 
                        placeHolder: '블로그 글 스타일을 선택하세요',
                        ignoreFocusOut: true
                    }
                );
                
                if (!template) return;
                
                // 2. 필터 옵션
                const useFilter = await vscode.window.showQuickPick(
                    ['전체 커밋', '특정 경로만 필터링'],
                    { placeHolder: '커밋 범위를 선택하세요' }
                );
                
                let options: GitCommitOptions = { includeFiles: true };
                
                if (useFilter === '특정 경로만 필터링') {
                    const pathFilter = await vscode.window.showInputBox({
                        prompt: '필터링할 경로를 입력하세요 (예: "src/", "*.ts")',
                        placeHolder: 'src/',
                        ignoreFocusOut: true
                    });
                    if (pathFilter) {
                        options.pathFilter = pathFilter;
                    }
                }
                
                // 3. Git 커밋 가져오기
                progress.report({ increment: 0, message: "Git 커밋 분석 중..." });
                const commits = await getGitCommits(workspaceFolder.uri.fsPath, 7, options);

                if (commits.length === 0) {
                    vscode.window.showWarningMessage('최근 커밋이 없습니다.');
                    return;
                }

                vscode.window.showInformationMessage(`${commits.length}개 커밋 발견`);

                // 4. 통계 정보 포함 여부
                const includeStats = await vscode.window.showQuickPick(
                    ['네, 통계 포함', '아니요, 글만 작성'],
                    { placeHolder: '커밋 통계 정보를 포함할까요?' }
                );

                // 5. 블로그 글 생성
                progress.report({ increment: 30, message: "AI가 블로그 글 작성 중..." });
                const blogContent = await generateBlogPost(
                    commits, 
                    apiKey, 
                    undefined, 
                    undefined, 
                    template.value as BlogTemplate,
                    includeStats === '네, 통계 포함'
                );

                // 6. 새 에디터에 결과 표시
                progress.report({ increment: 90, message: "완료!" });
                
                // 자동 저장 옵션
                const autoSave = await vscode.window.showQuickPick(
                    ['에디터에만 보기', '파일로 저장'],
                    { placeHolder: '생성된 글을 어떻게 할까요?' }
                );
                
                let doc: vscode.TextDocument;
                
                if (autoSave === '파일로 저장') {
                    const today = new Date().toISOString().split('T')[0];
                    const fileName = `blog-post-${today}.md`;
                    const filePath = path.join(workspaceFolder.uri.fsPath, fileName);
                    
                    fs.writeFileSync(filePath, blogContent, 'utf8');
                    doc = await vscode.workspace.openTextDocument(filePath);
                    vscode.window.showInformationMessage(`✨ 블로그 글이 ${fileName}에 저장되었습니다!`);
                } else {
                    doc = await vscode.workspace.openTextDocument({
                        content: blogContent,
                        language: 'markdown'
                    });
                    vscode.window.showInformationMessage('✨ 블로그 글이 생성되었습니다!');
                }
                
                await vscode.window.showTextDocument(doc);
            });

        } catch (error) {
            vscode.window.showErrorMessage(`오류 발생: ${error}`);
        }
    });

    // API 키 설정 명령어
    const setApiKeyCommand = vscode.commands.registerCommand('velog-auto-writer.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Gemini API 키를 입력하세요',
            password: true,
            ignoreFocusOut: true
        });

        if (apiKey) {
            await context.globalState.update('geminiApiKey', apiKey);
            vscode.window.showInformationMessage('API 키가 저장되었습니다!');
        }
    });
    
    // 커밋 통계 보기 명령어
    const viewStatsCommand = vscode.commands.registerCommand('velog-auto-writer.viewStats', async () => {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Git 저장소가 있는 폴더를 먼저 열어주세요!');
                return;
            }
            
            const daysInput = await vscode.window.showInputBox({
                prompt: '최근 며칠간의 커밋을 분석할까요?',
                value: '7',
                validateInput: (value) => {
                    return isNaN(Number(value)) ? '숫자를 입력하세요' : null;
                }
            });
            
            if (!daysInput) return;
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "커밋 통계 분석 중...",
                cancellable: false
            }, async (progress) => {
                const commits = await getGitCommits(workspaceFolder.uri.fsPath, Number(daysInput), { includeFiles: true });
                
                if (commits.length === 0) {
                    vscode.window.showWarningMessage('최근 커밋이 없습니다.');
                    return;
                }
                
                const stats = analyzeCommitStats(commits);
                const statsText = formatCommitStats(stats);
                
                const doc = await vscode.workspace.openTextDocument({
                    content: statsText,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`오류 발생: ${error}`);
        }
    });

    context.subscriptions.push(generateCommand, setApiKeyCommand, viewStatsCommand);
}

async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    let apiKey = context.globalState.get<string>('geminiApiKey');
    
    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({
            prompt: 'Gemini API 키를 입력하세요 (다음부터는 저장됩니다)',
            password: true,
            ignoreFocusOut: true
        });

        if (apiKey) {
            await context.globalState.update('geminiApiKey', apiKey);
        }
    }

    return apiKey;
}

export function deactivate() {}
