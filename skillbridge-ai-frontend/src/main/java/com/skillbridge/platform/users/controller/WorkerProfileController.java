package com.skillbridge.platform.users.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import com.skillbridge.platform.users.dto.request.*;
import com.skillbridge.platform.users.dto.response.WorkerProfileResponse;
import com.skillbridge.platform.users.entity.*;
import com.skillbridge.platform.users.service.WorkerProfileService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workers/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Worker Profile", description = "Worker profile, skills, experience, education, certificates, portfolio")
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.success(workerProfileService.getProfile(CurrentUserId.get())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateProfile(
            @RequestBody WorkerProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                workerProfileService.updateProfile(CurrentUserId.get(), request)));
    }

    @PatchMapping("/location")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateLocation(
            @Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Location updated",
                workerProfileService.updateLocation(CurrentUserId.get(), request)));
    }

    @PatchMapping("/availability")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateAvailability(
            @Valid @RequestBody AvailabilityUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Availability updated",
                workerProfileService.updateAvailability(CurrentUserId.get(), request)));
    }

    // ---- Skills ----
    @PostMapping("/skills")
    public ResponseEntity<ApiResponse<WorkerSkill>> addSkill(@Valid @RequestBody WorkerSkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(workerProfileService.addSkill(CurrentUserId.get(), request)));
    }

    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<WorkerSkill>>> getSkills() {
        return ResponseEntity.ok(ApiResponse.success(workerProfileService.getSkills(CurrentUserId.get())));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable UUID skillId) {
        workerProfileService.deleteSkill(CurrentUserId.get(), skillId);
        return ResponseEntity.ok(ApiResponse.success("Skill removed", null));
    }

    // ---- Experience ----
    @PostMapping("/experience")
    public ResponseEntity<ApiResponse<WorkerExperience>> addExperience(
            @Valid @RequestBody WorkerExperienceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(workerProfileService.addExperience(CurrentUserId.get(), request)));
    }

    @GetMapping("/experience")
    public ResponseEntity<ApiResponse<List<WorkerExperience>>> getExperience() {
        return ResponseEntity.ok(ApiResponse.success(workerProfileService.getExperiences(CurrentUserId.get())));
    }

    // ---- Education ----
    @PostMapping("/education")
    public ResponseEntity<ApiResponse<WorkerEducation>> addEducation(
            @Valid @RequestBody WorkerEducationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(workerProfileService.addEducation(CurrentUserId.get(), request)));
    }

    @GetMapping("/education")
    public ResponseEntity<ApiResponse<List<WorkerEducation>>> getEducation() {
        return ResponseEntity.ok(ApiResponse.success(workerProfileService.getEducation(CurrentUserId.get())));
    }

    // ---- Certificates ----
    @PostMapping("/certificates")
    public ResponseEntity<ApiResponse<Certificate>> addCertificate(
            @Valid @RequestBody CertificateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(workerProfileService.addCertificate(CurrentUserId.get(), request)));
    }

    @GetMapping("/certificates")
    public ResponseEntity<ApiResponse<List<Certificate>>> getCertificates() {
        return ResponseEntity.ok(ApiResponse.success(workerProfileService.getCertificates(CurrentUserId.get())));
    }

    // ---- Portfolio ----
    @PostMapping("/portfolio")
    public ResponseEntity<ApiResponse<PortfolioItem>> addPortfolioItem(
            @Valid @RequestBody PortfolioItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(workerProfileService.addPortfolioItem(CurrentUserId.get(), request)));
    }

    @GetMapping("/portfolio")
    public ResponseEntity<ApiResponse<List<PortfolioItem>>> getPortfolio() {
        return ResponseEntity.ok(ApiResponse.success(workerProfileService.getPortfolio(CurrentUserId.get())));
    }
}
