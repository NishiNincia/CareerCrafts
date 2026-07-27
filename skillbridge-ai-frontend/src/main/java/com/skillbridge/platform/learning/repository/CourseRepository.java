package com.skillbridge.platform.learning.repository;

import com.skillbridge.platform.learning.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {
    List<Course> findByPrimarySkillIgnoreCase(String primarySkill);
    List<Course> findByTitleContainingIgnoreCase(String keyword);
}
