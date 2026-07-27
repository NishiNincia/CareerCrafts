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

/** Append-only trail of location pings, primarily used to reconstruct a gig's travel history. */
@Getter
@Setter
@Entity
@Table(name = "location_history", indexes = {
        @Index(name = "idx_location_history_user", columnList = "user_id"),
        @Index(name = "idx_location_history_gig", columnList = "gig_id")
})
public class LocationHistory extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "gig_id")
    private UUID gigId;

    @Column(columnDefinition = "geometry(Point,4326)", nullable = false)
    private Point location;
}
