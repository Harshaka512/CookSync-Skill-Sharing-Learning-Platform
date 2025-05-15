import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import LockIcon from '@mui/icons-material/Lock';
import { formatDistanceToNow } from 'date-fns';

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${userId}/profile`);
      setProfile(response.data);
      setFollowerCount(response.data.followerCount || 0);
      setFollowingCount(response.data.followingCount || 0);
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/posts/user/${userId}`);
      if (response.data.message) {
        setPosts([]);
        setError(response.data.message);
      } else {
        setPosts(response.data.posts || []);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const checkFollowStatus = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${userId}/follow-status`);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [userId, user]);

  const handleFollow = async () => {
    try {
      await axios.post(`/api/users/${userId}/follow`);
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      // Refresh posts after following
      fetchUserPosts();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.delete(`/api/users/${userId}/follow`);
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handlePrivacyChange = async (event) => {
    try {
      await axios.put('/api/users/profile', {
        isPrivate: event.target.checked
      });
      setProfile(prev => ({ ...prev, isPrivate: event.target.checked }));
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUserProfile(),
        fetchUserPosts(),
        checkFollowStatus()
      ]);
    };
    loadData();
  }, [fetchUserProfile, fetchUserPosts, checkFollowStatus]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">User not found.</Alert>
      </Container>
    );
  }

  const isOwnProfile = user && user.id === userId;
  const canViewPosts = !profile.isPrivate || isFollowing || isOwnProfile;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={profile.profilePicture}
              alt={profile.name}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {profile.name}
            </Typography>
            {profile.isPrivate && !isFollowing && !isOwnProfile && (
              <Chip
                icon={<LockIcon />}
                label="Private Profile"
                color="default"
                sx={{ mb: 2 }}
              />
            )}
            {isOwnProfile && (
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.isPrivate}
                    onChange={handlePrivacyChange}
                    color="primary"
                  />
                }
                label="Private Account"
                sx={{ mb: 2 }}
              />
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {profile.bio || "No bio available"}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Typography variant="subtitle2">Posts</Typography>
                <Typography variant="h6">{posts.length}</Typography>
              </Grid>
              <Grid item>
                <Typography variant="subtitle2">Followers</Typography>
                <Typography variant="h6">{followerCount}</Typography>
              </Grid>
              <Grid item>
                <Typography variant="subtitle2">Following</Typography>
                <Typography variant="h6">{followingCount}</Typography>
              </Grid>
            </Grid>
            {!isOwnProfile && (
              <Button
                variant="contained"
                color={isFollowing ? "error" : "primary"}
                startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                onClick={isFollowing ? handleUnfollow : handleFollow}
                sx={{ mt: 2 }}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Posts Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Posts
          </Typography>
          {error ? (
            <Paper elevation={3} sx={{ p: 5, textAlign: 'center', bgcolor: '#f9f9f9' }}>
              <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {error}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Follow this account to see their posts and cooking inspiration
              </Typography>
              {!isOwnProfile && !isFollowing && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PersonAddIcon />}
                  onClick={handleFollow}
                  sx={{ mt: 2 }}
                >
                  Follow {profile.name}
                </Button>
              )}
            </Paper>
          ) : posts.length === 0 ? (
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No posts yet.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {posts.map((post) => (
                  <Grid item xs={12} key={post.id}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={post.mediaUrls[0]}
                          alt={post.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {post.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {post.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfile; 