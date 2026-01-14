import { describe, it, expect, beforeEach } from 'vitest';
import { SecureStorage } from '../secure-storage';
import { ApiKeyError } from '../errors';

describe('SecureStorage', () => {
    // Mock VSCode context
    let mockContext: any;
    let storage: SecureStorage;

    beforeEach(() => {
        const secrets = new Map<string, string>();
        const globalState = new Map<string, any>();

        mockContext = {
            secrets: {
                store: async (key: string, value: string) => secrets.set(key, value),
                get: async (key: string) => secrets.get(key),
                delete: async (key: string) => secrets.delete(key),
            },
            globalState: {
                update: async (key: string, value: any) => globalState.set(key, value),
                get: (key: string, defaultValue?: any) => globalState.get(key) ?? defaultValue,
            },
        };

        storage = new SecureStorage(mockContext);
    });

    describe('API Key Management', () => {
        it('should save and retrieve API key', async () => {
            const testKey = 'AIzaSyTest1234567890abcdefghijklmnop';
            await storage.saveApiKey(testKey);
            const retrieved = await storage.getApiKey();
            expect(retrieved).toBe(testKey);
        });

        it('should throw error for empty API key', async () => {
            await expect(storage.saveApiKey('')).rejects.toThrow(ApiKeyError);
        });

        it('should validate API key format', async () => {
            await storage.saveApiKey('AIzaSyTest1234567890abcdefghijklmnop');
            const isValid = await storage.validateApiKey();
            expect(isValid).toBe(true);
        });

        it('should reject invalid API key format', async () => {
            await storage.saveApiKey('invalid-key');
            const isValid = await storage.validateApiKey();
            expect(isValid).toBe(false);
        });

        it('should mask API key for display', () => {
            const key = 'AIzaSyTest1234567890abcdefghijklmnop';
            const masked = storage.maskApiKey(key);
            expect(masked).toContain('••••');
            expect(masked).toContain('AIza');
            expect(masked).toContain('mnop');
        });

        it('should delete API key', async () => {
            await storage.saveApiKey('AIzaSyTest1234567890abcdefghijklmnop');
            await storage.deleteApiKey();
            const retrieved = await storage.getApiKey();
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Custom Prompt Management', () => {
        it('should save and retrieve custom prompt', async () => {
            const prompt = 'Write in a friendly tone';
            await storage.saveCustomPrompt(prompt);
            const retrieved = storage.getCustomPrompt();
            expect(retrieved).toBe(prompt);
        });
    });

    describe('Example URLs Management', () => {
        it('should save and retrieve example URLs', async () => {
            const urls = 'https://velog.io/@user/post1\nhttps://velog.io/@user/post2';
            await storage.saveExampleUrls(urls);
            const retrieved = storage.getExampleUrls();
            expect(retrieved).toBe(urls);
        });
    });

    describe('Clear All Settings', () => {
        it('should clear all stored data', async () => {
            await storage.saveApiKey('AIzaSyTest1234567890abcdefghijklmnop');
            await storage.saveCustomPrompt('test prompt');
            await storage.saveExampleUrls('test urls');

            await storage.clearAll();

            expect(await storage.getApiKey()).toBeUndefined();
            expect(storage.getCustomPrompt()).toBe('');
            expect(storage.getExampleUrls()).toBe('');
        });
    });
});
