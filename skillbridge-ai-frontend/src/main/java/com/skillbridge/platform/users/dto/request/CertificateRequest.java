package com.skillbridge.platform.users.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CertificateRequest(
        @NotBlank String title,
        String issuingOrganization,
        LocalDate issueDate,
        LocalDate expiryDate,
        String credentialUrl,
        String fileUrl
) {
}
