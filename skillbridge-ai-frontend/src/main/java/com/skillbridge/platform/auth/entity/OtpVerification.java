package com.skillbridge.platform.auth.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Placeholder OTP record. In production this would integrate with an SMS
 * gateway (e.g. MSG91, Twilio); for now OTPs are generated & stored server-side
 * so the rest of the auth flow (verify -> issue tokens) can be implemented end-to-end.
 */
@Getter
@Setter
@Entity
@Table(name = "otp_verifications")
public class OtpVerification extends BaseEntity {

    @Column(nullable = false)
    private String phone;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean consumed = false;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;
}
