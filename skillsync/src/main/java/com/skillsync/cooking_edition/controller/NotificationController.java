package com.skillsync.cooking_edition.controller;

import com.skillsync.cooking_edition.model.Notification;
import com.skillsync.cooking_edition.service.InteractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private InteractionService interactionService;

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(@AuthenticationPrincipal OAuth2User principal) {
        try {
            if (principal == null) {
                logger.error("Principal is null - user not authenticated");
                return ResponseEntity.badRequest().build();
            }
            
            String userId = principal.getName();
            String userEmail = principal.getAttribute("email");
            logger.info("Fetching notifications for user - ID: {}, Email: {}", userId, userEmail);
            
            List<Notification> notifications = interactionService.getUserNotifications(userId);
            logger.info("Found {} notifications for user {} ({})", notifications.size(), userId, userEmail);
            
            if (notifications.isEmpty()) {
                logger.info("No notifications found for user {} ({})", userId, userEmail);
            } else {
                notifications.forEach(notification -> 
                    logger.info("Notification for user {} ({}): id={}, type={}, sender={}, created={}", 
                        userId, userEmail, notification.getId(), notification.getType(),
                        notification.getSenderName(), notification.getCreatedAt())
                );
            }
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Error fetching notifications", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@AuthenticationPrincipal OAuth2User principal) {
        try {
            if (principal == null) {
                logger.error("Principal is null - user not authenticated");
                return ResponseEntity.badRequest().build();
            }
            
            String userId = principal.getName();
            String userEmail = principal.getAttribute("email");
            logger.info("Fetching unread notifications for user - ID: {}, Email: {}", userId, userEmail);
            
            List<Notification> notifications = interactionService.getUnreadNotifications(userId);
            logger.info("Found {} unread notifications for user {} ({})", notifications.size(), userId, userEmail);
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Error fetching unread notifications", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markNotificationAsRead(
            @PathVariable String notificationId,
            @AuthenticationPrincipal OAuth2User principal) {
        try {
            if (principal == null) {
                logger.error("Principal is null - user not authenticated");
                return ResponseEntity.badRequest().build();
            }
            
            String userId = principal.getName();
            String userEmail = principal.getAttribute("email");
            logger.info("Marking notification {} as read for user - ID: {}, Email: {}", 
                notificationId, userId, userEmail);
            
            interactionService.markNotificationAsRead(notificationId, userId);
            logger.info("Successfully marked notification {} as read for user {} ({})", 
                notificationId, userId, userEmail);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error marking notification as read", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal OAuth2User principal) {
        try {
            if (principal == null) {
                logger.error("Principal is null - user not authenticated");
                return ResponseEntity.badRequest().build();
            }
            
            String userId = principal.getName();
            String userEmail = principal.getAttribute("email");
            logger.info("Marking all notifications as read for user - ID: {}, Email: {}", userId, userEmail);
            
            List<Notification> unreadNotifications = interactionService.getUnreadNotifications(userId);
            logger.info("Found {} unread notifications to mark as read for user {} ({})", 
                unreadNotifications.size(), userId, userEmail);
            
            for (Notification notification : unreadNotifications) {
                interactionService.markNotificationAsRead(notification.getId(), userId);
            }
            
            logger.info("Successfully marked all notifications as read for user {} ({})", userId, userEmail);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error marking all notifications as read", e);
            return ResponseEntity.status(500).build();
        }
    }
} 