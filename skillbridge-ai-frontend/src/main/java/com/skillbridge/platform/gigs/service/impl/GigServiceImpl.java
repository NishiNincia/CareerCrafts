package com.skillbridge.platform.gigs.service.impl;

import com.skillbridge.platform.common.config.RabbitMqConfig;
import com.skillbridge.platform.common.exception.ApiException;
import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.employers.repository.EmployerProfileRepository;
import com.skillbridge.platform.gigs.dto.request.GigCreateRequest;
import com.skillbridge.platform.gigs.dto.request.GigRatingRequest;
import com.skillbridge.platform.gigs.dto.response.GigResponse;
import com.skillbridge.platform.gigs.entity.Gig;
import com.skillbridge.platform.gigs.entity.GigDispatch;
import com.skillbridge.platform.gigs.entity.GigRating;
import com.skillbridge.platform.gigs.mapper.GigMapper;
import com.skillbridge.platform.gigs.repository.GigDispatchRepository;
import com.skillbridge.platform.gigs.repository.GigRatingRepository;
import com.skillbridge.platform.gigs.repository.GigRepository;
import com.skillbridge.platform.gigs.service.GigService;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GigServiceImpl implements GigService {

    private final GigRepository gigRepository;
    private final GigDispatchRepository gigDispatchRepository;
    private final GigRatingRepository gigRatingRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final RabbitTemplate rabbitTemplate;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public GigResponse createGig(UUID employerUserId, GigCreateRequest request) {
        var employer = employerProfileRepository.findByUserId(employerUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.EMPLOYER_NOT_FOUND, "Employer profile not found"));

        Gig gig = new Gig();
        gig.setEmployerId(employer.getId());
        gig.setTitle(request.title());
        gig.setDescription(request.description());
        gig.setCategory(request.category());
        gig.setHourlyRate(request.hourlyRate());
        gig.setEstimatedHours(request.estimatedHours());
        gig.setScheduledStart(request.scheduledStart());
        gig.setExpiresAt(request.expiresAt());
        gig.setAddress(request.address());
        gig.setLocation(GeoUtils.toPoint(request.latitude(), request.longitude()));
        return GigMapper.toResponse(gigRepository.save(gig));
    }

    @Override
    @Transactional(readOnly = true)
    public GigResponse getGig(UUID gigId) {
        return GigMapper.toResponse(findGig(gigId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GigResponse> getNearbyGigs(double lat, double lng, double radiusKm) {
        return gigRepository.findNearbyOpenGigs(lat, lng, radiusKm * 1000).stream()
                .map(GigMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<GigDispatch> dispatchGig(UUID employerUserId, UUID gigId, double radiusKm) {
        Gig gig = getOwnedGig(employerUserId, gigId);
        if (gig.getStatus() != Gig.GigStatus.OPEN) {
            throw new ApiException(ErrorCode.ILLEGAL_STATE, "Gig must be OPEN to dispatch");
        }
        double lat = GeoUtils.getLatitude(gig.getLocation());
        double lng = GeoUtils.getLongitude(gig.getLocation());

        List<WorkerProfile> nearbyWorkers = workerProfileRepository.findAvailableWorkersNear(lat, lng, radiusKm * 1000);

        List<GigDispatch> dispatches = nearbyWorkers.stream().map(worker -> {
            GigDispatch dispatch = new GigDispatch();
            dispatch.setGigId(gig.getId());
            dispatch.setWorkerId(worker.getId());
            dispatch.setOfferedAt(Instant.now());
            return gigDispatchRepository.save(dispatch);
        }).collect(Collectors.toList());

        gig.setStatus(Gig.GigStatus.DISPATCHED);
        gigRepository.save(gig);

        for (GigDispatch dispatch : dispatches) {
            rabbitTemplate.convertAndSend(RabbitMqConfig.GIG_DISPATCH_EXCHANGE, RabbitMqConfig.GIG_DISPATCH_ROUTING_KEY,
                    Map.of("gigId", gig.getId().toString(), "workerId", dispatch.getWorkerId().toString(),
                            "title", gig.getTitle()));
        }
        return dispatches;
    }

    @Override
    public GigDispatch acceptGig(UUID workerUserId, UUID gigId) {
        WorkerProfile worker = getWorkerProfile(workerUserId);
        GigDispatch dispatch = gigDispatchRepository.findByGigIdAndWorkerId(gigId, worker.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.GIG_NOT_FOUND, "No dispatch found for this gig/worker"));

        Gig gig = findGig(gigId);
        if (gig.getStatus() == Gig.GigStatus.ACCEPTED || gig.getStatus() == Gig.GigStatus.IN_PROGRESS
                || gig.getStatus() == Gig.GigStatus.COMPLETED) {
            throw new ApiException(ErrorCode.GIG_ALREADY_ACCEPTED, "Gig has already been accepted by another worker");
        }
        if (Instant.now().isAfter(gig.getExpiresAt())) {
            throw new ApiException(ErrorCode.GIG_EXPIRED, "This gig offer has expired");
        }

        dispatch.setStatus(GigDispatch.DispatchStatus.ACCEPTED);
        dispatch.setRespondedAt(Instant.now());
        dispatch.setStartOtpHash(hashOtp(generateOtp()));
        dispatch.setCompletionOtpHash(hashOtp(generateOtp()));
        gigDispatchRepository.save(dispatch);

        gig.setStatus(Gig.GigStatus.ACCEPTED);
        gigRepository.save(gig);

        // Auto-decline every other outstanding offer for this gig.
        gigDispatchRepository.findByGigId(gigId).stream()
                .filter(d -> !d.getId().equals(dispatch.getId()))
                .filter(d -> d.getStatus() == GigDispatch.DispatchStatus.OFFERED)
                .forEach(d -> {
                    d.setStatus(GigDispatch.DispatchStatus.EXPIRED);
                    gigDispatchRepository.save(d);
                });

        return dispatch;
    }

    @Override
    public GigDispatch declineGig(UUID workerUserId, UUID gigId) {
        WorkerProfile worker = getWorkerProfile(workerUserId);
        GigDispatch dispatch = gigDispatchRepository.findByGigIdAndWorkerId(gigId, worker.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.GIG_NOT_FOUND, "No dispatch found for this gig/worker"));
        dispatch.setStatus(GigDispatch.DispatchStatus.DECLINED);
        dispatch.setRespondedAt(Instant.now());
        return gigDispatchRepository.save(dispatch);
    }

    @Override
    public GigDispatch verifyStartOtp(UUID workerUserId, UUID gigId, String otp) {
        GigDispatch dispatch = getAcceptedDispatch(workerUserId, gigId);
        if (dispatch.getStartOtpHash() == null || !BCrypt.checkpw(otp, dispatch.getStartOtpHash())) {
            throw new ApiException(ErrorCode.GIG_OTP_MISMATCH, "Incorrect start OTP");
        }
        dispatch.setStatus(GigDispatch.DispatchStatus.IN_PROGRESS);
        dispatch.setStartedAt(Instant.now());
        gigDispatchRepository.save(dispatch);

        Gig gig = findGig(gigId);
        gig.setStatus(Gig.GigStatus.IN_PROGRESS);
        gigRepository.save(gig);
        return dispatch;
    }

    @Override
    public GigDispatch verifyCompletionOtp(UUID workerUserId, UUID gigId, String otp) {
        GigDispatch dispatch = getAcceptedDispatch(workerUserId, gigId);
        if (dispatch.getCompletionOtpHash() == null || !BCrypt.checkpw(otp, dispatch.getCompletionOtpHash())) {
            throw new ApiException(ErrorCode.GIG_OTP_MISMATCH, "Incorrect completion OTP");
        }
        dispatch.setStatus(GigDispatch.DispatchStatus.COMPLETED);
        dispatch.setCompletedAt(Instant.now());
        gigDispatchRepository.save(dispatch);

        Gig gig = findGig(gigId);
        gig.setStatus(Gig.GigStatus.COMPLETED);
        gigRepository.save(gig);
        return dispatch;
    }

    @Override
    public void expireStaleGigs() {
        gigRepository.findByStatusAndExpiresAtBefore(Gig.GigStatus.OPEN, Instant.now())
                .forEach(gig -> {
                    gig.setStatus(Gig.GigStatus.EXPIRED);
                    gigRepository.save(gig);
                });
        gigRepository.findByStatusAndExpiresAtBefore(Gig.GigStatus.DISPATCHED, Instant.now())
                .forEach(gig -> {
                    gig.setStatus(Gig.GigStatus.EXPIRED);
                    gigRepository.save(gig);
                });
    }

    @Override
    public GigRating rateParticipant(UUID raterUserId, UUID gigId, GigRatingRequest request) {
        findGig(gigId); // validates gig exists
        GigRating rating = new GigRating();
        rating.setGigId(gigId);
        rating.setRaterUserId(raterUserId);
        rating.setRateeUserId(request.rateeUserId());
        rating.setStars(request.stars());
        rating.setComment(request.comment());
        return gigRatingRepository.save(rating);
    }

    private Gig findGig(UUID gigId) {
        return gigRepository.findById(gigId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.GIG_NOT_FOUND, "Gig not found"));
    }

    private Gig getOwnedGig(UUID employerUserId, UUID gigId) {
        var employer = employerProfileRepository.findByUserId(employerUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.EMPLOYER_NOT_FOUND, "Employer profile not found"));
        Gig gig = findGig(gigId);
        if (!gig.getEmployerId().equals(employer.getId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "You do not own this gig");
        }
        return gig;
    }

    private WorkerProfile getWorkerProfile(UUID workerUserId) {
        return workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
    }

    private GigDispatch getAcceptedDispatch(UUID workerUserId, UUID gigId) {
        WorkerProfile worker = getWorkerProfile(workerUserId);
        GigDispatch dispatch = gigDispatchRepository.findByGigIdAndWorkerId(gigId, worker.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.GIG_NOT_FOUND, "No dispatch found for this gig/worker"));
        if (dispatch.getStatus() != GigDispatch.DispatchStatus.ACCEPTED
                && dispatch.getStatus() != GigDispatch.DispatchStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.ILLEGAL_STATE, "Gig must be accepted before OTP verification");
        }
        return dispatch;
    }

    private String generateOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String hashOtp(String otp) {
        log.info("Generated gig OTP (dev-mode logging; wire to SMS gateway in production): {}", otp);
        return BCrypt.hashpw(otp, BCrypt.gensalt());
    }
}
