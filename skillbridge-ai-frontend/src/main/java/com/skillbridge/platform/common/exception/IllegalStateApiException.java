package com.skillbridge.platform.common.exception;

public class IllegalStateApiException extends ApiException {
    public IllegalStateApiException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
