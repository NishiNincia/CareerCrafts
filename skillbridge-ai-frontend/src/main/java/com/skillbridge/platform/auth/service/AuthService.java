package com.skillbridge.platform.auth.service;

import com.skillbridge.platform.auth.dto.request.*;
import com.skillbridge.platform.auth.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void logout(RefreshTokenRequest request);
    void requestOtp(OtpRequestDto request);
    AuthResponse verifyOtp(OtpVerifyRequest request);
}
