package com.skillbridge.platform.schemes.service.impl;

import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.schemes.entity.GovernmentScheme;
import com.skillbridge.platform.schemes.entity.SchemeBookmark;
import com.skillbridge.platform.schemes.repository.GovernmentSchemeRepository;
import com.skillbridge.platform.schemes.repository.SchemeBookmarkRepository;
import com.skillbridge.platform.schemes.service.SchemeService;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SchemeServiceImpl implements SchemeService {

    private final GovernmentSchemeRepository schemeRepository;
    private final SchemeBookmarkRepository schemeBookmarkRepository;
    private final WorkerProfileRepository workerProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public List<GovernmentScheme> search(String keyword, String category) {
        if (category != null && !category.isBlank()) {
            return schemeRepository.findByActiveTrueAndCategoryIgnoreCase(category);
        }
        if (keyword != null && !keyword.isBlank()) {
            return schemeRepository.findByActiveTrueAndTitleContainingIgnoreCase(keyword);
        }
        return schemeRepository.findByActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public GovernmentScheme getScheme(UUID schemeId) {
        return schemeRepository.findById(schemeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Scheme not found"));
    }

    /**
     * Very small rule-based eligibility filter driven by the scheme's
     * {@code eligibilityCriteria} string (e.g. "min_age:18,max_age:40").
     * A real deployment would replace/augment this with a dedicated
     * eligibility-rules engine or an external government-data API.
     */
    @Override
    @Transactional(readOnly = true)
    public List<GovernmentScheme> getEligibleSchemes(UUID workerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));

        Integer age = profile.getDateOfBirth() != null
                ? Period.between(profile.getDateOfBirth(), LocalDate.now()).getYears() : null;

        return schemeRepository.findByActiveTrue().stream()
                .filter(scheme -> isEligible(scheme, age))
                .collect(Collectors.toList());
    }

    private boolean isEligible(GovernmentScheme scheme, Integer age) {
        if (scheme.getEligibilityCriteria() == null || scheme.getEligibilityCriteria().isBlank() || age == null) {
            return true; // no criteria configured (or no profile data) - don't over-filter
        }
        for (String rule : scheme.getEligibilityCriteria().split(",")) {
            String[] parts = rule.split(":");
            if (parts.length != 2) continue;
            String key = parts[0].trim();
            String value = parts[1].trim();
            try {
                if (key.equalsIgnoreCase("min_age") && age < Integer.parseInt(value)) return false;
                if (key.equalsIgnoreCase("max_age") && age > Integer.parseInt(value)) return false;
            } catch (NumberFormatException ignored) {
                // Malformed rule - skip rather than fail the whole eligibility check.
            }
        }
        return true;
    }

    @Override
    public void bookmark(UUID workerUserId, UUID schemeId) {
        WorkerProfile profile = getProfile(workerUserId);
        SchemeBookmark bookmark = new SchemeBookmark();
        bookmark.setWorkerId(profile.getId());
        bookmark.setSchemeId(schemeId);
        schemeBookmarkRepository.save(bookmark);
    }

    @Override
    public void removeBookmark(UUID workerUserId, UUID schemeId) {
        schemeBookmarkRepository.deleteByWorkerIdAndSchemeId(getProfile(workerUserId).getId(), schemeId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GovernmentScheme> getBookmarked(UUID workerUserId) {
        return schemeBookmarkRepository.findByWorkerId(getProfile(workerUserId).getId()).stream()
                .map(b -> schemeRepository.findById(b.getSchemeId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    private WorkerProfile getProfile(UUID workerUserId) {
        return workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
    }
}
