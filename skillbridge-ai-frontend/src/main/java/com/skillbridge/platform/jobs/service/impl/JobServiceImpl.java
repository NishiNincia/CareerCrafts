package com.skillbridge.platform.jobs.service.impl;

import com.skillbridge.platform.common.dto.PageResponse;
import com.skillbridge.platform.common.exception.ApiException;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.employers.repository.EmployerProfileRepository;
import com.skillbridge.platform.jobs.dto.request.JobCreateRequest;
import com.skillbridge.platform.jobs.dto.request.JobSearchRequest;
import com.skillbridge.platform.jobs.dto.response.JobResponse;
import com.skillbridge.platform.jobs.entity.Job;
import com.skillbridge.platform.jobs.entity.JobApplication;
import com.skillbridge.platform.jobs.entity.JobBookmark;
import com.skillbridge.platform.jobs.mapper.JobMapper;
import com.skillbridge.platform.jobs.repository.JobApplicationRepository;
import com.skillbridge.platform.jobs.repository.JobBookmarkRepository;
import com.skillbridge.platform.jobs.repository.JobRepository;
import com.skillbridge.platform.jobs.repository.JobSpecification;
import com.skillbridge.platform.jobs.service.JobService;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.entity.WorkerSkill;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import com.skillbridge.platform.users.repository.WorkerSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobBookmarkRepository jobBookmarkRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerSkillRepository workerSkillRepository;

    @Override
    public JobResponse createJob(UUID employerUserId, JobCreateRequest request) {
        var employer = employerProfileRepository.findByUserId(employerUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.EMPLOYER_NOT_FOUND, "Employer profile not found"));

        Job job = new Job();
        job.setEmployerId(employer.getId());
        applyRequest(job, request);
        return JobMapper.toResponse(jobRepository.save(job));
    }

    @Override
    public JobResponse updateJob(UUID employerUserId, UUID jobId, JobCreateRequest request) {
        Job job = getOwnedJob(employerUserId, jobId);
        applyRequest(job, request);
        return JobMapper.toResponse(jobRepository.save(job));
    }

    @Override
    public void closeJob(UUID employerUserId, UUID jobId) {
        Job job = getOwnedJob(employerUserId, jobId);
        job.setStatus(Job.JobStatus.CLOSED);
        jobRepository.save(job);
    }

    @Override
    @Transactional(readOnly = true)
    public JobResponse getJob(UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.JOB_NOT_FOUND, "Job not found"));
        job.setViewsCount(job.getViewsCount() + 1);
        jobRepository.save(job);
        return JobMapper.toResponse(job);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<JobResponse> searchJobs(JobSearchRequest request) {
        int page = request.page() == null ? 0 : request.page();
        int size = request.size() == null ? 20 : Math.min(request.size(), 100);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        var spec = JobSpecification.filter(request.keyword(), request.category(),
                request.employmentType(), request.minSalary(), request.maxExperience());

        Page<Job> jobsPage = jobRepository.findAll(spec, pageable);
        Page<JobResponse> mapped = jobsPage.map(JobMapper::toResponse);
        return PageResponse.from(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getNearbyJobs(double lat, double lng, double radiusKm) {
        List<Job> jobs = jobRepository.findNearbyOpenJobs(lat, lng, radiusKm * 1000);
        return jobs.stream()
                .map(job -> JobMapper.toResponse(job, null, distanceKm(lat, lng, job)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getRecommendedJobs(UUID workerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));

        Set<String> workerSkills = workerSkillRepository.findByWorkerId(profile.getId()).stream()
                .map(WorkerSkill::getSkillName)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        List<Job> openJobs = jobRepository.findAll().stream()
                .filter(j -> j.getStatus() == Job.JobStatus.OPEN)
                .toList();

        return openJobs.stream()
                .map(job -> JobMapper.toResponse(job, computeMatchScore(workerSkills, job), null))
                .sorted((a, b) -> Double.compare(
                        b.matchScore() == null ? 0 : b.matchScore(),
                        a.matchScore() == null ? 0 : a.matchScore()))
                .limit(50)
                .collect(Collectors.toList());
    }

    @Override
    public JobApplication applyToJob(UUID workerUserId, UUID jobId, String coverNote) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.JOB_NOT_FOUND, "Job not found"));

        if (job.getStatus() != Job.JobStatus.OPEN) {
            throw new ApiException(ErrorCode.JOB_CLOSED, "This job is no longer accepting applications");
        }
        if (jobApplicationRepository.existsByJobIdAndWorkerId(jobId, profile.getId())) {
            throw new ApiException(ErrorCode.APPLICATION_ALREADY_EXISTS, "You have already applied to this job");
        }

        Set<String> workerSkills = workerSkillRepository.findByWorkerId(profile.getId()).stream()
                .map(WorkerSkill::getSkillName).map(String::toLowerCase).collect(Collectors.toSet());

        JobApplication application = new JobApplication();
        application.setJobId(jobId);
        application.setWorkerId(profile.getId());
        application.setCoverNote(coverNote);
        application.setMatchScore(computeMatchScore(workerSkills, job));
        return jobApplicationRepository.save(application);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplication> getApplicationsForJob(UUID employerUserId, UUID jobId) {
        getOwnedJob(employerUserId, jobId);
        return jobApplicationRepository.findByJobId(jobId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplication> getMyApplications(UUID workerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
        return jobApplicationRepository.findByWorkerId(profile.getId());
    }

    @Override
    public void bookmarkJob(UUID workerUserId, UUID jobId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
        if (jobBookmarkRepository.existsByWorkerIdAndJobId(profile.getId(), jobId)) {
            return;
        }
        JobBookmark bookmark = new JobBookmark();
        bookmark.setWorkerId(profile.getId());
        bookmark.setJobId(jobId);
        jobBookmarkRepository.save(bookmark);
    }

    @Override
    public void removeBookmark(UUID workerUserId, UUID jobId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
        jobBookmarkRepository.deleteByWorkerIdAndJobId(profile.getId(), jobId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getBookmarkedJobs(UUID workerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
        return jobBookmarkRepository.findByWorkerId(profile.getId()).stream()
                .map(b -> jobRepository.findById(b.getJobId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(JobMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Job getOwnedJob(UUID employerUserId, UUID jobId) {
        var employer = employerProfileRepository.findByUserId(employerUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.EMPLOYER_NOT_FOUND, "Employer profile not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.JOB_NOT_FOUND, "Job not found"));
        if (!job.getEmployerId().equals(employer.getId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "You do not own this job posting");
        }
        return job;
    }

    private void applyRequest(Job job, JobCreateRequest request) {
        job.setTitle(request.title());
        job.setDescription(request.description());
        job.setCategory(request.category());
        job.setEmploymentType(request.employmentType());
        job.setMinSalary(request.minSalary());
        job.setMaxSalary(request.maxSalary());
        job.setExperienceRequiredYears(request.experienceRequiredYears());
        job.setRequiredSkills(request.requiredSkills());
        job.setAddress(request.address());
        if (request.latitude() != null && request.longitude() != null) {
            job.setLocation(GeoUtils.toPoint(request.latitude(), request.longitude()));
        }
        if (request.openings() != null) {
            job.setOpenings(request.openings());
        }
    }

    /**
     * Simple, explainable skill-overlap match score in [0, 100]. This is a
     * local baseline; the recommendations module's JobRecommendationStrategy
     * can plug in an external AI/ML scoring service without touching callers.
     */
    private double computeMatchScore(Set<String> workerSkills, Job job) {
        if (job.getRequiredSkills() == null || job.getRequiredSkills().isBlank() || workerSkills.isEmpty()) {
            return 0.0;
        }
        Set<String> required = Arrays.stream(job.getRequiredSkills().split(","))
                .map(String::trim).map(String::toLowerCase)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
        if (required.isEmpty()) {
            return 0.0;
        }
        long overlap = required.stream().filter(workerSkills::contains).count();
        return Math.round((overlap * 100.0 / required.size()) * 100.0) / 100.0;
    }

    private double distanceKm(double lat, double lng, Job job) {
        if (job.getLocation() == null) return 0.0;
        double jobLat = GeoUtils.getLatitude(job.getLocation());
        double jobLng = GeoUtils.getLongitude(job.getLocation());
        return haversineKm(lat, lng, jobLat, jobLng);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int earthRadiusKm = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(earthRadiusKm * c * 100.0) / 100.0;
    }
}
