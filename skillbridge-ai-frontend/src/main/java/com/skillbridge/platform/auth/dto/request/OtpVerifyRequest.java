package com.skillbridge.platform.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyRequest(
        @NotBlank String phone,
        @NotBlank String otp
) {
}
