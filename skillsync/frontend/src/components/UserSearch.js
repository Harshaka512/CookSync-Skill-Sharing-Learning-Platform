import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LockIcon from '@mui/icons-material/Lock';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useAuth } from '../contexts/AuthContext';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleFollow = async (userId) => {
    try {
      await axios.post(`/api/users/${userId}/follow`);
      setSearchResults(results =>
        results.map(result =>
          result.id === userId
            ? { ...result, isFollowing: true }
            : result
        )
      );
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await axios.delete(`/api/users/${userId}/follow`);
      setSearchResults(results =>
        results.map(result =>
          result.id === userId
            ? { ...result, isFollowing: false }
            : result
        )
      );
    } catch (err) {
      console.error('Error unfollowing user:', err);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && searchResults.length > 0 && (
        <Paper elevation={2}>
          <List>
            {searchResults.map((result) => (
              <ListItem
                key={result.id}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemAvatar onClick={() => handleUserClick(result.id)}>
                  <Avatar src={result.profilePicture} alt={result.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        component="span"
                        onClick={() => handleUserClick(result.id)}
                      >
                        {result.name}
                      </Typography>
                      {result.isPrivate && (
                        <Chip
                          icon={<LockIcon />}
                          label="Private"
                          size="small"
                          color="default"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {result.bio || 'No bio available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.followerCount} followers
                      </Typography>
                    </Box>
                  }
                />
                {user && user.id !== result.id && (
                  <Button
                    variant={result.isFollowing ? "outlined" : "contained"}
                    color={result.isFollowing ? "error" : "primary"}
                    startIcon={result.isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                    onClick={() => result.isFollowing ? handleUnfollow(result.id) : handleFollow(result.id)}
                    size="small"
                  >
                    {result.isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {!loading && searchQuery && searchResults.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', my: 2 }}>
          No users found matching "{searchQuery}"
        </Typography>
      )}
    </Box>
  );
};

export default UserSearch; 