package com.skillbridge.platform.auth.dto.response;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String email,
        String fullName,
        String role,
        String accessToken,
        String refreshToken,
        long expiresIn
) {
}
