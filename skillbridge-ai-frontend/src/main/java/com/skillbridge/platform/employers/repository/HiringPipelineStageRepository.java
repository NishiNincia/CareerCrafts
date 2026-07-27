package com.skillbridge.platform.employers.repository;

import com.skillbridge.platform.employers.entity.HiringPipelineStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HiringPipelineStageRepository extends JpaRepository<HiringPipelineStage, UUID> {
    List<HiringPipelineStage> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
