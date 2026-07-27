package com.skillbridge.platform.learning.service;

import com.skillbridge.platform.learning.entity.Course;
import com.skillbridge.platform.learning.entity.LearningPath;
import com.skillbridge.platform.learning.entity.LearningProgress;

import java.util.List;
import java.util.UUID;

public interface LearningService {
    List<Course> searchCourses(String keyword, String skill);
    Course getCourse(UUID courseId);
    LearningProgress updateProgress(UUID workerUserId, UUID courseId, int progressPercent);
    List<LearningProgress> getMyProgress(UUID workerUserId);
    List<LearningPath> getLearningPaths();
    void bookmarkCourse(UUID workerUserId, UUID courseId);
    void removeBookmark(UUID workerUserId, UUID courseId);
    List<Course> getBookmarkedCourses(UUID workerUserId);
}
