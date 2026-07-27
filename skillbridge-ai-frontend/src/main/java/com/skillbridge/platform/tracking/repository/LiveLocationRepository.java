package com.skillbridge.platform.tracking.repository;

import com.skillbridge.platform.tracking.entity.LiveLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LiveLocationRepository extends JpaRepository<LiveLocation, UUID> {
    Optional<LiveLocation> findByUserId(UUID userId);

    @Query(value = """
            SELECT * FROM live_locations l
            WHERE ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            """, nativeQuery = true)
    List<LiveLocation> findNearby(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);
}
