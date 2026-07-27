package com.skillbridge.platform.employers.service.impl;

import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.employers.dto.request.EmployerProfileRequest;
import com.skillbridge.platform.employers.dto.request.PipelineStageUpdateRequest;
import com.skillbridge.platform.employers.entity.EmployerProfile;
import com.skillbridge.platform.employers.entity.HiringPipelineStage;
import com.skillbridge.platform.employers.repository.EmployerProfileRepository;
import com.skillbridge.platform.employers.repository.HiringPipelineStageRepository;
import com.skillbridge.platform.employers.service.EmployerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployerProfileServiceImpl implements EmployerProfileService {

    private final EmployerProfileRepository employerProfileRepository;
    private final HiringPipelineStageRepository hiringPipelineStageRepository;

    @Override
    @Transactional(readOnly = true)
    public EmployerProfile getProfile(UUID userId) {
        return employerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.EMPLOYER_NOT_FOUND, "Employer profile not found"));
    }

    @Override
    public EmployerProfile upsertProfile(UUID userId, EmployerProfileRequest request) {
        EmployerProfile profile = employerProfileRepository.findByUserId(userId).orElseGet(() -> {
            EmployerProfile p = new EmployerProfile();
            p.setUserId(userId);
            return p;
        });
        profile.setBusinessName(request.businessName());
        profile.setBusinessType(request.businessType());
        profile.setDescription(request.description());
        profile.setGstin(request.gstin());
        profile.setBusinessAddress(request.businessAddress());
        if (request.latitude() != null && request.longitude() != null) {
            profile.setLocation(GeoUtils.toPoint(request.latitude(), request.longitude()));
        }
        return employerProfileRepository.save(profile);
    }

    @Override
    public EmployerProfile submitVerification(UUID userId, String documentUrl) {
        EmployerProfile profile = getProfile(userId);
        profile.setVerificationDocumentUrl(documentUrl);
        profile.setVerificationStatus(EmployerProfile.VerificationStatus.PENDING);
        return employerProfileRepository.save(profile);
    }

    @Override
    public HiringPipelineStage updatePipelineStage(UUID applicationId, PipelineStageUpdateRequest request) {
        HiringPipelineStage stage = new HiringPipelineStage();
        stage.setApplicationId(applicationId);
        stage.setStage(request.stage());
        stage.setNotes(request.notes());
        return hiringPipelineStageRepository.save(stage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HiringPipelineStage> getPipeline(UUID applicationId) {
        return hiringPipelineStageRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
    }
}
