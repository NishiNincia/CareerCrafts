package com.skillbridge.platform.resumes.repository;

import com.skillbridge.platform.resumes.entity.AtsScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtsScoreRepository extends JpaRepository<AtsScore, UUID> {
    List<AtsScore> findByResumeId(UUID resumeId);
}
