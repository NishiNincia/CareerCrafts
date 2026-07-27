package com.skillbridge.platform.common.exception;

import lombok.Getter;

/**
 * Base unchecked exception carrying an {@link ErrorCode}. All module-specific
 * exceptions should extend this so the global handler can uniformly translate
 * them into {@code ApiResponse} payloads with the correct HTTP status.
 */
@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
    }

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
