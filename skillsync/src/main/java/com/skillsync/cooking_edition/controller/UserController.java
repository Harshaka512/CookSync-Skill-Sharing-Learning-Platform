package com.skillsync.cooking_edition.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.skillsync.cooking_edition.model.Notification;
import com.skillsync.cooking_edition.model.User;
import com.skillsync.cooking_edition.repository.NotificationRepository;
import com.skillsync.cooking_edition.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        try {
            logger.info("Getting user with id: {}", id);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found: " + id));
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting user: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> userData) {
        try {
            String id = userData.get("id");
            String name = userData.get("name");
            String email = userData.get("email");
            
            logger.info("Creating user with data - id: {}, name: {}, email: {}", id, name, email);
            
            if (id == null || id.isEmpty()) {
                logger.error("User ID is missing");
                return ResponseEntity.badRequest().body(Map.of("message", "User ID is required"));
            }
            
            if (name == null || name.isEmpty()) {
                logger.error("User name is missing");
                return ResponseEntity.badRequest().body(Map.of("message", "User name is required"));
            }
            
            if (email == null || email.isEmpty()) {
                logger.error("User email is missing");
                return ResponseEntity.badRequest().body(Map.of("message", "User email is required"));
            }
            
            // Check if user already exists
            if (userRepository.existsById(id)) {
                logger.info("User already exists: {}", id);
                return ResponseEntity.ok(Map.of("message", "User already exists"));
            }
            
            // Create new user
            User user = new User();
            user.setId(id);
            user.setName(name);
            user.setEmail(email);
            user.setRole("USER");
            // Initialize following list as empty
            user.setFollowing(java.util.Collections.emptyList());
            
            try {
                userRepository.save(user);
                logger.info("User created successfully: {}", user.getId());
                
                return ResponseEntity.ok(Map.of(
                    "message", "User created successfully",
                    "id", user.getId(),
                    "name", user.getName()
                ));
            } catch (Exception saveError) {
                logger.error("Error saving user to database: {}", saveError.getMessage(), saveError);
                return ResponseEntity.badRequest().body(Map.of("message", "Database error: " + saveError.getMessage()));
            }
        } catch (Exception e) {
            logger.error("Error creating user: {}", userData.get("id"), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Failed to create user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String userId = oauth2User.getName();
                
                logger.info("Getting profile for user: {}", userId);
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));
                
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("role", user.getRole());
                response.put("following", user.getFollowing());
                response.put("bio", user.getBio());
                response.put("specialties", user.getSpecialties());
                response.put("favoriteRecipes", user.getFavoriteRecipes());
                response.put("isPrivate", user.isPrivate());
                response.put("profilePicture", user.getProfilePicture());
                response.put("coverPhoto", user.getCoverPhoto());
                response.put("followerCount", user.getFollowerCount());
                response.put("followingCount", user.getFollowingCount());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
        } catch (Exception e) {
            logger.error("Error getting user profile", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load profile data"));
        }
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserProfileById(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Check if the current user is following this user
            boolean isFollowing = false;
            boolean canViewPosts = !user.isPrivate(); // Can view if account is public
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                // If the current user is the profile owner or follows the user, they can view private posts
                if (currentUserId.equals(userId)) {
                    canViewPosts = true; // User can view their own posts
                } else {
                    User currentUser = userRepository.findById(currentUserId).orElse(null);
                    if (currentUser != null && currentUser.getFollowing() != null) {
                        isFollowing = currentUser.getFollowing().contains(userId);
                        if (isFollowing) {
                            canViewPosts = true; // Followers can view private posts
                        }
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("bio", user.getBio());
            response.put("profilePicture", user.getProfilePicture());
            response.put("coverPhoto", user.getCoverPhoto());
            response.put("specialties", user.getSpecialties());
            response.put("favoriteRecipes", user.getFavoriteRecipes());
            response.put("followerCount", user.getFollowerCount());
            response.put("followingCount", user.getFollowingCount());
            response.put("isPrivate", user.isPrivate());
            response.put("canViewPosts", canViewPosts);
            response.put("isFollowing", isFollowing);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching user profile", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch user profile data"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody Map<String, Object> profileData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String userId = oauth2User.getName();
                
                logger.info("Updating profile for user: {}", userId);
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));
                
                // Update user fields if provided
                if (profileData.containsKey("name")) {
                    user.setName((String) profileData.get("name"));
                }
                if (profileData.containsKey("email")) {
                    user.setEmail((String) profileData.get("email"));
                }
                if (profileData.containsKey("following")) {
                    user.setFollowing((List<String>) profileData.get("following"));
                }
                if (profileData.containsKey("bio")) {
                    user.setBio((String) profileData.get("bio"));
                }
                if (profileData.containsKey("specialties")) {
                    user.setSpecialties((List<String>) profileData.get("specialties"));
                }
                if (profileData.containsKey("favoriteRecipes")) {
                    user.setFavoriteRecipes((List<String>) profileData.get("favoriteRecipes"));
                }
                if (profileData.containsKey("isPrivate")) {
                    user.setPrivate((Boolean) profileData.get("isPrivate"));
                }
                
                User updatedUser = userRepository.save(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("id", updatedUser.getId());
                response.put("name", updatedUser.getName());
                response.put("email", updatedUser.getEmail());
                response.put("role", updatedUser.getRole());
                response.put("following", updatedUser.getFollowing());
                response.put("bio", updatedUser.getBio());
                response.put("specialties", updatedUser.getSpecialties());
                response.put("favoriteRecipes", updatedUser.getFavoriteRecipes());
                response.put("isPrivate", updatedUser.isPrivate());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
        } catch (Exception e) {
            logger.error("Error updating user profile", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update profile data"));
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file, @RequestParam("type") String type) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
            }

            // Get the file extension
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));

            // Generate a unique filename
            String filename = UUID.randomUUID().toString() + extension;

            // Create uploads directory if it doesn't exist
            String uploadDir = "uploads/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save the file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Get the current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String userId = oauth2User.getName();
                
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                // Update the user's profile picture or cover photo
                String fileUrl = "/uploads/" + filename;
                if ("profilePicture".equals(type)) {
                    user.setProfilePicture(fileUrl);
                } else if ("coverPhoto".equals(type)) {
                    user.setCoverPhoto(fileUrl);
                }

                userRepository.save(user);

                return ResponseEntity.ok(Map.of(
                    "url", fileUrl,
                    "message", "Image uploaded successfully"
                ));
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
        } catch (Exception e) {
            logger.error("Error uploading image", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> followUser(@PathVariable String userId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                if (currentUserId.equals(userId)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Cannot follow yourself"));
                }
                
                User currentUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("Current user not found"));
                
                User targetUser = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Target user not found"));
                
                List<String> following = currentUser.getFollowing();
                if (following == null) {
                    following = new ArrayList<>();
                }
                
                if (!following.contains(userId)) {
                    following.add(userId);
                    currentUser.setFollowing(following);
                    currentUser.setFollowingCount(currentUser.getFollowingCount() + 1);
                    userRepository.save(currentUser);
                    
                    // Update target user's follower count
                    targetUser.setFollowerCount(targetUser.getFollowerCount() + 1);
                    userRepository.save(targetUser);
                    
                    // Create notification for the target user
                    Notification notification = new Notification();
                    notification.setUserId(userId);
                    notification.setSenderId(currentUserId);
                    notification.setSenderName(currentUser.getName());
                    notification.setMessage(currentUser.getName() + " started following you");
                    notification.setType(Notification.NotificationType.FOLLOW);
                    notification.setCreatedAt(LocalDateTime.now());
                    notification.setRead(false);
                    notificationRepository.save(notification);
                }
                
                return ResponseEntity.ok(Map.of("success", true));
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        } catch (Exception e) {
            logger.error("Error following user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to follow user"));
        }
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<?> unfollowUser(@PathVariable String userId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                User currentUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("Current user not found"));
                
                User targetUser = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Target user not found"));
                
                List<String> following = currentUser.getFollowing();
                if (following != null && following.contains(userId)) {
                    following.remove(userId);
                    currentUser.setFollowing(following);
                    currentUser.setFollowingCount(currentUser.getFollowingCount() - 1);
                    userRepository.save(currentUser);
                    
                    // Update target user's follower count
                    targetUser.setFollowerCount(targetUser.getFollowerCount() - 1);
                    userRepository.save(targetUser);
                }
                
                return ResponseEntity.ok(Map.of("success", true));
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        } catch (Exception e) {
            logger.error("Error unfollowing user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to unfollow user"));
        }
    }

    @GetMapping("/{userId}/follow-status")
    public ResponseEntity<?> getFollowStatus(@PathVariable String userId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String currentUserId = oauth2User.getName();
                
                User currentUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("Current user not found"));
                
                boolean isFollowing = currentUser.getFollowing() != null && 
                                    currentUser.getFollowing().contains(userId);
                
                return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        } catch (Exception e) {
            logger.error("Error checking follow status", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to check follow status"));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            final String currentUserId = authentication != null && authentication.getPrincipal() instanceof OAuth2User
                ? ((OAuth2User) authentication.getPrincipal()).getName()
                : null;

            // Get all users and filter by name (case-insensitive)
            List<User> allUsers = userRepository.findAll();
            List<Map<String, Object>> searchResults = allUsers.stream()
                .filter(user -> user.getName().toLowerCase().contains(query.toLowerCase()))
                .map(user -> {
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId());
                    userData.put("name", user.getName());
                    userData.put("profilePicture", user.getProfilePicture());
                    userData.put("bio", user.getBio());
                    userData.put("isPrivate", user.isPrivate());
                    userData.put("followerCount", user.getFollowerCount());
                    userData.put("followingCount", user.getFollowingCount());

                    // Check if current user is following this user
                    boolean isFollowing = false;
                    if (currentUserId != null) {
                        User currentUser = userRepository.findById(currentUserId).orElse(null);
                        if (currentUser != null && currentUser.getFollowing() != null) {
                            isFollowing = currentUser.getFollowing().contains(user.getId());
                        }
                    }
                    userData.put("isFollowing", isFollowing);

                    return userData;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(searchResults);
        } catch (Exception e) {
            logger.error("Error searching users", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to search users"));
        }
    }
} 