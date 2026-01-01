import * as vscode from 'vscode';
import { generateBlogPost } from './blog-generator';
import { getGitCommits } from './git-parser';

export class VelogWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'velog-auto-writer.webview';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        const html = this._getHtmlForWebview(webviewView.webview);
        console.log('HTML length:', html.length);
        console.log('Has custom prompt section:', html.includes('커스텀 프롬프트'));
        webviewView.webview.html = html;

        // 메시지 수신 처리
        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case 'saveApiKey':
                    await this._context.globalState.update('geminiApiKey', data.value);
                    vscode.window.showInformationMessage('API 키가 저장되었습니다!');
                    break;
                    
                case 'saveCustomPrompt':
                    await this._context.globalState.update('customPrompt', data.value);
                    vscode.window.showInformationMessage('커스텀 프롬프트가 저장되었습니다!');
                    break;
                    
                case 'generate':
                    await this._generateBlogPost(data);
                    break;
                    
                case 'getSettings':
                    const apiKey = this._context.globalState.get<string>('geminiApiKey', '');
                    const customPrompt = this._context.globalState.get<string>('customPrompt', '');
                    webviewView.webview.postMessage({
                        type: 'settings',
                        apiKey: apiKey ? '••••••••' : '',
                        customPrompt: customPrompt
                    });
                    break;
            }
        });
    }

    private async _generateBlogPost(data: any) {
        try {
            const apiKey = this._context.globalState.get<string>('geminiApiKey');
            if (!apiKey) {
                vscode.window.showErrorMessage('API 키를 먼저 설정해주세요!');
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Git 저장소가 있는 폴더를 먼저 열어주세요!');
                return;
            }

            this._view?.webview.postMessage({ type: 'generationStarted' });

            // Git 커밋 가져오기
            const commits = await getGitCommits(workspaceFolder.uri.fsPath, data.days || 7);

            if (commits.length === 0) {
                vscode.window.showWarningMessage('최근 커밋이 없습니다.');
                this._view?.webview.postMessage({ type: 'generationComplete' });
                return;
            }

            // 커스텀 프롬프트 가져오기
            const customPrompt = data.useCustomPrompt ? this._context.globalState.get<string>('customPrompt', '') : '';

            // 블로그 글 생성
            const blogContent = await generateBlogPost(commits, apiKey, customPrompt || undefined);

            // 새 에디터에 결과 표시
            const doc = await vscode.workspace.openTextDocument({
                content: blogContent,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);

            this._view?.webview.postMessage({ 
                type: 'generationComplete',
                success: true,
                message: '블로그 글이 생성되었습니다!'
            });

            vscode.window.showInformationMessage('✨ 블로그 글이 생성되었습니다!');

        } catch (error) {
            this._view?.webview.postMessage({ 
                type: 'generationComplete',
                success: false,
                message: `오류: ${error}`
            });
            vscode.window.showErrorMessage(`오류 발생: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Velog Auto Writer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        
        h2 {
            margin-bottom: 20px;
            color: var(--vscode-foreground);
            font-size: 20px;
        }
        
        .section {
            margin-bottom: 24px;
            padding: 16px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        
        .section h3 {
            margin-bottom: 12px;
            font-size: 14px;
            color: var(--vscode-foreground);
        }
        
        label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        
        input[type="password"],
        input[type="number"] {
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
        }
        
        textarea {
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            font-family: var(--vscode-editor-font-family);
            resize: vertical;
            min-height: 120px;
        }
        
        input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        
        button {
            width: 100%;
            padding: 10px;
            margin-top: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .status {
            margin-top: 12px;
            padding: 8px;
            font-size: 12px;
            border-radius: 4px;
            display: none;
        }
        
        .status.show {
            display: block;
        }
        
        .status.success {
            background-color: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
        }
        
        .status.error {
            background-color: var(--vscode-testing-iconFailed);
            color: var(--vscode-editor-background);
        }
        
        .status.loading {
            background-color: var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-editor-background);
        }
        
        .hint {
            margin-top: 8px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        .divider {
            margin: 20px 0;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .checkbox-container {
            display: flex;
            align-items: center;
            margin: 12px 0;
        }
        
        .checkbox-container input[type="checkbox"] {
            margin-right: 8px;
            width: auto;
        }
        
        .checkbox-container label {
            margin: 0;
            cursor: pointer;
        }
        
        .expandable {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .expandable.expanded {
            max-height: 500px;
        }
    </style>
</head>
<body>
    <h2>✍️ Velog Auto Writer</h2>
    
    <div class="section">
        <h3>🔑 API 설정</h3>
        <label for="apiKey">Gemini API Key</label>
        <input type="password" id="apiKey" placeholder="API 키를 입력하세요">
        <button onclick="saveApiKey()" class="btn-secondary">API 키 저장</button>
        <div class="hint">💡 API 키는 안전하게 저장되며, 다른 곳에 공유되지 않습니다.</div>
    </div>
    
    <div class="divider"></div>
    
    <div class="section">
        <h3>🎨 커스텀 프롬프트 (선택)</h3>
        <div class="hint" style="margin-bottom: 12px;">
            💡 AI에게 어떻게 글을 작성할지 직접 지시할 수 있어요. 비워두면 기본 프롬프트가 사용됩니다.
        </div>
        <textarea id="customPrompt" placeholder="예: 당신은 기술 블로그 작성 전문가입니다. 주니어 개발자가 이해하기 쉽게 작성해주세요..."></textarea>
        <button onclick="saveCustomPrompt()" class="btn-secondary">프롬프트 저장</button>
        <button onclick="resetCustomPrompt()" class="btn-secondary" style="margin-top: 4px;">기본값으로 리셋</button>
    </div>
    
    <div class="divider"></div>
    
    <div class="section">
        <h3>📝 블로그 글 생성</h3>
        <label for="days">분석할 기간 (일)</label>
        <input type="number" id="days" value="7" min="1" max="365">
        <div class="hint">최근 N일간의 Git 커밋을 분석합니다.</div>
        
        <div class="checkbox-container">
            <input type="checkbox" id="useCustomPrompt">
            <label for="useCustomPrompt">커스텀 프롬프트 사용하기</label>
        </div>
        
        <button onclick="generateBlog()" id="generateBtn">🚀 블로그 글 생성하기</button>
        <div id="status" class="status"></div>
    </div>
    
    <div class="divider"></div>
    
    <div class="hint">
        <strong>사용 방법:</strong><br>
        1. Gemini API 키를 설정하세요<br>
        2. (선택) 커스텀 프롬프트를 작성하고 저장하세요<br>
        3. 분석할 기간을 선택하세요<br>
        4. 커스텀 프롬프트를 사용할지 선택하세요<br>
        5. 생성 버튼을 클릭하세요!
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // 설정 불러오기
        vscode.postMessage({ type: 'getSettings' });
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'settings':
                    if (message.apiKey) {
                        document.getElementById('apiKey').placeholder = 'API 키가 설정되어 있습니다';
                    }
                    if (message.customPrompt) {
                        document.getElementById('customPrompt').value = message.customPrompt;
                    }
                    break;
                    
                case 'generationStarted':
                    showStatus('AI가 블로그 글을 작성하고 있어요... (30초 정도 걸려요)', 'loading');
                    document.getElementById('generateBtn').disabled = true;
                    break;
                    
                case 'generationComplete':
                    document.getElementById('generateBtn').disabled = false;
                    if (message.success) {
                        showStatus(message.message, 'success');
                    } else {
                        showStatus(message.message, 'error');
                    }
                    setTimeout(() => hideStatus(), 5000);
                    break;
            }
        });
        
        function saveApiKey() {
            const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                showStatus('API 키를 입력해주세요', 'error');
                return;
            }
            vscode.postMessage({
                type: 'saveApiKey',
                value: apiKey
            });
            document.getElementById('apiKey').value = '';
            document.getElementById('apiKey').placeholder = 'API 키가 설정되어 있습니다';
            showStatus('API 키가 저장되었습니다!', 'success');
            setTimeout(() => hideStatus(), 3000);
        }
        
        function saveCustomPrompt() {
            const customPrompt = document.getElementById('customPrompt').value.trim();
            vscode.postMessage({
                type: 'saveCustomPrompt',
                value: customPrompt
            });
            showStatus('커스텀 프롬프트가 저장되었습니다!', 'success');
            setTimeout(() => hideStatus(), 3000);
        }
        
        function resetCustomPrompt() {
            document.getElementById('customPrompt').value = '';
            vscode.postMessage({
                type: 'saveCustomPrompt',
                value: ''
            });
            showStatus('기본 프롬프트로 리셋되었습니다!', 'success');
            setTimeout(() => hideStatus(), 3000);
        }
        
        function generateBlog() {
            const days = parseInt(document.getElementById('days').value);
            const useCustomPrompt = document.getElementById('useCustomPrompt').checked;
            vscode.postMessage({
                type: 'generate',
                days: days,
                useCustomPrompt: useCustomPrompt
            });
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status show ' + type;
        }
        
        function hideStatus() {
            const status = document.getElementById('status');
            status.className = 'status';
        }
    </script>
</body>
</html>`;
    }
}
