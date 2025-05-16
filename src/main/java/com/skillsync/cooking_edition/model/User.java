

import java.util.List;

public class User {
    private List<String> following;
    private List<String> followers;
    private String role; // "USER" or "ADMIN"
    private boolean isPrivate;

    // Getters and Setters
    public List<String> getFollowing() {
        return following;
    }

    public void setFollowing(List<String> following) {
        this.following = following;
    }

    public List<String> getFollowers() {
        return followers;
    }

    public void setFollowers(List<String> followers) {
        this.followers = followers;
    }

    public String getRole() {
        return role;
    }
} 