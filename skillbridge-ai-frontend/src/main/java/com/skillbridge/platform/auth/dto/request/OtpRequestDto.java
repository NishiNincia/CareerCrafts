package com.skillbridge.platform.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpRequestDto(
        @NotBlank @Pattern(regexp = "^[+]?[0-9]{10,15}$") String phone
) {
}
