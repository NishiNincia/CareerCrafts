package com.skillbridge.platform.tracking.repository;

import com.skillbridge.platform.tracking.entity.LocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LocationHistoryRepository extends JpaRepository<LocationHistory, UUID> {
    List<LocationHistory> findByGigIdOrderByCreatedAtAsc(UUID gigId);
}
