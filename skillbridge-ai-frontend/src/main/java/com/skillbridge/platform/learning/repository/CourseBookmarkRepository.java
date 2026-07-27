package com.skillbridge.platform.learning.repository;

import com.skillbridge.platform.learning.entity.CourseBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourseBookmarkRepository extends JpaRepository<CourseBookmark, UUID> {
    List<CourseBookmark> findByWorkerId(UUID workerId);
    void deleteByWorkerIdAndCourseId(UUID workerId, UUID courseId);
}
