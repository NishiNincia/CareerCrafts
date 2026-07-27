package com.skillbridge.platform.resumes.repository;

import com.skillbridge.platform.resumes.entity.ResumeScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumeScoreRepository extends JpaRepository<ResumeScore, UUID> {
    Optional<ResumeScore> findByResumeId(UUID resumeId);
}
