import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

const MyProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    profilePicture: '',
    coverPhoto: '',
    specialties: [],
    favoriteRecipes: [],
    isPrivate: false
  });
  const [editDialog, setEditDialog] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newFavoriteRecipe, setNewFavoriteRecipe] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/profile', { withCredentials: true });
      if (response.data) {
        // Add cache-busting parameter to image URLs
        const timestamp = new Date().getTime();
        const profileData = {
          ...response.data,
          profilePicture: response.data.profilePicture ? `${response.data.profilePicture}?t=${timestamp}` : '',
          coverPhoto: response.data.coverPhoto ? `${response.data.coverPhoto}?t=${timestamp}` : ''
        };
        setProfileData(profileData);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchUserProfile();
    fetchUserPosts();
    fetchFollowers();
    fetchFollowing();
  }, [user, navigate, fetchUserProfile]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/posts/my', { withCredentials: true });
      setPosts(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setError('Failed to load your posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await axios.get('/api/users/followers');
      setFollowers(response.data);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await axios.get('/api/users/following');
      setFollowing(response.data);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleEditPost = (postId) => {
    navigate(`/posts/${postId}/edit`);
  };

  const handleViewPost = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handleEditProfile = () => {
    setEditDialog(true);
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put('/api/users/profile', profileData, { withCredentials: true });
      setEditDialog(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again later.');
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty && !profileData.specialties.includes(newSpecialty)) {
      setProfileData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
      setNewSpecialty('');
    }
  };

  const handleAddFavoriteRecipe = () => {
    if (newFavoriteRecipe && !profileData.favoriteRecipes.includes(newFavoriteRecipe)) {
      setProfileData(prev => ({
        ...prev,
        favoriteRecipes: [...prev.favoriteRecipes, newFavoriteRecipe]
      }));
      setNewFavoriteRecipe('');
    }
  };

  const handleRemoveSpecialty = (specialty) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleRemoveFavoriteRecipe = (recipe) => {
    setProfileData(prev => ({
      ...prev,
      favoriteRecipes: prev.favoriteRecipes.filter(r => r !== recipe)
    }));
  };

  const handlePrivacyChange = (event) => {
    setProfileData(prev => ({
      ...prev,
      isPrivate: event.target.checked
    }));
  };

  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await axios.post('/api/users/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });

      if (response.data && response.data.url) {
        // Add cache-busting parameter to the new image URL
        const timestamp = new Date().getTime();
        const imageUrl = `${response.data.url}?t=${timestamp}`;
        
        // Update the profile data with the new image URL
        setProfileData(prev => ({
          ...prev,
          [type]: imageUrl
        }));

        // Update the profile in the database
        await axios.put('/api/users/profile', {
          ...profileData,
          [type]: response.data.url
        }, { withCredentials: true });

        // Show success message
        setError(null);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.response?.data?.error || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Cover Photo Section */}
      <Box sx={{ position: 'relative', height: '300px', width: '100%', mb: 2 }}>
        <Box
          sx={{
            height: '100%',
            width: '100%',
            backgroundImage: `url(${profileData.coverPhoto ? `${profileData.coverPhoto}?t=${Date.now()}` : 'https://source.unsplash.com/random/1200x300/?cooking,food'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            p: 2,
          }}
        >
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="cover-photo-upload"
            type="file"
            onChange={(e) => handleImageUpload(e, 'coverPhoto')}
          />
          <label htmlFor="cover-photo-upload" style={{ cursor: 'pointer' }}>
            <Tooltip title="Change Cover Photo">
              <IconButton
                component="span"
                disabled={uploadingImage}
                sx={{
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.100' },
                  boxShadow: 2,
                  cursor: 'pointer'
                }}
              >
                {uploadingImage ? <CircularProgress size={24} /> : <PhotoCamera />}
              </IconButton>
            </Tooltip>
          </label>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', mt: -8 }}>
        <Grid container spacing={4}>
          {/* Profile Section */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center', 
                borderRadius: 2,
                position: 'relative',
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block', mt: -8 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-picture-upload"
                        type="file"
                        onChange={(e) => handleImageUpload(e, 'profilePicture')}
                      />
                      <label htmlFor="profile-picture-upload">
                        <Tooltip title="Change Profile Picture">
                          <IconButton
                            component="span"
                            disabled={uploadingImage}
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.dark' },
                              width: 32,
                              height: 32
                            }}
                          >
                            {uploadingImage ? <CircularProgress size={24} color="inherit" /> : <PhotoCamera fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </label>
                    </>
                  }
                >
                  <Avatar
                    src={profileData.profilePicture ? `${profileData.profilePicture}?t=${Date.now()}` : undefined}
                    alt={profileData.name}
                    sx={{ 
                      width: 180, 
                      height: 180, 
                      border: '4px solid white',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  />
                </Badge>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" gutterBottom sx={{ 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {profileData.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
              </Box>

              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  my: 2, 
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  {profileData.bio || "No bio available. Click edit to add one!"}
                </Typography>
              </Paper>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 3, 
                my: 3,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {posts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Posts</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {profileData.followerCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Followers</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {profileData.followingCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Following</Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditProfile}
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4
                }}
              >
                Edit Profile
              </Button>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'primary.main', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <AddPhotoAlternateIcon /> Specialties
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2
                }}>
                  {profileData.specialties.length > 0 ? (
                    profileData.specialties.map((specialty, index) => (
                      <Chip
                        key={index}
                        label={specialty}
                        color="primary"
                        sx={{
                          borderRadius: '16px',
                          '& .MuiChip-label': {
                            px: 2,
                          }
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specialties added yet
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'primary.main', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <AddPhotoAlternateIcon /> Favorite Recipes
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2
                }}>
                  {profileData.favoriteRecipes.length > 0 ? (
                    profileData.favoriteRecipes.map((recipe, index) => (
                      <Chip
                        key={index}
                        label={recipe}
                        color="secondary"
                        sx={{
                          borderRadius: '16px',
                          '& .MuiChip-label': {
                            px: 2,
                          }
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No favorite recipes added yet
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Posts Section */}
          <Grid item xs={12} md={8}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              bgcolor: 'white',
              p: 2,
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h4" sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}>
                My Posts
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/posts/create')}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4
                }}
              >
                Create New Post
              </Button>
            </Box>

            {posts.length === 0 ? (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 2,
                  bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share your cooking journey with the community!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {posts.map((post) => (
                  <Grid item xs={12} key={post.id}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)'
                      }
                    }}>
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        post.mediaType === 'image' ? (
                          <CardMedia
                            component="img"
                            height="200"
                            image={post.mediaUrls[0]}
                            alt={post.title}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : post.mediaType === 'video' ? (
                          <CardMedia
                            component="video"
                            height="200"
                            controls
                            sx={{ objectFit: 'cover' }}
                          >
                            <source src={post.mediaUrls[0]} type="video/mp4" />
                            Your browser does not support the video tag.
                          </CardMedia>
                        ) : null
                      )}
                      <CardContent>
                        <Typography variant="h5" component="div" gutterBottom sx={{ 
                          fontWeight: 'bold',
                          color: 'primary.main'
                        }}>
                          {post.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {post.description}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1, 
                          mb: 2 
                        }}>
                          {post.ingredients && post.ingredients.map((ingredient, index) => (
                            <Chip
                              key={index}
                              label={ingredient}
                              size="small"
                              sx={{ 
                                borderRadius: '12px',
                                bgcolor: 'primary.light',
                                color: 'white'
                              }}
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Posted on {new Date(post.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ 
                        justifyContent: 'flex-end', 
                        p: 2,
                        bgcolor: 'grey.50'
                      }}>
                        <Button
                          size="small"
                          onClick={() => handleViewPost(post.id)}
                          sx={{ 
                            borderRadius: 1,
                            textTransform: 'none'
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleEditPost(post.id)}
                          sx={{ 
                            borderRadius: 1,
                            textTransform: 'none'
                          }}
                        >
                          Edit
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2
        }}>
          Edit Profile
          <IconButton
            onClick={() => setEditDialog(false)}
            sx={{ color: 'white' }}
          >
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={3}
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Specialties
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add Specialty"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialty()}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSpecialty}
                  sx={{ minWidth: '100px' }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.specialties.map((specialty, index) => (
                  <Chip
                    key={index}
                    label={specialty}
                    onDelete={() => handleRemoveSpecialty(specialty)}
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Favorite Recipes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add Favorite Recipe"
                  value={newFavoriteRecipe}
                  onChange={(e) => setNewFavoriteRecipe(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFavoriteRecipe()}
                />
                <Button
                  variant="contained"
                  onClick={handleAddFavoriteRecipe}
                  sx={{ minWidth: '100px' }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.favoriteRecipes.map((recipe, index) => (
                  <Chip
                    key={index}
                    label={recipe}
                    onDelete={() => handleRemoveFavoriteRecipe(recipe)}
                    color="secondary"
                  />
                ))}
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={profileData.isPrivate}
                  onChange={handlePrivacyChange}
                  color="primary"
                />
              }
              label="Private Profile"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button
            onClick={() => setEditDialog(false)}
            startIcon={<CancelIcon />}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ 
              textTransform: 'none',
              px: 3
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyProfile; 