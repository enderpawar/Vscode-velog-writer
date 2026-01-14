import { describe, it, expect } from 'vitest';
import {
    VelogAutoWriterError,
    GitError,
    ApiKeyError,
    AIGenerationError,
    VelogFetchError,
    ValidationError,
    getErrorMessage,
} from '../errors';

describe('Error Classes', () => {
    describe('VelogAutoWriterError', () => {
        it('should create error with message and code', () => {
            const error = new VelogAutoWriterError('Test error', 'TEST_CODE');
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.name).toBe('VelogAutoWriterError');
        });

        it('should preserve original error stack', () => {
            const originalError = new Error('Original');
            const error = new VelogAutoWriterError('Wrapped', 'CODE', originalError);
            expect(error.stack).toBe(originalError.stack);
        });
    });

    describe('GitError', () => {
        it('should create git-specific error', () => {
            const error = new GitError('Git command failed');
            expect(error.name).toBe('GitError');
            expect(error.code).toBe('GIT_ERROR');
        });
    });

    describe('ApiKeyError', () => {
        it('should create API key error with default message', () => {
            const error = new ApiKeyError();
            expect(error.message).toContain('API 키');
            expect(error.code).toBe('API_KEY_ERROR');
        });

        it('should create API key error with custom message', () => {
            const error = new ApiKeyError('Invalid API key');
            expect(error.message).toBe('Invalid API key');
        });
    });

    describe('AIGenerationError', () => {
        it('should create AI generation error', () => {
            const error = new AIGenerationError('Generation failed');
            expect(error.name).toBe('AIGenerationError');
            expect(error.code).toBe('AI_GENERATION_ERROR');
        });
    });

    describe('VelogFetchError', () => {
        it('should create Velog fetch error', () => {
            const error = new VelogFetchError('Failed to fetch post');
            expect(error.name).toBe('VelogFetchError');
            expect(error.code).toBe('VELOG_FETCH_ERROR');
        });
    });

    describe('ValidationError', () => {
        it('should create validation error', () => {
            const error = new ValidationError('Invalid input', 'email');
            expect(error.name).toBe('ValidationError');
            expect(error.field).toBe('email');
            expect(error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('getErrorMessage', () => {
        it('should extract message from VelogAutoWriterError', () => {
            const error = new GitError('Git error');
            expect(getErrorMessage(error)).toBe('Git error');
        });

        it('should extract message from standard Error', () => {
            const error = new Error('Standard error');
            expect(getErrorMessage(error)).toBe('Standard error');
        });

        it('should convert non-error to string', () => {
            expect(getErrorMessage('string error')).toBe('string error');
            expect(getErrorMessage(123)).toBe('123');
        });
    });
});
