package com.skillbridge.platform.auth.repository;

import com.skillbridge.platform.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {
    Optional<OtpVerification> findTopByPhoneAndConsumedFalseOrderByCreatedAtDesc(String phone);
}
