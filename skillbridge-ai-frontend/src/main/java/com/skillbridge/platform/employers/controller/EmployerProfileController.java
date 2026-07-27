package com.skillbridge.platform.employers.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.employers.dto.request.EmployerProfileRequest;
import com.skillbridge.platform.employers.dto.request.PipelineStageUpdateRequest;
import com.skillbridge.platform.employers.entity.EmployerProfile;
import com.skillbridge.platform.employers.entity.HiringPipelineStage;
import com.skillbridge.platform.employers.service.EmployerProfileService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employers")
@RequiredArgsConstructor
@Tag(name = "Employer", description = "Business profile, verification, and hiring pipeline management")
public class EmployerProfileController {

    private final EmployerProfileService employerProfileService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<EmployerProfile> getProfile() {
        return ApiResponse.success(employerProfileService.getProfile(CurrentUserId.get()));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<EmployerProfile> upsertProfile(@Valid @RequestBody EmployerProfileRequest request) {
        return ApiResponse.success("Business profile saved",
                employerProfileService.upsertProfile(CurrentUserId.get(), request));
    }

    @PostMapping("/verification")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<EmployerProfile> submitVerification(@RequestParam String documentUrl) {
        return ApiResponse.success("Verification document submitted for review",
                employerProfileService.submitVerification(CurrentUserId.get(), documentUrl));
    }

    @PutMapping("/applications/{applicationId}/pipeline")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<HiringPipelineStage> updatePipelineStage(
            @PathVariable UUID applicationId, @Valid @RequestBody PipelineStageUpdateRequest request) {
        return ApiResponse.success(employerProfileService.updatePipelineStage(applicationId, request));
    }

    @GetMapping("/applications/{applicationId}/pipeline")
    @PreAuthorize("hasAnyRole('EMPLOYER','WORKER','ADMIN')")
    public ApiResponse<List<HiringPipelineStage>> getPipeline(@PathVariable UUID applicationId) {
        return ApiResponse.success(employerProfileService.getPipeline(applicationId));
    }
}
