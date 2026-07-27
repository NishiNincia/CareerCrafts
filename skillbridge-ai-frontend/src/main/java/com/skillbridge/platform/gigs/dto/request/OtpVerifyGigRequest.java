package com.skillbridge.platform.gigs.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyGigRequest(@NotBlank String otp) {
}
