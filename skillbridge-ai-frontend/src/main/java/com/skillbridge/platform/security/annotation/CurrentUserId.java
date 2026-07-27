package com.skillbridge.platform.security.annotation;

import com.skillbridge.platform.security.principal.UserPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Small static helper to pull the authenticated user's id out of the
 * SecurityContext. Kept as a plain utility (rather than an @AuthenticationPrincipal
 * argument resolver) to keep controller signatures simple across every module.
 */
public final class CurrentUserId {

    private CurrentUserId() {
    }

    public static UUID get() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return principal.getUserId();
    }
}
