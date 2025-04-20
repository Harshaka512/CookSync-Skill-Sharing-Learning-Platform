package com.skillsync.cooking_edition.service;

import com.skillsync.cooking_edition.model.*;
import com.skillsync.cooking_edition.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InteractionService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public void toggleLike(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Like existingLike = likeRepository.findByPostIdAndUserId(postId, userId);
        if (existingLike != null) {
            likeRepository.delete(existingLike);
            post.setLikes(post.getLikes() - 1);
        } else {
            Like like = new Like();
            like.setPostId(postId);
            like.setUserId(userId);
            likeRepository.save(like);
            post.setLikes(post.getLikes() + 1);

            // Create notification for post owner
            if (!post.getUserId().equals(userId)) { // Don't notify if user liked their own post
                Notification notification = new Notification();
                notification.setUserId(post.getUserId());
                notification.setSenderId(userId);
                notification.setSenderName(user.getName());
                notification.setMessage(user.getName() + " liked your post");
                notification.setType(Notification.NotificationType.LIKE);
                notification.setRelatedPostId(postId);
                notification.setCreatedAt(LocalDateTime.now());
                notification.setRead(false);
                notificationRepository.save(notification);
            }
        }

        postRepository.save(post);
    }

    public boolean isLiked(String postId, String userId) {
        return likeRepository.findByPostIdAndUserId(postId, userId) != null;
    }

    public Comment addComment(String postId, String userId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setUserName(user.getName());
        comment.setContent(content);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        Comment savedComment = commentRepository.save(comment);

        // Update post comment count
        post.setComments(post.getComments() + 1);
        postRepository.save(post);

        // Create notification
        Notification notification = new Notification();
        notification.setUserId(post.getUserId());
        notification.setSenderId(userId);
        notification.setSenderName(user.getName());
        notification.setMessage(user.getName() + " commented on your post");
        notification.setType(Notification.NotificationType.COMMENT);
        notification.setRelatedPostId(postId);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        notificationRepository.save(notification);

        return savedComment;
    }

    public List<Comment> getComments(String postId) {
        return commentRepository.findByPostId(postId);
    }

    public Comment getCommentById(String commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
    }

    public Comment updateComment(Comment comment) {
        return commentRepository.save(comment);
    }

    public void deleteComment(String commentId) {
        Comment comment = getCommentById(commentId);
        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Update post comment count
        post.setComments(post.getComments() - 1);
        postRepository.save(post);
        
        commentRepository.deleteById(commentId);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public void markNotificationAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
} 