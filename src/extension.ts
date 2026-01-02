import * as vscode from 'vscode';
import { generateBlogPost } from './blog-generator';
import { getGitCommits } from './git-parser';
import { VelogWebviewProvider } from './webview-provider';
import { fetchVelogPost, analyzePostStyle, styleToPrompt } from './velog-fetcher';

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
                // 1. Git 커밋 가져오기
                progress.report({ increment: 0, message: "Git 커밋 분석 중..." });
                const commits = await getGitCommits(workspaceFolder.uri.fsPath, 7);

                if (commits.length === 0) {
                    vscode.window.showWarningMessage('최근 커밋이 없습니다.');
                    return;
                }

                vscode.window.showInformationMessage(`${commits.length}개 커밋 발견`);

                // 2. 블로그 글 생성
                progress.report({ increment: 30, message: "AI가 블로그 글 작성 중..." });
                const blogContent = await generateBlogPost(commits, apiKey);

                // 3. 새 에디터에 결과 표시
                progress.report({ increment: 90, message: "완료!" });
                const doc = await vscode.workspace.openTextDocument({
                    content: blogContent,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage('✨ 블로그 글이 생성되었습니다!');
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

    context.subscriptions.push(generateCommand, setApiKeyCommand);
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
