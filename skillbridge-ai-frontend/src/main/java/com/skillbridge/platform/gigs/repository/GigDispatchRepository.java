package com.skillbridge.platform.gigs.repository;

import com.skillbridge.platform.gigs.entity.GigDispatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GigDispatchRepository extends JpaRepository<GigDispatch, UUID> {
    List<GigDispatch> findByGigId(UUID gigId);
    List<GigDispatch> findByWorkerId(UUID workerId);
    Optional<GigDispatch> findByGigIdAndWorkerId(UUID gigId, UUID workerId);
}
