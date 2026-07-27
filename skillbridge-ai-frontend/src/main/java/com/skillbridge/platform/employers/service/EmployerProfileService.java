package com.skillbridge.platform.employers.service;

import com.skillbridge.platform.employers.dto.request.EmployerProfileRequest;
import com.skillbridge.platform.employers.dto.request.PipelineStageUpdateRequest;
import com.skillbridge.platform.employers.entity.EmployerProfile;
import com.skillbridge.platform.employers.entity.HiringPipelineStage;

import java.util.List;
import java.util.UUID;

public interface EmployerProfileService {
    EmployerProfile getProfile(UUID userId);
    EmployerProfile upsertProfile(UUID userId, EmployerProfileRequest request);
    EmployerProfile submitVerification(UUID userId, String documentUrl);
    HiringPipelineStage updatePipelineStage(UUID applicationId, PipelineStageUpdateRequest request);
    List<HiringPipelineStage> getPipeline(UUID applicationId);
}
