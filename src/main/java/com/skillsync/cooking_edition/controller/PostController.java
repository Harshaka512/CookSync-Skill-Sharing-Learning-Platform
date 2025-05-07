package com.skillsync.cooking_edition.controller;

import com.skillsync.cooking_edition.model.Post;
import com.skillsync.cooking_edition.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    // Create a new post
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Post post, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            post.setAuthor(user);
            Post savedPost = postRepository.save(post);
            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating post: " + e.getMessage());
        }
    }

    // Get all posts with pagination
    @GetMapping
    public ResponseEntity<Page<Post>> getAllPosts(Pageable pageable) {
        try {
            Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(pageable);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get a single post by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        try {
            Optional<Post> post = postRepository.findById(id);
            return post.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error retrieving post: " + e.getMessage());
        }
    }

    // Update a post
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody Post postDetails, Authentication authentication) {
        try {
            String username = authentication.getName();
            Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

            if (!post.getAuthor().getUsername().equals(username)) {
                return ResponseEntity.status(403).body("Not authorized to update this post");
            }

            post.setTitle(postDetails.getTitle());
            post.setContent(postDetails.getContent());
            post.setIngredients(postDetails.getIngredients());
            post.setCookingTime(postDetails.getCookingTime());
            post.setDifficultyLevel(postDetails.getDifficultyLevel());
            post.setImageUrl(postDetails.getImageUrl());

            Post updatedPost = postRepository.save(post);
            return ResponseEntity.ok(updatedPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating post: " + e.getMessage());
        }
    }

    // Delete a post
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication.getName();
            Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

            if (!post.getAuthor().getUsername().equals(username)) {
                return ResponseEntity.status(403).body("Not authorized to delete this post");
            }

            postRepository.delete(post);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting post: " + e.getMessage());
        }
    }

    // Get posts by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<Post>> getPostsByUser(@PathVariable Long userId, Pageable pageable) {
        try {
            Page<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 