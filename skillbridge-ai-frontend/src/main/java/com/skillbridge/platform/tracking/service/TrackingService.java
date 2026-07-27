package com.skillbridge.platform.tracking.service;

import com.skillbridge.platform.tracking.dto.EtaResponse;
import com.skillbridge.platform.tracking.dto.LocationPingRequest;
import com.skillbridge.platform.tracking.entity.LiveLocation;
import com.skillbridge.platform.tracking.entity.LocationHistory;

import java.util.List;
import java.util.UUID;

public interface TrackingService {
    LiveLocation updateLocation(UUID userId, LocationPingRequest request);
    LiveLocation getLocation(UUID userId);
    List<LiveLocation> getNearby(double lat, double lng, double radiusKm);
    EtaResponse getEta(UUID fromUserId, double destLat, double destLng);
    List<LocationHistory> getGigTrail(UUID gigId);
}
