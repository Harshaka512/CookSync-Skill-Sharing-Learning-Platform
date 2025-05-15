package com.skillsync.cooking_edition.repository;

import com.skillsync.cooking_edition.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserId(String userId);
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findByUserIdInOrderByCreatedAtDesc(List<String> userIds);
    List<Post> findByUserIdOrderByCreatedAtDesc(String userId);
} 