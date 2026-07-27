package com.skillbridge.platform.jobs.repository;

import com.skillbridge.platform.jobs.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    List<Job> findByEmployerId(UUID employerId);

    @Query(value = """
            SELECT * FROM jobs j
            WHERE j.status = 'OPEN' AND j.is_deleted = false
            AND ST_DWithin(j.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            ORDER BY ST_Distance(j.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
            """, nativeQuery = true)
    List<Job> findNearbyOpenJobs(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);
}
