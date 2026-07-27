package com.skillbridge.platform.schemes.service;

import com.skillbridge.platform.schemes.entity.GovernmentScheme;

import java.util.List;
import java.util.UUID;

public interface SchemeService {
    List<GovernmentScheme> search(String keyword, String category);
    GovernmentScheme getScheme(UUID schemeId);
    List<GovernmentScheme> getEligibleSchemes(UUID workerUserId);
    void bookmark(UUID workerUserId, UUID schemeId);
    void removeBookmark(UUID workerUserId, UUID schemeId);
    List<GovernmentScheme> getBookmarked(UUID workerUserId);
}
