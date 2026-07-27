package com.skillbridge.platform.jobs.service;

import com.skillbridge.platform.common.dto.PageResponse;
import com.skillbridge.platform.jobs.dto.request.JobCreateRequest;
import com.skillbridge.platform.jobs.dto.request.JobSearchRequest;
import com.skillbridge.platform.jobs.dto.response.JobResponse;
import com.skillbridge.platform.jobs.entity.JobApplication;

import java.util.List;
import java.util.UUID;

public interface JobService {
    JobResponse createJob(UUID employerUserId, JobCreateRequest request);
    JobResponse updateJob(UUID employerUserId, UUID jobId, JobCreateRequest request);
    void closeJob(UUID employerUserId, UUID jobId);
    JobResponse getJob(UUID jobId);
    PageResponse<JobResponse> searchJobs(JobSearchRequest request);
    List<JobResponse> getNearbyJobs(double lat, double lng, double radiusKm);
    List<JobResponse> getRecommendedJobs(UUID workerUserId);
    JobApplication applyToJob(UUID workerUserId, UUID jobId, String coverNote);
    List<JobApplication> getApplicationsForJob(UUID employerUserId, UUID jobId);
    List<JobApplication> getMyApplications(UUID workerUserId);
    void bookmarkJob(UUID workerUserId, UUID jobId);
    void removeBookmark(UUID workerUserId, UUID jobId);
    List<JobResponse> getBookmarkedJobs(UUID workerUserId);
}
