package com.skillbridge.platform.users.repository;

import com.skillbridge.platform.users.entity.WorkerSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkerSkillRepository extends JpaRepository<WorkerSkill, UUID> {
    List<WorkerSkill> findByWorkerId(UUID workerId);
    void deleteByIdAndWorkerId(UUID id, UUID workerId);
}
