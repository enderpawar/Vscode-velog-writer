/**
 * 커스텀 에러 클래스 정의
 * 프로젝트 전체에서 통합된 에러 핸들링을 위한 기반
 */

export class VelogAutoWriterError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'VelogAutoWriterError';

        // 스택 트레이스 유지
        if (originalError && originalError.stack) {
            this.stack = originalError.stack;
        }
    }
}

export class GitError extends VelogAutoWriterError {
    constructor(message: string, originalError?: Error) {
        super(message, 'GIT_ERROR', originalError);
        this.name = 'GitError';
    }
}

export class ApiKeyError extends VelogAutoWriterError {
    constructor(message: string = 'API 키가 설정되지 않았습니다.') {
        super(message, 'API_KEY_ERROR');
        this.name = 'ApiKeyError';
    }
}

export class AIGenerationError extends VelogAutoWriterError {
    constructor(message: string, originalError?: Error) {
        super(message, 'AI_GENERATION_ERROR', originalError);
        this.name = 'AIGenerationError';
    }
}

export class VelogFetchError extends VelogAutoWriterError {
    constructor(message: string, originalError?: Error) {
        super(message, 'VELOG_FETCH_ERROR', originalError);
        this.name = 'VelogFetchError';
    }
}

export class ValidationError extends VelogAutoWriterError {
    constructor(
        message: string,
        public readonly field?: string
    ) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof VelogAutoWriterError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

/**
 * 에러를 VSCode에 표시
 */
export function showError(error: unknown): void {
    const message = getErrorMessage(error);

    // 에러 타입에 따라 다른 처리
    if (error instanceof ApiKeyError) {
        // API 키 에러는 설정으로 이동 옵션 제공
        console.error('API Key Error:', message);
    } else if (error instanceof GitError) {
        console.error('Git Error:', message);
    } else if (error instanceof AIGenerationError) {
        console.error('AI Generation Error:', message);
    } else {
        console.error('Unknown Error:', message);
    }
}
