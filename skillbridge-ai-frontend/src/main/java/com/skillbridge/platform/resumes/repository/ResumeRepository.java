package com.skillbridge.platform.resumes.repository;

import com.skillbridge.platform.resumes.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByWorkerIdOrderByCreatedAtDesc(UUID workerId);
    Optional<Resume> findByWorkerIdAndActiveTrue(UUID workerId);
}
