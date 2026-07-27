package com.skillbridge.platform.jobs.repository;

import com.skillbridge.platform.jobs.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    List<JobApplication> findByWorkerId(UUID workerId);
    List<JobApplication> findByJobId(UUID jobId);
    Optional<JobApplication> findByJobIdAndWorkerId(UUID jobId, UUID workerId);
    boolean existsByJobIdAndWorkerId(UUID jobId, UUID workerId);
}
