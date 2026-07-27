package com.skillbridge.platform.learning.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.learning.entity.Course;
import com.skillbridge.platform.learning.entity.LearningPath;
import com.skillbridge.platform.learning.entity.LearningProgress;
import com.skillbridge.platform.learning.service.LearningService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
@Tag(name = "Learning", description = "Courses, learning progress, certificates, and learning paths")
public class LearningController {

    private final LearningService learningService;

    @GetMapping("/courses")
    public ApiResponse<List<Course>> searchCourses(@RequestParam(required = false) String keyword,
                                                     @RequestParam(required = false) String skill) {
        return ApiResponse.success(learningService.searchCourses(keyword, skill));
    }

    @GetMapping("/courses/{courseId}")
    public ApiResponse<Course> getCourse(@PathVariable UUID courseId) {
        return ApiResponse.success(learningService.getCourse(courseId));
    }

    @PutMapping("/courses/{courseId}/progress")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<LearningProgress> updateProgress(@PathVariable UUID courseId, @RequestParam int progressPercent) {
        return ApiResponse.success(learningService.updateProgress(CurrentUserId.get(), courseId, progressPercent));
    }

    @GetMapping("/progress")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<LearningProgress>> myProgress() {
        return ApiResponse.success(learningService.getMyProgress(CurrentUserId.get()));
    }

    @GetMapping("/paths")
    public ApiResponse<List<LearningPath>> paths() {
        return ApiResponse.success(learningService.getLearningPaths());
    }

    @PostMapping("/courses/{courseId}/bookmark")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<Void> bookmark(@PathVariable UUID courseId) {
        learningService.bookmarkCourse(CurrentUserId.get(), courseId);
        return ApiResponse.success("Course bookmarked", null);
    }

    @DeleteMapping("/courses/{courseId}/bookmark")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<Void> removeBookmark(@PathVariable UUID courseId) {
        learningService.removeBookmark(CurrentUserId.get(), courseId);
        return ApiResponse.success("Bookmark removed", null);
    }

    @GetMapping("/courses/bookmarks")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<Course>> bookmarkedCourses() {
        return ApiResponse.success(learningService.getBookmarkedCourses(CurrentUserId.get()));
    }
}
