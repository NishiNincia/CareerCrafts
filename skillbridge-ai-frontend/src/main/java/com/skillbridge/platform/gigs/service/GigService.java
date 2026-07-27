package com.skillbridge.platform.gigs.service;

import com.skillbridge.platform.gigs.dto.request.GigCreateRequest;
import com.skillbridge.platform.gigs.dto.request.GigRatingRequest;
import com.skillbridge.platform.gigs.dto.response.GigResponse;
import com.skillbridge.platform.gigs.entity.GigDispatch;
import com.skillbridge.platform.gigs.entity.GigRating;

import java.util.List;
import java.util.UUID;

public interface GigService {
    GigResponse createGig(UUID employerUserId, GigCreateRequest request);
    GigResponse getGig(UUID gigId);
    List<GigResponse> getNearbyGigs(double lat, double lng, double radiusKm);
    List<GigDispatch> dispatchGig(UUID employerUserId, UUID gigId, double radiusKm);
    GigDispatch acceptGig(UUID workerUserId, UUID gigId);
    GigDispatch declineGig(UUID workerUserId, UUID gigId);
    GigDispatch verifyStartOtp(UUID workerUserId, UUID gigId, String otp);
    GigDispatch verifyCompletionOtp(UUID workerUserId, UUID gigId, String otp);
    void expireStaleGigs();
    GigRating rateParticipant(UUID raterUserId, UUID gigId, GigRatingRequest request);
}
