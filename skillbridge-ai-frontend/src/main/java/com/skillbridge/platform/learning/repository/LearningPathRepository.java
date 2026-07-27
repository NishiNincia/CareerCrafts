package com.skillbridge.platform.learning.repository;

import com.skillbridge.platform.learning.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
}
