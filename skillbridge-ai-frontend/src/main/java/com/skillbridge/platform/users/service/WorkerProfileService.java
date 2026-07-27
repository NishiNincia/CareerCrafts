package com.skillbridge.platform.users.service;

import com.skillbridge.platform.users.dto.request.*;
import com.skillbridge.platform.users.dto.response.WorkerProfileResponse;
import com.skillbridge.platform.users.entity.*;

import java.util.List;
import java.util.UUID;

public interface WorkerProfileService {

    WorkerProfileResponse getProfile(UUID userId);
    WorkerProfileResponse updateProfile(UUID userId, WorkerProfileUpdateRequest request);
    WorkerProfileResponse updateLocation(UUID userId, LocationUpdateRequest request);
    WorkerProfileResponse updateAvailability(UUID userId, AvailabilityUpdateRequest request);

    WorkerSkill addSkill(UUID userId, WorkerSkillRequest request);
    List<WorkerSkill> getSkills(UUID userId);
    void deleteSkill(UUID userId, UUID skillId);

    WorkerExperience addExperience(UUID userId, WorkerExperienceRequest request);
    List<WorkerExperience> getExperiences(UUID userId);

    WorkerEducation addEducation(UUID userId, WorkerEducationRequest request);
    List<WorkerEducation> getEducation(UUID userId);

    Certificate addCertificate(UUID userId, CertificateRequest request);
    List<Certificate> getCertificates(UUID userId);

    PortfolioItem addPortfolioItem(UUID userId, PortfolioItemRequest request);
    List<PortfolioItem> getPortfolio(UUID userId);
}
