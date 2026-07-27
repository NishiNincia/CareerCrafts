package com.skillbridge.platform.gigs.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.gigs.dto.request.GigCreateRequest;
import com.skillbridge.platform.gigs.dto.request.GigRatingRequest;
import com.skillbridge.platform.gigs.dto.request.OtpVerifyGigRequest;
import com.skillbridge.platform.gigs.dto.response.GigResponse;
import com.skillbridge.platform.gigs.entity.GigDispatch;
import com.skillbridge.platform.gigs.entity.GigRating;
import com.skillbridge.platform.gigs.service.GigService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gigs")
@RequiredArgsConstructor
@Tag(name = "Hyperlocal Gigs", description = "Hourly gig CRUD, nearby search, dispatch, accept/decline, OTP, ratings")
public class GigController {

    private final GigService gigService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GigResponse> createGig(@Valid @RequestBody GigCreateRequest request) {
        return ApiResponse.success("Gig posted successfully", gigService.createGig(CurrentUserId.get(), request));
    }

    @GetMapping("/{gigId}")
    public ApiResponse<GigResponse> getGig(@PathVariable UUID gigId) {
        return ApiResponse.success(gigService.getGig(gigId));
    }

    @GetMapping("/nearby")
    public ApiResponse<List<GigResponse>> nearby(
            @RequestParam double lat, @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radiusKm) {
        return ApiResponse.success(gigService.getNearbyGigs(lat, lng, radiusKm));
    }

    @PostMapping("/{gigId}/dispatch")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<List<GigDispatch>> dispatch(
            @PathVariable UUID gigId, @RequestParam(defaultValue = "5") double radiusKm) {
        return ApiResponse.success("Gig dispatched to nearby available workers",
                gigService.dispatchGig(CurrentUserId.get(), gigId, radiusKm));
    }

    @PostMapping("/{gigId}/accept")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<GigDispatch> accept(@PathVariable UUID gigId) {
        return ApiResponse.success("Gig accepted", gigService.acceptGig(CurrentUserId.get(), gigId));
    }

    @PostMapping("/{gigId}/decline")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<GigDispatch> decline(@PathVariable UUID gigId) {
        return ApiResponse.success("Gig declined", gigService.declineGig(CurrentUserId.get(), gigId));
    }

    @PostMapping("/{gigId}/verify-start-otp")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<GigDispatch> verifyStart(@PathVariable UUID gigId, @Valid @RequestBody OtpVerifyGigRequest request) {
        return ApiResponse.success("Gig started", gigService.verifyStartOtp(CurrentUserId.get(), gigId, request.otp()));
    }

    @PostMapping("/{gigId}/verify-completion-otp")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<GigDispatch> verifyCompletion(@PathVariable UUID gigId, @Valid @RequestBody OtpVerifyGigRequest request) {
        return ApiResponse.success("Gig marked complete", gigService.verifyCompletionOtp(CurrentUserId.get(), gigId, request.otp()));
    }

    @PostMapping("/{gigId}/rate")
    @PreAuthorize("hasAnyRole('WORKER','EMPLOYER')")
    public ApiResponse<GigRating> rate(@PathVariable UUID gigId, @Valid @RequestBody GigRatingRequest request) {
        return ApiResponse.success("Rating submitted", gigService.rateParticipant(CurrentUserId.get(), gigId, request));
    }
}
