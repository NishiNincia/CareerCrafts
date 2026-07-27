package com.skillbridge.platform.resumes.repository;

import com.skillbridge.platform.resumes.entity.ResumeMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumeMetadataRepository extends JpaRepository<ResumeMetadata, UUID> {
    Optional<ResumeMetadata> findByResumeId(UUID resumeId);
}
