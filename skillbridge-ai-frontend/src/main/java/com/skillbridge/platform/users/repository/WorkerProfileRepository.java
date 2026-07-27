package com.skillbridge.platform.users.repository;

import com.skillbridge.platform.users.entity.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, UUID> {

    Optional<WorkerProfile> findByUserId(UUID userId);

    @Query(value = """
            SELECT * FROM worker_profiles w
            WHERE w.is_available = true AND w.is_deleted = false
            AND ST_DWithin(w.current_location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            ORDER BY ST_Distance(w.current_location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
            """, nativeQuery = true)
    java.util.List<WorkerProfile> findAvailableWorkersNear(
            @Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);
}
