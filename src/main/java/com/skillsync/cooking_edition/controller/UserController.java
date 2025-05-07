package com.skillsync.cooking_edition.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/follow-status")
    public ResponseEntity<?> getFollowStatus(@PathVariable String id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                User currentUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                boolean isFollowing = currentUser.getFollowing() != null && 
                                    currentUser.getFollowing().contains(id);
                
                return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        } catch (Exception e) {
            logger.error("Error checking follow status", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to check follow status"));
        }
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> followUser(@PathVariable String id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                if (currentUserId.equals(id)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Cannot follow yourself"));
                }
                
                User currentUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                User targetUser = userRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                // Initialize lists if null
                if (currentUser.getFollowing() == null) {
                    currentUser.setFollowing(new ArrayList<>());
                }
                if (targetUser.getFollowers() == null) {
                    targetUser.setFollowers(new ArrayList<>());
                }
                
                // Add to following/followers lists
                if (!currentUser.getFollowing().contains(id)) {
                    currentUser.getFollowing().add(id);
                    targetUser.getFollowers().add(currentUserId);
                    
                    userRepository.save(currentUser);
                    userRepository.save(targetUser);
                }
                
                return ResponseEntity.ok(Map.of("message", "Successfully followed user"));
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        } catch (Exception e) {
            logger.error("Error following user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to follow user"));
        }
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<?> unfollowUser(@PathVariable String id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                User currentUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                User targetUser = userRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                // Remove from following/followers lists
                if (currentUser.getFollowing() != null) {
                    currentUser.getFollowing().remove(id);
                }
                if (targetUser.getFollowers() != null) {
                    targetUser.getFollowers().remove(currentUserId);
                }
                
                userRepository.save(currentUser);
                userRepository.save(targetUser);
                
                return ResponseEntity.ok(Map.of("message", "Successfully unfollowed user"));
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        } catch (Exception e) {
            logger.error("Error unfollowing user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to unfollow user"));
        }
    }

    @GetMapping("/{id}/profile")
    // ... existing code ...

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            // Map users to DTOs to avoid sending sensitive information
            List<Map<String, Object>> userDTOs = users.stream()
                .map(user -> Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "profilePicture", user.getProfilePicture(),
                    "bio", user.getBio(),
                    "posts", user.getPosts() != null ? user.getPosts().size() : 0,
                    "followers", user.getFollowers() != null ? user.getFollowers().size() : 0,
                    "following", user.getFollowing() != null ? user.getFollowing().size() : 0
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            logger.error("Error fetching users", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch users"));
        }
    }
} 