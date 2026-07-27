package com.skillbridge.platform.learning.repository;

import com.skillbridge.platform.learning.entity.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LearningProgressRepository extends JpaRepository<LearningProgress, UUID> {
    List<LearningProgress> findByWorkerId(UUID workerId);
    Optional<LearningProgress> findByWorkerIdAndCourseId(UUID workerId, UUID courseId);
}
