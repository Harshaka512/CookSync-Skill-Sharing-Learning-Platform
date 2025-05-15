import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Reply as ReplyIcon,
  Search as SearchIcon,
  DoneAll as DoneAllIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Filter notifications based on search query and valid messages
    const filtered = notifications.filter(notification => {
      const message = getNotificationMessage(notification);
      if (!message) return false; // Skip notifications with no message
      
      const searchLower = searchQuery.toLowerCase();
      return (
        notification.senderName?.toLowerCase().includes(searchLower) ||
        message.toLowerCase().includes(searchLower) ||
        notification.type.toLowerCase().includes(searchLower)
      );
    });
    setFilteredNotifications(filtered);
  }, [searchQuery, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching notifications for user:', user.id, 'email:', user.email);
      
      // First verify the user object
      if (!user || !user.id) {
        console.error('User object is invalid:', user);
        setError('User information is missing. Please log in again.');
        return;
      }

      // Try the main endpoint first
      try {
        console.log('Trying main endpoint for user:', user.email);
        const response = await axios.get(`/api/notifications`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Notifications response for', user.email, ':', response.data);
        
        if (!Array.isArray(response.data)) {
          console.error('Invalid response format for', user.email, ':', response.data);
          setError('Received invalid data format from server');
          return;
        }

        // Filter out notifications without required fields
        const validNotifications = response.data.filter(notification => {
          const isValid = notification && 
            notification.id && 
            notification.type && 
            notification.senderName;
          
          if (!isValid) {
            console.warn('Invalid notification found for', user.email, ':', notification);
          }
          return isValid;
        });

        console.log('Valid notifications count for', user.email, ':', validNotifications.length);
        setNotifications(validNotifications);
        setFilteredNotifications(validNotifications);
        setRetryCount(0); // Reset retry count on success
        
        if (validNotifications.length === 0) {
          console.log('No notifications found for user:', user.email);
        } else {
          console.log('Received notifications for', user.email, ':', validNotifications.length);
        }
      } catch (mainError) {
        console.error('Error with main endpoint for', user.email, ':', mainError);
        
        // Try the fallback endpoint
        try {
          console.log('Trying fallback endpoint for', user.email);
          const fallbackResponse = await axios.get(`/api/interactions/users/${user.id}/notifications`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${user.id}`,
              'Content-Type': 'application/json'
            }
          });

          if (Array.isArray(fallbackResponse.data)) {
            const validNotifications = fallbackResponse.data.filter(notification => {
              const isValid = notification && 
                notification.id && 
                notification.type && 
                notification.senderName;
              
              if (!isValid) {
                console.warn('Invalid notification in fallback for', user.email, ':', notification);
              }
              return isValid;
            });
            console.log('Fallback notifications count for', user.email, ':', validNotifications.length);
            setNotifications(validNotifications);
            setFilteredNotifications(validNotifications);
            setRetryCount(0);
            return;
          }
        } catch (fallbackError) {
          console.error('Error with fallback endpoint for', user.email, ':', fallbackError);
          throw mainError; // Throw the original error if both endpoints fail
        }
      }
    } catch (error) {
      console.error('Error fetching notifications for', user.email, ':', error);
      console.error('Error details:', {
        user: {
          id: user.id,
          email: user.email
        },
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      if (error.response?.status === 404) {
        setError('User not found. Please log in again.');
      } else if (error.response?.status === 500) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setError(`Server error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          // Retry after 5 seconds
          setTimeout(fetchNotifications, 5000);
        } else {
          setError('Unable to load notifications. Please try again later.');
          setRetryCount(0); // Reset retry count
        }
      } else {
        setError(error.response?.data?.message || 'Failed to fetch notifications. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await axios.put(`/api/notifications/${notification.id}/read`, null, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });

      // Navigate based on notification type
      if (notification.type === 'LIKE') {
        navigate(`/community?postId=${notification.relatedPostId}&type=like`);
      } else if (notification.type === 'COMMENT') {
        navigate(`/community?postId=${notification.relatedPostId}&type=comment&commentId=${notification.relatedCommentId}`);
      } else if (notification.type === 'REPLY') {
        navigate(`/community?postId=${notification.relatedPostId}&type=reply&commentId=${notification.relatedCommentId}`);
      }

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', null, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return <FavoriteIcon color="error" />;
      case 'COMMENT':
        return <CommentIcon color="primary" />;
      case 'REPLY':
        return <ReplyIcon color="secondary" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationMessage = (notification) => {
    // Skip notifications without sender name
    if (!notification.senderName) {
      return null;
    }

    switch (notification.type) {
      case 'LIKE':
        return `${notification.senderName} liked your post`;
      case 'COMMENT':
        return `${notification.senderName} commented on your post`;
      case 'REPLY':
        return `${notification.senderName} replied to your comment`;
      default:
        return null; // Skip unknown notification types
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Notifications
          </Typography>
          <Button
            variant="contained"
            startIcon={<DoneAllIcon />}
            onClick={markAllAsRead}
            sx={{ textTransform: 'none' }}
          >
            Mark all as read
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No notifications found
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'inherit' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.main' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {getNotificationMessage(notification)}
                        </Typography>
                        {!notification.read && (
                          <Chip
                            label="New"
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage; 