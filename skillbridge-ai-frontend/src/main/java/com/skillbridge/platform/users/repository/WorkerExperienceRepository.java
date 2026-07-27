package com.skillbridge.platform.users.repository;

import com.skillbridge.platform.users.entity.WorkerExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkerExperienceRepository extends JpaRepository<WorkerExperience, UUID> {
    List<WorkerExperience> findByWorkerId(UUID workerId);
}
