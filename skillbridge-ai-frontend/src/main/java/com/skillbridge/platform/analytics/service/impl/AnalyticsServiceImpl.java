package com.skillbridge.platform.analytics.service.impl;

import com.skillbridge.platform.analytics.dto.EmployerStatsResponse;
import com.skillbridge.platform.analytics.dto.PlatformStatsResponse;
import com.skillbridge.platform.analytics.dto.WorkerStatsResponse;
import com.skillbridge.platform.analytics.service.AnalyticsService;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.employers.repository.EmployerProfileRepository;
import com.skillbridge.platform.gigs.entity.Gig;
import com.skillbridge.platform.gigs.entity.GigDispatch;
import com.skillbridge.platform.gigs.repository.GigDispatchRepository;
import com.skillbridge.platform.gigs.repository.GigRatingRepository;
import com.skillbridge.platform.gigs.repository.GigRepository;
import com.skillbridge.platform.jobs.entity.JobApplication;
import com.skillbridge.platform.jobs.repository.JobApplicationRepository;
import com.skillbridge.platform.jobs.repository.JobRepository;
import com.skillbridge.platform.payments.repository.WalletRepository;
import com.skillbridge.platform.security.Role;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.repository.UserRepository;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final GigRepository gigRepository;
    private final GigDispatchRepository gigDispatchRepository;
    private final GigRatingRepository gigRatingRepository;
    private final WalletRepository walletRepository;

    @Override
    public WorkerStatsResponse getWorkerStats(UUID workerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));

        List<JobApplication> applications = jobApplicationRepository.findByWorkerId(profile.getId());
        long activeApplications = applications.stream()
                .filter(a -> a.getStatus() == JobApplication.ApplicationStatus.APPLIED
                        || a.getStatus() == JobApplication.ApplicationStatus.SHORTLISTED
                        || a.getStatus() == JobApplication.ApplicationStatus.INTERVIEW_SCHEDULED)
                .count();

        List<GigDispatch> dispatches = gigDispatchRepository.findByWorkerId(profile.getId());
        long completedGigs = dispatches.stream()
                .filter(d -> d.getStatus() == GigDispatch.DispatchStatus.COMPLETED)
                .count();

        var ratings = gigRatingRepository.findByRateeUserId(workerUserId);
        double avgRating = ratings.isEmpty() ? 0.0
                : ratings.stream().mapToInt(r -> r.getStars()).average().orElse(0.0);

        double totalEarnings = walletRepository.findByUserId(workerUserId)
                .map(w -> w.getBalance().doubleValue()).orElse(0.0);

        return new WorkerStatsResponse(applications.size(), completedGigs,
                Math.round(avgRating * 100.0) / 100.0, totalEarnings, activeApplications);
    }

    @Override
    public EmployerStatsResponse getEmployerStats(UUID employerUserId) {
        var employer = employerProfileRepository.findByUserId(employerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.EMPLOYER_NOT_FOUND, "Employer profile not found"));

        long jobsPosted = jobRepository.findByEmployerId(employer.getId()).size();
        long gigsPosted = gigRepository.findByEmployerId(employer.getId()).size();

        long applicationsReceived = jobRepository.findByEmployerId(employer.getId()).stream()
                .mapToLong(job -> jobApplicationRepository.findByJobId(job.getId()).size())
                .sum();

        long hires = jobRepository.findByEmployerId(employer.getId()).stream()
                .flatMap(job -> jobApplicationRepository.findByJobId(job.getId()).stream())
                .filter(a -> a.getStatus() == JobApplication.ApplicationStatus.HIRED)
                .count();

        return new EmployerStatsResponse(jobsPosted, gigsPosted, applicationsReceived, hires,
                employer.getAverageRating() == null ? 0.0 : employer.getAverageRating());
    }

    @Override
    public PlatformStatsResponse getPlatformStats() {
        long totalWorkers = userRepository.countByRole(Role.WORKER);
        long totalEmployers = userRepository.countByRole(Role.EMPLOYER);
        long totalJobs = jobRepository.count();
        long totalGigs = gigRepository.count();
        long totalApplications = jobApplicationRepository.count();
        long totalCompletedGigs = gigRepository.findAll().stream()
                .filter(g -> g.getStatus() == Gig.GigStatus.COMPLETED)
                .count();

        return new PlatformStatsResponse(totalWorkers, totalEmployers, totalJobs, totalGigs,
                totalApplications, totalCompletedGigs);
    }
}
