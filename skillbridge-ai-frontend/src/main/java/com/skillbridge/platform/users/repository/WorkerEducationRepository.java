package com.skillbridge.platform.users.repository;

import com.skillbridge.platform.users.entity.WorkerEducation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkerEducationRepository extends JpaRepository<WorkerEducation, UUID> {
    List<WorkerEducation> findByWorkerId(UUID workerId);
}
