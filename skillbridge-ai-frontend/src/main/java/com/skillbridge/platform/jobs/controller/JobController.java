package com.skillbridge.platform.jobs.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.common.dto.PageResponse;
import com.skillbridge.platform.jobs.dto.request.JobCreateRequest;
import com.skillbridge.platform.jobs.dto.request.JobSearchRequest;
import com.skillbridge.platform.jobs.dto.response.JobResponse;
import com.skillbridge.platform.jobs.entity.Job;
import com.skillbridge.platform.jobs.entity.JobApplication;
import com.skillbridge.platform.jobs.service.JobService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Permanent job CRUD, search, nearby, recommendations, applications, bookmarks")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<JobResponse> createJob(@Valid @RequestBody JobCreateRequest request) {
        return ApiResponse.success("Job posted successfully", jobService.createJob(CurrentUserId.get(), request));
    }

    @PutMapping("/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<JobResponse> updateJob(@PathVariable UUID jobId, @Valid @RequestBody JobCreateRequest request) {
        return ApiResponse.success("Job updated", jobService.updateJob(CurrentUserId.get(), jobId, request));
    }

    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<Void> closeJob(@PathVariable UUID jobId) {
        jobService.closeJob(CurrentUserId.get(), jobId);
        return ApiResponse.success("Job closed", null);
    }

    @GetMapping("/public/{jobId}")
    public ApiResponse<JobResponse> getJob(@PathVariable UUID jobId) {
        return ApiResponse.success(jobService.getJob(jobId));
    }

    @PostMapping("/public/search")
    public ApiResponse<PageResponse<JobResponse>> search(@RequestBody JobSearchRequest request) {
        return ApiResponse.success(jobService.searchJobs(request));
    }

    @GetMapping("/public/nearby")
    public ApiResponse<List<JobResponse>> nearby(
            @RequestParam double lat, @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radiusKm) {
        return ApiResponse.success(jobService.getNearbyJobs(lat, lng, radiusKm));
    }

    @GetMapping("/recommended")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<JobResponse>> recommended() {
        return ApiResponse.success(jobService.getRecommendedJobs(CurrentUserId.get()));
    }

    @PostMapping("/{jobId}/apply")
    @PreAuthorize("hasRole('WORKER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<JobApplication> apply(@PathVariable UUID jobId, @RequestParam(required = false) String coverNote) {
        return ApiResponse.success("Application submitted", jobService.applyToJob(CurrentUserId.get(), jobId, coverNote));
    }

    @GetMapping("/{jobId}/applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<List<JobApplication>> applicationsForJob(@PathVariable UUID jobId) {
        return ApiResponse.success(jobService.getApplicationsForJob(CurrentUserId.get(), jobId));
    }

    @GetMapping("/applications/mine")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<JobApplication>> myApplications() {
        return ApiResponse.success(jobService.getMyApplications(CurrentUserId.get()));
    }

    @PostMapping("/{jobId}/bookmark")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<Void> bookmark(@PathVariable UUID jobId) {
        jobService.bookmarkJob(CurrentUserId.get(), jobId);
        return ApiResponse.success("Job bookmarked", null);
    }

    @DeleteMapping("/{jobId}/bookmark")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<Void> removeBookmark(@PathVariable UUID jobId) {
        jobService.removeBookmark(CurrentUserId.get(), jobId);
        return ApiResponse.success("Bookmark removed", null);
    }

    @GetMapping("/bookmarks")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<JobResponse>> bookmarks() {
        return ApiResponse.success(jobService.getBookmarkedJobs(CurrentUserId.get()));
    }
}
