package com.skillbridge.platform.learning.service.impl;

import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.learning.entity.Course;
import com.skillbridge.platform.learning.entity.CourseBookmark;
import com.skillbridge.platform.learning.entity.LearningPath;
import com.skillbridge.platform.learning.entity.LearningProgress;
import com.skillbridge.platform.learning.repository.CourseBookmarkRepository;
import com.skillbridge.platform.learning.repository.CourseRepository;
import com.skillbridge.platform.learning.repository.LearningPathRepository;
import com.skillbridge.platform.learning.repository.LearningProgressRepository;
import com.skillbridge.platform.learning.service.LearningService;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LearningServiceImpl implements LearningService {

    private final CourseRepository courseRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final LearningPathRepository learningPathRepository;
    private final CourseBookmarkRepository courseBookmarkRepository;
    private final WorkerProfileRepository workerProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Course> searchCourses(String keyword, String skill) {
        if (skill != null && !skill.isBlank()) {
            return courseRepository.findByPrimarySkillIgnoreCase(skill);
        }
        if (keyword != null && !keyword.isBlank()) {
            return courseRepository.findByTitleContainingIgnoreCase(keyword);
        }
        return courseRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Course getCourse(UUID courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));
    }

    @Override
    public LearningProgress updateProgress(UUID workerUserId, UUID courseId, int progressPercent) {
        WorkerProfile profile = getWorkerProfile(workerUserId);
        LearningProgress progress = learningProgressRepository.findByWorkerIdAndCourseId(profile.getId(), courseId)
                .orElseGet(() -> {
                    LearningProgress p = new LearningProgress();
                    p.setWorkerId(profile.getId());
                    p.setCourseId(courseId);
                    return p;
                });
        progress.setProgressPercent(Math.max(0, Math.min(100, progressPercent)));
        progress.setStatus(progress.getProgressPercent() == 100 ? LearningProgress.Status.COMPLETED
                : progress.getProgressPercent() > 0 ? LearningProgress.Status.IN_PROGRESS
                : LearningProgress.Status.NOT_STARTED);
        return learningProgressRepository.save(progress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningProgress> getMyProgress(UUID workerUserId) {
        return learningProgressRepository.findByWorkerId(getWorkerProfile(workerUserId).getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningPath> getLearningPaths() {
        return learningPathRepository.findAll();
    }

    @Override
    public void bookmarkCourse(UUID workerUserId, UUID courseId) {
        WorkerProfile profile = getWorkerProfile(workerUserId);
        CourseBookmark bookmark = new CourseBookmark();
        bookmark.setWorkerId(profile.getId());
        bookmark.setCourseId(courseId);
        courseBookmarkRepository.save(bookmark);
    }

    @Override
    public void removeBookmark(UUID workerUserId, UUID courseId) {
        courseBookmarkRepository.deleteByWorkerIdAndCourseId(getWorkerProfile(workerUserId).getId(), courseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> getBookmarkedCourses(UUID workerUserId) {
        return courseBookmarkRepository.findByWorkerId(getWorkerProfile(workerUserId).getId()).stream()
                .map(b -> courseRepository.findById(b.getCourseId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    private WorkerProfile getWorkerProfile(UUID workerUserId) {
        return workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
    }
}
