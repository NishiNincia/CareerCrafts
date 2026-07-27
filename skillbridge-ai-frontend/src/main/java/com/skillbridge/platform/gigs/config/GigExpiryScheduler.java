package com.skillbridge.platform.gigs.config;

import com.skillbridge.platform.gigs.service.GigService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GigExpiryScheduler {

    private final GigService gigService;

    /** Sweeps for open/dispatched gigs past their expiry every minute. */
    @Scheduled(fixedDelay = 60_000)
    public void expireStaleGigs() {
        gigService.expireStaleGigs();
    }
}
