package com.skillbridge.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Central registry of application error codes. Keeping these in one place
 * avoids magic strings scattered across modules and gives the frontend a
 * stable contract to branch on.
 */
public enum ErrorCode {

    // Generic - 1000s
    VALIDATION_FAILED("ERR-1000", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("ERR-1001", HttpStatus.NOT_FOUND),
    RESOURCE_ALREADY_EXISTS("ERR-1002", HttpStatus.CONFLICT),
    ILLEGAL_STATE("ERR-1003", HttpStatus.CONFLICT),
    INTERNAL_ERROR("ERR-1099", HttpStatus.INTERNAL_SERVER_ERROR),

    // Auth - 2000s
    INVALID_CREDENTIALS("ERR-2000", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("ERR-2001", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("ERR-2002", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REUSED("ERR-2003", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("ERR-2004", HttpStatus.FORBIDDEN),
    OTP_INVALID("ERR-2005", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("ERR-2006", HttpStatus.BAD_REQUEST),
    ACCOUNT_DISABLED("ERR-2007", HttpStatus.FORBIDDEN),

    // Users / Workers - 3000s
    USER_NOT_FOUND("ERR-3000", HttpStatus.NOT_FOUND),
    PROFILE_INCOMPLETE("ERR-3001", HttpStatus.BAD_REQUEST),

    // Employers - 4000s
    EMPLOYER_NOT_VERIFIED("ERR-4000", HttpStatus.FORBIDDEN),
    EMPLOYER_NOT_FOUND("ERR-4001", HttpStatus.NOT_FOUND),

    // Jobs - 5000s
    JOB_NOT_FOUND("ERR-5000", HttpStatus.NOT_FOUND),
    JOB_CLOSED("ERR-5001", HttpStatus.CONFLICT),
    APPLICATION_ALREADY_EXISTS("ERR-5002", HttpStatus.CONFLICT),

    // Gigs - 6000s
    GIG_NOT_FOUND("ERR-6000", HttpStatus.NOT_FOUND),
    GIG_ALREADY_ACCEPTED("ERR-6001", HttpStatus.CONFLICT),
    GIG_EXPIRED("ERR-6002", HttpStatus.GONE),
    GIG_OTP_MISMATCH("ERR-6003", HttpStatus.BAD_REQUEST),

    // Resume - 7000s
    RESUME_PARSE_FAILED("ERR-7000", HttpStatus.UNPROCESSABLE_ENTITY),
    RESUME_NOT_FOUND("ERR-7001", HttpStatus.NOT_FOUND),
    UNSUPPORTED_FILE_TYPE("ERR-7002", HttpStatus.UNSUPPORTED_MEDIA_TYPE),

    // Payments - 8000s
    INSUFFICIENT_BALANCE("ERR-8000", HttpStatus.BAD_REQUEST),
    PAYMENT_FAILED("ERR-8001", HttpStatus.BAD_REQUEST),

    // Storage - 9000s
    FILE_UPLOAD_FAILED("ERR-9000", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final HttpStatus status;

    ErrorCode(String code, HttpStatus status) {
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
