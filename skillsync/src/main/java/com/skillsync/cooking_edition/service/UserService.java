package com.skillsync.cooking_edition.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.skillsync.cooking_edition.model.User;
import com.skillsync.cooking_edition.repository.UserRepository;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public String uploadImage(String userId, MultipartFile file, String type) throws IOException {
        User user = getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        String uploadDir = "uploads/";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/uploads/" + filename;
        if ("profile".equals(type)) {
            user.setProfilePicture(fileUrl);
        } else if ("cover".equals(type)) {
            user.setCoverPhoto(fileUrl);
        }

        userRepository.save(user);
        return fileUrl;
    }
} 