package com.skillbridge.platform.tracking.service.impl;

import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.tracking.dto.EtaResponse;
import com.skillbridge.platform.tracking.dto.LocationPingRequest;
import com.skillbridge.platform.tracking.entity.LiveLocation;
import com.skillbridge.platform.tracking.entity.LocationHistory;
import com.skillbridge.platform.tracking.repository.LiveLocationRepository;
import com.skillbridge.platform.tracking.repository.LocationHistoryRepository;
import com.skillbridge.platform.tracking.service.TrackingService;
import com.skillbridge.platform.websocket.service.WebSocketNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TrackingServiceImpl implements TrackingService {

    /** Naive average-speed assumption for hyperlocal gig travel, used only for the ETA placeholder. */
    private static final double ASSUMED_AVERAGE_SPEED_KMH = 25.0;

    private final LiveLocationRepository liveLocationRepository;
    private final LocationHistoryRepository locationHistoryRepository;
    private final WebSocketNotifier webSocketNotifier;

    @Override
    public LiveLocation updateLocation(UUID userId, LocationPingRequest request) {
        LiveLocation liveLocation = liveLocationRepository.findByUserId(userId).orElseGet(() -> {
            LiveLocation l = new LiveLocation();
            l.setUserId(userId);
            return l;
        });
        liveLocation.setLocation(GeoUtils.toPoint(request.latitude(), request.longitude()));
        liveLocation.setHeadingDegrees(request.headingDegrees());
        liveLocation.setSpeedKmh(request.speedKmh());
        liveLocation.setActiveGigId(request.activeGigId());
        liveLocation = liveLocationRepository.save(liveLocation);

        if (request.activeGigId() != null) {
            LocationHistory history = new LocationHistory();
            history.setUserId(userId);
            history.setGigId(request.activeGigId());
            history.setLocation(liveLocation.getLocation());
            locationHistoryRepository.save(history);
            webSocketNotifier.sendLocationUpdate(request.activeGigId(), liveLocation);
        }
        return liveLocation;
    }

    @Override
    @Transactional(readOnly = true)
    public LiveLocation getLocation(UUID userId) {
        return liveLocationRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "No location reported for this user yet"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiveLocation> getNearby(double lat, double lng, double radiusKm) {
        return liveLocationRepository.findNearby(lat, lng, radiusKm * 1000);
    }

    @Override
    @Transactional(readOnly = true)
    public EtaResponse getEta(UUID fromUserId, double destLat, double destLng) {
        LiveLocation from = getLocation(fromUserId);
        double fromLat = GeoUtils.getLatitude(from.getLocation());
        double fromLng = GeoUtils.getLongitude(from.getLocation());
        double distanceKm = haversineKm(fromLat, fromLng, destLat, destLng);
        int etaMinutes = (int) Math.ceil((distanceKm / ASSUMED_AVERAGE_SPEED_KMH) * 60);
        return new EtaResponse(Math.round(distanceKm * 100.0) / 100.0, etaMinutes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationHistory> getGigTrail(UUID gigId) {
        return locationHistoryRepository.findByGigIdOrderByCreatedAtAsc(gigId);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int earthRadiusKm = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}
