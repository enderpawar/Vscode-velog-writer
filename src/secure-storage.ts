import * as vscode from 'vscode';
import { ApiKeyError } from './errors';

/**
 * API 키 관리를 위한 안전한 스토리지 클래스
 * VSCode Secret Storage API를 사용하여 보안 강화
 */
export class SecureStorage {
    private static readonly GEMINI_API_KEY = 'velog-auto-writer.geminiApiKey';
    private static readonly CUSTOM_PROMPT_KEY = 'velog-auto-writer.customPrompt';
    private static readonly EXAMPLE_URLS_KEY = 'velog-auto-writer.exampleUrls';

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Gemini API 키 저장 (암호화)
     */
    async saveApiKey(apiKey: string): Promise<void> {
        if (!apiKey || apiKey.trim().length === 0) {
            throw new ApiKeyError('유효한 API 키를 입력해주세요.');
        }

        // Secret Storage에 암호화하여 저장
        await this.context.secrets.store(SecureStorage.GEMINI_API_KEY, apiKey.trim());
    }

    /**
     * Gemini API 키 가져오기
     */
    async getApiKey(): Promise<string | undefined> {
        return await this.context.secrets.get(SecureStorage.GEMINI_API_KEY);
    }

    /**
     * API 키 삭제
     */
    async deleteApiKey(): Promise<void> {
        await this.context.secrets.delete(SecureStorage.GEMINI_API_KEY);
    }

    /**
     * API 키 유효성 검사
     */
    async validateApiKey(): Promise<boolean> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            return false;
        }

        // Gemini API 키 형식 검증 (간단한 패턴 체크)
        // 실제 키 형식: AIzaSy...
        return apiKey.startsWith('AIza') && apiKey.length > 30;
    }

    /**
     * 커스텀 프롬프트 저장
     */
    async saveCustomPrompt(prompt: string): Promise<void> {
        await this.context.globalState.update(SecureStorage.CUSTOM_PROMPT_KEY, prompt);
    }

    /**
     * 커스텀 프롬프트 가져오기
     */
    getCustomPrompt(): string {
        return this.context.globalState.get<string>(SecureStorage.CUSTOM_PROMPT_KEY, '');
    }

    /**
     * 예시 URL 저장
     */
    async saveExampleUrls(urls: string): Promise<void> {
        await this.context.globalState.update(SecureStorage.EXAMPLE_URLS_KEY, urls);
    }

    /**
     * 예시 URL 가져오기
     */
    getExampleUrls(): string {
        return this.context.globalState.get<string>(SecureStorage.EXAMPLE_URLS_KEY, '');
    }

    /**
     * 모든 설정 초기화
     */
    async clearAll(): Promise<void> {
        await this.deleteApiKey();
        await this.context.globalState.update(SecureStorage.CUSTOM_PROMPT_KEY, undefined);
        await this.context.globalState.update(SecureStorage.EXAMPLE_URLS_KEY, undefined);
    }

    /**
     * API 키 마스킹 (UI 표시용)
     */
    maskApiKey(apiKey: string): string {
        if (apiKey.length <= 8) {
            return '••••••••';
        }
        return apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4);
    }
}

/**
 * API 키 가져오기 헬퍼 함수 (하위 호환성)
 */
export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    const storage = new SecureStorage(context);

    // 먼저 새로운 Secret Storage에서 확인
    let apiKey = await storage.getApiKey();

    // 없으면 기존 globalState에서 마이그레이션
    if (!apiKey) {
        const legacyKey = context.globalState.get<string>('geminiApiKey');
        if (legacyKey) {
            await storage.saveApiKey(legacyKey);
            await context.globalState.update('geminiApiKey', undefined); // 기존 키 삭제
            apiKey = legacyKey;
        }
    }

    return apiKey;
}
