package com.skillbridge.platform.gigs.repository;

import com.skillbridge.platform.gigs.entity.Gig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface GigRepository extends JpaRepository<Gig, UUID> {

    List<Gig> findByEmployerId(UUID employerId);

    List<Gig> findByStatusAndExpiresAtBefore(Gig.GigStatus status, Instant instant);

    @Query(value = """
            SELECT * FROM hourly_gigs g
            WHERE g.status = 'OPEN' AND g.is_deleted = false
            AND ST_DWithin(g.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            ORDER BY ST_Distance(g.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
            """, nativeQuery = true)
    List<Gig> findNearbyOpenGigs(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);
}
