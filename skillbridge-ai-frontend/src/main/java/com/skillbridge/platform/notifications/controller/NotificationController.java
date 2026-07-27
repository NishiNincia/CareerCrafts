package com.skillbridge.platform.notifications.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.notifications.entity.Notification;
import com.skillbridge.platform.notifications.service.NotificationService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app, email, and push notifications; also delivered realtime over WebSocket")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<Notification>> getRecent(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(notificationService.getRecent(CurrentUserId.get(), page, size));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount() {
        return ApiResponse.success(Map.of("unreadCount", notificationService.getUnreadCount(CurrentUserId.get())));
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<Void> markAsRead(@PathVariable UUID notificationId) {
        notificationService.markAsRead(CurrentUserId.get(), notificationId);
        return ApiResponse.success("Marked as read", null);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead(CurrentUserId.get());
        return ApiResponse.success("All notifications marked as read", null);
    }
}
