package com.skillbridge.platform.schemes.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.schemes.entity.GovernmentScheme;
import com.skillbridge.platform.schemes.service.SchemeService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schemes")
@RequiredArgsConstructor
@Tag(name = "Government Schemes", description = "Scheme discovery, eligibility, search, and bookmarks")
public class SchemeController {

    private final SchemeService schemeService;

    @GetMapping("/public/search")
    public ApiResponse<List<GovernmentScheme>> search(@RequestParam(required = false) String keyword,
                                                        @RequestParam(required = false) String category) {
        return ApiResponse.success(schemeService.search(keyword, category));
    }

    @GetMapping("/public/{schemeId}")
    public ApiResponse<GovernmentScheme> getScheme(@PathVariable UUID schemeId) {
        return ApiResponse.success(schemeService.getScheme(schemeId));
    }

    @GetMapping("/eligible")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<GovernmentScheme>> eligible() {
        return ApiResponse.success(schemeService.getEligibleSchemes(CurrentUserId.get()));
    }

    @PostMapping("/{schemeId}/bookmark")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<Void> bookmark(@PathVariable UUID schemeId) {
        schemeService.bookmark(CurrentUserId.get(), schemeId);
        return ApiResponse.success("Scheme bookmarked", null);
    }

    @DeleteMapping("/{schemeId}/bookmark")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<Void> removeBookmark(@PathVariable UUID schemeId) {
        schemeService.removeBookmark(CurrentUserId.get(), schemeId);
        return ApiResponse.success("Bookmark removed", null);
    }

    @GetMapping("/bookmarks")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<List<GovernmentScheme>> bookmarks() {
        return ApiResponse.success(schemeService.getBookmarked(CurrentUserId.get()));
    }
}
