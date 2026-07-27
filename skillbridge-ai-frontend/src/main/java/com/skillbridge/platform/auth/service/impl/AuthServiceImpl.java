package com.skillbridge.platform.auth.service.impl;

import com.skillbridge.platform.auth.dto.request.*;
import com.skillbridge.platform.auth.dto.response.AuthResponse;
import com.skillbridge.platform.auth.entity.OtpVerification;
import com.skillbridge.platform.auth.entity.RefreshToken;
import com.skillbridge.platform.auth.repository.OtpVerificationRepository;
import com.skillbridge.platform.auth.repository.RefreshTokenRepository;
import com.skillbridge.platform.auth.service.AuthService;
import com.skillbridge.platform.common.exception.ApiException;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceAlreadyExistsException;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.security.jwt.JwtService;
import com.skillbridge.platform.users.entity.User;
import com.skillbridge.platform.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResourceAlreadyExistsException("An account already exists with this email");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setRole(request.role());
        user = userRepository.save(user);
        return issueTokens(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
        }
        if (!user.isEnabled()) {
            throw new ApiException(ErrorCode.ACCOUNT_DISABLED, "This account has been disabled");
        }
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String hash = hashToken(request.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID, "Refresh token not recognized"));

        if (stored.isRevoked()) {
            // Reuse of a revoked token indicates possible theft - revoke the whole chain for this user.
            refreshTokenRepository.deleteAllByUserId(stored.getUserId());
            throw new ApiException(ErrorCode.REFRESH_TOKEN_REUSED, "Refresh token has already been used");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED, "Refresh token has expired");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(user);
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        String hash = hashToken(request.refreshToken());
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Override
    @Transactional
    public void requestOtp(OtpRequestDto request) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpVerification verification = new OtpVerification();
        verification.setPhone(request.phone());
        verification.setOtpHash(BCrypt.hashpw(otp, BCrypt.gensalt()));
        verification.setExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        otpVerificationRepository.save(verification);

        // Placeholder: integrate with SMS gateway (Twilio / MSG91 / etc.) here.
        // For now the OTP is logged so the flow can be exercised end-to-end in dev.
        org.slf4j.LoggerFactory.getLogger(getClass())
                .info("OTP for {} generated (SMS gateway integration pending): {}", request.phone(), otp);
    }

    @Override
    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        OtpVerification verification = otpVerificationRepository
                .findTopByPhoneAndConsumedFalseOrderByCreatedAtDesc(request.phone())
                .orElseThrow(() -> new ApiException(ErrorCode.OTP_INVALID, "No OTP request found for this phone number"));

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.OTP_EXPIRED, "OTP has expired, please request a new one");
        }
        if (!BCrypt.checkpw(request.otp(), verification.getOtpHash())) {
            verification.setAttemptCount(verification.getAttemptCount() + 1);
            otpVerificationRepository.save(verification);
            throw new ApiException(ErrorCode.OTP_INVALID, "Incorrect OTP");
        }
        verification.setConsumed(true);
        otpVerificationRepository.save(verification);

        User user = userRepository.findByPhone(request.phone()).orElseThrow(() ->
                new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "No account registered with this phone number"));
        user.setPhoneVerified(true);
        userRepository.save(user);

        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        RefreshToken entity = new RefreshToken();
        entity.setUserId(user.getId());
        entity.setTokenHash(hashToken(refreshToken));
        entity.setExpiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()));
        refreshTokenRepository.save(entity);

        return new AuthResponse(
                user.getId(), user.getEmail(), user.getFullName(), user.getRole().name(),
                accessToken, refreshToken, 900_000L);
    }

    private String hashToken(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
