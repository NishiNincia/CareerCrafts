package com.skillbridge.platform.schemes.repository;

import com.skillbridge.platform.schemes.entity.GovernmentScheme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GovernmentSchemeRepository extends JpaRepository<GovernmentScheme, UUID> {
    List<GovernmentScheme> findByActiveTrueAndCategoryIgnoreCase(String category);
    List<GovernmentScheme> findByActiveTrueAndTitleContainingIgnoreCase(String keyword);
    List<GovernmentScheme> findByActiveTrue();
}
