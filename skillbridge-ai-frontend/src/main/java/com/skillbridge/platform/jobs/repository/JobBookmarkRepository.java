package com.skillbridge.platform.jobs.repository;

import com.skillbridge.platform.jobs.entity.JobBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobBookmarkRepository extends JpaRepository<JobBookmark, UUID> {
    List<JobBookmark> findByWorkerId(UUID workerId);
    boolean existsByWorkerIdAndJobId(UUID workerId, UUID jobId);
    void deleteByWorkerIdAndJobId(UUID workerId, UUID jobId);
}
