package com.skillbridge.platform.tracking.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.util.UUID;

/** Current (latest) location for a user - one row per user, upserted on every ping. */
@Getter
@Setter
@Entity
@Table(name = "live_locations", indexes = @Index(name = "idx_live_location_user", columnList = "user_id", unique = true))
public class LiveLocation extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(columnDefinition = "geometry(Point,4326)", nullable = false)
    private Point location;

    @Column(name = "heading_degrees")
    private Double headingDegrees;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    /** Optional gig this location ping is associated with (for live tracking during an active gig). */
    @Column(name = "active_gig_id")
    private UUID activeGigId;
}
