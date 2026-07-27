package com.skillbridge.platform.gigs.mapper;

import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.gigs.dto.response.GigResponse;
import com.skillbridge.platform.gigs.entity.Gig;

public final class GigMapper {

    private GigMapper() {
    }

    public static GigResponse toResponse(Gig gig) {
        return toResponse(gig, null);
    }

    public static GigResponse toResponse(Gig gig, Double distanceKm) {
        Double lat = gig.getLocation() != null ? GeoUtils.getLatitude(gig.getLocation()) : null;
        Double lng = gig.getLocation() != null ? GeoUtils.getLongitude(gig.getLocation()) : null;
        return new GigResponse(
                gig.getId(), gig.getEmployerId(), gig.getTitle(), gig.getDescription(), gig.getCategory(),
                gig.getHourlyRate(), gig.getEstimatedHours(), gig.getScheduledStart(), gig.getExpiresAt(),
                gig.getAddress(), lat, lng, gig.getStatus(), distanceKm);
    }
}
