package com.skillbridge.platform.resumes.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.resumes.dto.response.ResumeAnalysisResponse;
import com.skillbridge.platform.resumes.entity.Resume;
import com.skillbridge.platform.resumes.entity.SkillGap;
import com.skillbridge.platform.resumes.service.ResumeService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Resumes", description = "Resume upload, parsing, scoring, ATS scoring, and skill-gap analysis")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Resume> upload(@RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Resume uploaded and queued for analysis",
                resumeService.uploadResume(CurrentUserId.get(), file));
    }

    @GetMapping("/{resumeId}/analysis")
    public ApiResponse<ResumeAnalysisResponse> analyze(@PathVariable UUID resumeId) {
        return ApiResponse.success(resumeService.analyzeResume(CurrentUserId.get(), resumeId));
    }

    @GetMapping("/analysis/latest")
    public ApiResponse<ResumeAnalysisResponse> latestAnalysis() {
        return ApiResponse.success(resumeService.getLatestAnalysis(CurrentUserId.get()));
    }

    @GetMapping("/history")
    public ApiResponse<List<Resume>> history() {
        return ApiResponse.success(resumeService.getResumeHistory(CurrentUserId.get()));
    }

    @GetMapping("/skill-gaps")
    public ApiResponse<List<SkillGap>> skillGaps(@RequestParam(required = false) UUID jobId) {
        return ApiResponse.success(resumeService.getSkillGaps(CurrentUserId.get(), jobId));
    }
}
