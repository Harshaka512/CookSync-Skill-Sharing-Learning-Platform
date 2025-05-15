package com.skillsync.cooking_edition.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.skillsync.cooking_edition.model.Post;
import com.skillsync.cooking_edition.model.User;
import com.skillsync.cooking_edition.repository.PostRepository;
import com.skillsync.cooking_edition.repository.UserRepository;
import javax.media.Manager;
import javax.media.MediaLocator;
import javax.media.Player;
import javax.media.Time;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private static final Logger logger = LoggerFactory.getLogger(PostController.class);

    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${upload.path:uploads}")
    private String uploadPath;

    private static final int MAX_IMAGES = 3;
    private static final double MAX_VIDEO_DURATION_SECONDS = 300.0; // 5 minutes

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(@PathVariable String userId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            final String currentUserId = authentication != null && authentication.getPrincipal() instanceof OAuth2User
                ? ((OAuth2User) authentication.getPrincipal()).getName()
                : null;

            // Get the target user
            User targetUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if the profile is private 
            if (targetUser.isPrivate()) {
                // Allow if user is viewing their own profile
                if (currentUserId != null && currentUserId.equals(userId)) {
                    // Continue to show user their own posts
                } 
                // Check if current user follows the target user
                else if (currentUserId != null) {
                    User currentUser = userRepository.findById(currentUserId)
                            .orElseThrow(() -> new RuntimeException("Current user not found"));
                    
                    // If current user doesn't follow the target user, return empty list with message
                    if (currentUser.getFollowing() == null || !currentUser.getFollowing().contains(userId)) {
                        return ResponseEntity.ok(Map.of(
                            "posts", new ArrayList<>(),
                            "message", "This profile is private"
                        ));
                    }
                } 
                // If no current user or not following, return empty list with message
                else {
                    return ResponseEntity.ok(Map.of(
                        "posts", new ArrayList<>(),
                        "message", "This profile is private"
                    ));
                }
            }

            // Get user's posts and sort by creation date in descending order
            List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            
            // Ensure all posts have userPicture set
            for (Post post : posts) {
                if (post.getUserPicture() == null) {
                    post.setUserPicture(targetUser.getProfilePicture());
                    postRepository.save(post);
                }
            }
            
            return ResponseEntity.ok(Map.of("posts", posts));
        } catch (Exception e) {
            logger.error("Error fetching user posts", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch user posts"));
        }
    }

    @GetMapping
    public ResponseEntity<List<Post>> listPosts() {
        try {
            logger.info("Attempting to fetch all posts from database");
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            final String currentUserId = authentication != null && authentication.getPrincipal() instanceof OAuth2User
                ? ((OAuth2User) authentication.getPrincipal()).getName()
                : null;
            
            // Get all posts
            List<Post> allPosts = postRepository.findAll();
            
            // Filter posts based on privacy settings
            List<Post> visiblePosts = allPosts.stream()
                .filter(post -> {
                    User postUser = userRepository.findById(post.getUserId())
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    
                    // Show post if:
                    // 1. User's profile is public
                    // 2. Current user is the post owner
                    // 3. Current user is following the post owner
                    return !postUser.isPrivate() || 
                           (currentUserId != null && currentUserId.equals(post.getUserId())) ||
                           (currentUserId != null && postUser.getFollowing().contains(currentUserId));
                })
                .collect(Collectors.toList());
            
            // Ensure all posts have userPicture set
            for (Post post : visiblePosts) {
                if (post.getUserPicture() == null && post.getUserId() != null) {
                    try {
                        User postUser = userRepository.findById(post.getUserId()).orElse(null);
                        if (postUser != null && postUser.getProfilePicture() != null) {
                            post.setUserPicture(postUser.getProfilePicture());
                            postRepository.save(post);
                        }
                    } catch (Exception e) {
                        logger.warn("Could not set profile picture for post {}: {}", post.getId(), e.getMessage());
                    }
                }
            }
            
            logger.info("Successfully fetched {} visible posts from database", visiblePosts.size());
            return ResponseEntity.ok(visiblePosts);
        } catch (Exception e) {
            logger.error("Error fetching posts from database: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Post>> getTrendingPosts() {
        try {
            logger.info("Fetching trending posts");
            
            // Get all posts and sort by engagement (likes + comments)
            List<Post> allPosts = postRepository.findAll();
            List<Post> trendingPosts = allPosts.stream()
                .sorted((a, b) -> {
                    int aEngagement = (a.getLikes() != null ? a.getLikes() : 0) + 
                                    (a.getComments() != null ? a.getComments() : 0);
                    int bEngagement = (b.getLikes() != null ? b.getLikes() : 0) + 
                                    (b.getComments() != null ? b.getComments() : 0);
                    return bEngagement - aEngagement;
                })
                .limit(5) // Get top 5 trending posts
                .collect(Collectors.toList());
            
            logger.info("Found {} trending posts", trendingPosts.size());
            return ResponseEntity.ok(trendingPosts);
        } catch (Exception e) {
            logger.error("Error fetching trending posts: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Post>> myPosts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            String userId = oauth2User.getName();
            logger.info("Fetching posts for user: {}", userId);
            
            // Get the current user
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser == null) {
                logger.warn("User not found: {}", userId);
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            
            // Ensure all posts have userPicture set
            for (Post post : posts) {
                if (post.getUserPicture() == null) {
                    post.setUserPicture(currentUser.getProfilePicture());
                    postRepository.save(post);
                }
            }
            
            logger.info("Found {} posts for user {}", posts.size(), userId);
            return ResponseEntity.ok(posts);
        }
        logger.warn("User not authenticated when fetching my posts");
        return ResponseEntity.ok(new ArrayList<>());
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String content,
            @RequestPart(required = false) List<MultipartFile> media,
            @RequestParam(required = false) String mediaType,
            @RequestParam(required = false) String[] ingredients,
            @RequestParam(required = false) String[] amounts,
            @RequestParam(required = false) String[] instructions,
            @RequestParam(required = false) Integer cookingTime,
            @RequestParam(required = false) Integer servings) {
        
        logger.info("Creating new post with title: {}", title);
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User)) {
            logger.warn("User not authenticated when creating post");
            return ResponseEntity.status(401).body("User not authenticated");
        }

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String userId = oauth2User.getName();
        logger.info("Creating post for user: {}", userId);
        
        List<String> mediaUrls = new ArrayList<>();
        
        // Handle file uploads if present
        if (media != null && !media.isEmpty()) {
            logger.info("Processing {} media files", media.size());
            // Validate number of images
            if (mediaType != null && mediaType.equals("image") && media.size() > MAX_IMAGES) {
                logger.warn("Too many images uploaded: {}", media.size());
                return ResponseEntity.badRequest().body("Maximum " + MAX_IMAGES + " images allowed");
            }

            try {
                // Create upload directory if it doesn't exist
                Path uploadDir = Paths.get(uploadPath);
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }
                
                for (MultipartFile file : media) {
                    // Generate a unique filename
                    String originalFilename = file.getOriginalFilename();
                    String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String filename = UUID.randomUUID().toString() + extension;
                    
                    // Save the file
                    Path filePath = uploadDir.resolve(filename);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    
                    // Add the media URL to the list
                    mediaUrls.add("/uploads/" + filename);
                }
                
                // Set media type based on file type if not provided
                if (mediaType == null || mediaType.isEmpty()) {
                    String firstFileType = media.get(0).getContentType();
                    if (firstFileType != null && firstFileType.startsWith("image/")) {
                        mediaType = "image";
                    } else if (firstFileType != null && firstFileType.startsWith("video/")) {
                        mediaType = "video";
                        if (!validateVideoDuration(media.get(0))) {
                            return ResponseEntity.badRequest().body("Video duration exceeds " + MAX_VIDEO_DURATION_SECONDS + " seconds");
                        }
                    }
                    logger.info("Detected media type: {}", mediaType);
                }
            } catch (IOException e) {
                logger.error("Failed to upload media", e);
                return ResponseEntity.status(500).body("Failed to upload media: " + e.getMessage());
            }
        }
        
        try {
            Post post = new Post();
            post.setTitle(title);
            post.setDescription(description);
            post.setContent(content != null ? content : "");
            post.setMediaUrls(mediaUrls);
            post.setMediaType(mediaType);
            post.setIngredients(ingredients != null ? Arrays.asList(ingredients) : null);
            post.setAmounts(amounts != null ? Arrays.asList(amounts) : null);
            post.setInstructions(instructions != null ? Arrays.asList(instructions) : null);
            post.setCookingTime(cookingTime);
            post.setServings(servings);
            post.setUserId(userId);
            post.setUserName(oauth2User.getAttribute("name"));
            
            // Get the user's profile picture and set it in the post
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            post.setUserPicture(currentUser.getProfilePicture());
            
            post.setCreatedAt(LocalDateTime.now());
            post.setUpdatedAt(LocalDateTime.now());
            post.setLikes(0);
            post.setComments(0);
            
            Post savedPost = postRepository.save(post);
            logger.info("Successfully created post with ID: {}", savedPost.getId());
            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            logger.error("Error saving post: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to save post: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> viewPost(@PathVariable String id) {
        return postRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable String id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String content,
            @RequestPart(required = false) List<MultipartFile> media,
            @RequestParam(required = false) String mediaType,
            @RequestParam(required = false) String[] ingredients,
            @RequestParam(required = false) String[] amounts,
            @RequestParam(required = false) String[] instructions,
            @RequestParam(required = false) Integer cookingTime,
            @RequestParam(required = false) Integer servings) {
        
        logger.info("Updating post with ID: {}", id);
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User)) {
            logger.warn("User not authenticated when updating post");
            return ResponseEntity.status(401).body("User not authenticated");
        }

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String userId = oauth2User.getName();
        
        // Check if post exists
        Post existingPost = postRepository.findById(id).orElse(null);
        if (existingPost == null) {
            logger.warn("Post not found with ID: {}", id);
            return ResponseEntity.status(404).body("Post not found");
        }
        
        // Check if user is authorized to update this post
        if (!existingPost.getUserId().equals(userId)) {
            logger.warn("User {} not authorized to update post {}", userId, id);
            return ResponseEntity.status(403).body("Not authorized to update this post");
        }
        
        List<String> mediaUrls = new ArrayList<>();
        
        // Handle file uploads if present
        if (media != null && !media.isEmpty()) {
            // Validate number of images
            if (mediaType != null && mediaType.equals("image") && media.size() > MAX_IMAGES) {
                logger.warn("Too many images uploaded: {}", media.size());
                return ResponseEntity.badRequest().body("Maximum " + MAX_IMAGES + " images allowed");
            }

            try {
                // Create upload directory if it doesn't exist
                Path uploadDir = Paths.get(uploadPath);
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }
                
                for (MultipartFile file : media) {
                    // Generate a unique filename
                    String originalFilename = file.getOriginalFilename();
                    String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String filename = UUID.randomUUID().toString() + extension;
                    
                    // Save the file
                    Path filePath = uploadDir.resolve(filename);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    
                    // Add the media URL to the list
                    mediaUrls.add("/uploads/" + filename);
                }
                
                // Set media type based on file type if not provided
                if (mediaType == null || mediaType.isEmpty()) {
                    String firstFileType = media.get(0).getContentType();
                    if (firstFileType != null && firstFileType.startsWith("image/")) {
                        mediaType = "image";
                    } else if (firstFileType != null && firstFileType.startsWith("video/")) {
                        mediaType = "video";
                        if (!validateVideoDuration(media.get(0))) {
                            return ResponseEntity.badRequest().body("Video duration exceeds " + MAX_VIDEO_DURATION_SECONDS + " seconds");
                        }
                    }
                    logger.info("Detected media type: {}", mediaType);
                }
            } catch (IOException e) {
                logger.error("Failed to upload media", e);
                return ResponseEntity.status(500).body("Failed to upload media: " + e.getMessage());
            }
        } else {
            // No new media provided, keep existing media
            mediaUrls = existingPost.getMediaUrls();
            mediaType = existingPost.getMediaType();
        }
        
        try {
            existingPost.setTitle(title);
            existingPost.setDescription(description);
            existingPost.setContent(content != null ? content : existingPost.getContent());
            existingPost.setMediaUrls(mediaUrls);
            existingPost.setMediaType(mediaType);
            existingPost.setIngredients(ingredients != null ? Arrays.asList(ingredients) : existingPost.getIngredients());
            existingPost.setAmounts(amounts != null ? Arrays.asList(amounts) : existingPost.getAmounts());
            existingPost.setInstructions(instructions != null ? Arrays.asList(instructions) : existingPost.getInstructions());
            existingPost.setCookingTime(cookingTime != null ? cookingTime : existingPost.getCookingTime());
            existingPost.setServings(servings != null ? servings : existingPost.getServings());
            
            // Ensure we preserve the userPicture
            if (existingPost.getUserPicture() == null) {
                User currentUser = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                existingPost.setUserPicture(currentUser.getProfilePicture());
            }
            
            existingPost.setUpdatedAt(LocalDateTime.now());
            
            Post updatedPost = postRepository.save(existingPost);
            logger.info("Successfully updated post with ID: {}", updatedPost.getId());
            return ResponseEntity.ok(updatedPost);
        } catch (Exception e) {
            logger.error("Error updating post: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to update post: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id) {
        return postRepository.findById(id)
                .map(post -> {
                    postRepository.delete(post);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "API connection successful");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/update-profile-pictures")
    public ResponseEntity<?> updatePostProfilePictures() {
        try {
            logger.info("Updating post profile pictures");
            
            List<Post> posts = postRepository.findAll();
            int updatedCount = 0;
            
            for (Post post : posts) {
                if (post.getUserPicture() == null && post.getUserId() != null) {
                    try {
                        User user = userRepository.findById(post.getUserId()).orElse(null);
                        if (user != null && user.getProfilePicture() != null) {
                            post.setUserPicture(user.getProfilePicture());
                            postRepository.save(post);
                            updatedCount++;
                        }
                    } catch (Exception e) {
                        logger.warn("Could not update profile picture for post {}: {}", post.getId(), e.getMessage());
                    }
                }
            }
            
            logger.info("Updated profile pictures for {} posts", updatedCount);
            return ResponseEntity.ok(Map.of(
                "message", "Updated profile pictures for posts",
                "updatedCount", updatedCount
            ));
        } catch (Exception e) {
            logger.error("Error updating post profile pictures: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update post profile pictures"));
        }
    }

    @GetMapping("/following")
    public ResponseEntity<?> getFollowingPosts() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String userId = oauth2User.getName();
                
                User currentUser = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                List<String> following = currentUser.getFollowing();
                
                if (following == null || following.isEmpty()) {
                    return ResponseEntity.ok(new ArrayList<>());
                }
                
                // Get all posts from followed users
                List<Post> followingPosts = new ArrayList<>();
                for (String followedUserId : following) {
                    // Check if user exists
                    Optional<User> followedUserOptional = userRepository.findById(followedUserId);
                    if (followedUserOptional.isPresent()) {
                        User followedUser = followedUserOptional.get();
                        
                        // Only get posts from users who are not private or users that the current user follows
                        if (!followedUser.isPrivate() || following.contains(followedUser.getId())) {
                            List<Post> userPosts = postRepository.findByUserId(followedUserId);
                            
                            // Ensure all posts have userPicture set
                            for (Post post : userPosts) {
                                if (post.getUserPicture() == null) {
                                    post.setUserPicture(followedUser.getProfilePicture());
                                    postRepository.save(post);
                                }
                            }
                            
                            followingPosts.addAll(userPosts);
                        }
                    }
                }
                
                // Sort by creation date in descending order
                Collections.sort(followingPosts, (a, b) -> 
                    b.getCreatedAt().compareTo(a.getCreatedAt())
                );
                
                return ResponseEntity.ok(followingPosts);
            }
            return ResponseEntity.status(401).body(new ArrayList<>());
        } catch (Exception e) {
            logger.error("Error fetching following posts", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch following posts"));
        }
    }

    private boolean validateVideoDuration(MultipartFile file) {
        try {
            // Save the file temporarily
            Path tempFile = Files.createTempFile("video", ".mp4");
            Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
            
            // Create a media locator
            MediaLocator ml = new MediaLocator(tempFile.toUri().toURL());
            
            // Create a player
            Player player = Manager.createRealizedPlayer(ml);
            
            // Get the duration
            Time duration = player.getDuration();
            double durationInSeconds = duration.getSeconds();
            
            // Clean up
            player.close();
            Files.delete(tempFile);
            
            return durationInSeconds <= MAX_VIDEO_DURATION_SECONDS;
        } catch (Exception e) {
            logger.error("Error validating video duration", e);
            return false;
        }
    }
} 