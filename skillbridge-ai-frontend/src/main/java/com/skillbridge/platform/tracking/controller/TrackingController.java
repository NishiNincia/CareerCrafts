package com.skillbridge.platform.tracking.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import com.skillbridge.platform.tracking.dto.EtaResponse;
import com.skillbridge.platform.tracking.dto.LocationPingRequest;
import com.skillbridge.platform.tracking.entity.LiveLocation;
import com.skillbridge.platform.tracking.entity.LocationHistory;
import com.skillbridge.platform.tracking.service.TrackingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Live Tracking", description = "Worker/employer live location, nearby search, ETA, and gig travel history")
public class TrackingController {

    private final TrackingService trackingService;

    @PostMapping("/ping")
    public ApiResponse<LiveLocation> ping(@Valid @RequestBody LocationPingRequest request) {
        return ApiResponse.success(trackingService.updateLocation(CurrentUserId.get(), request));
    }

    @GetMapping("/me")
    public ApiResponse<LiveLocation> myLocation() {
        return ApiResponse.success(trackingService.getLocation(CurrentUserId.get()));
    }

    @GetMapping("/nearby")
    public ApiResponse<List<LiveLocation>> nearby(@RequestParam double lat, @RequestParam double lng,
                                                    @RequestParam(defaultValue = "5") double radiusKm) {
        return ApiResponse.success(trackingService.getNearby(lat, lng, radiusKm));
    }

    @GetMapping("/eta")
    public ApiResponse<EtaResponse> eta(@RequestParam double destLat, @RequestParam double destLng) {
        return ApiResponse.success(trackingService.getEta(CurrentUserId.get(), destLat, destLng));
    }

    @GetMapping("/gigs/{gigId}/trail")
    public ApiResponse<List<LocationHistory>> gigTrail(@PathVariable UUID gigId) {
        return ApiResponse.success(trackingService.getGigTrail(gigId));
    }
}
