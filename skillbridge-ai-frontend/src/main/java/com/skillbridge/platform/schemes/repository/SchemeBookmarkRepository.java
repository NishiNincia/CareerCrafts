package com.skillbridge.platform.schemes.repository;

import com.skillbridge.platform.schemes.entity.SchemeBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SchemeBookmarkRepository extends JpaRepository<SchemeBookmark, UUID> {
    List<SchemeBookmark> findByWorkerId(UUID workerId);
    void deleteByWorkerIdAndSchemeId(UUID workerId, UUID schemeId);
}
