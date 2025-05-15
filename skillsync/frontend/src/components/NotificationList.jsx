import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Avatar,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import ReplyIcon from '@mui/icons-material/Reply';
import './NotificationList.css';
import { toast } from 'react-hot-toast';

const NotificationList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(true);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (user && user.id) {
      setUnreadCount(0); // Reset count on mount
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      // Set up polling for new notifications after initial fetch
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, notifications.length]); // Only restart polling if notifications change

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications for user:', user.id, 'email:', user.email);
      
      // First verify the user object
      if (!user || !user.id) {
        console.error('User object is invalid:', user);
        setUnreadCount(0); // Reset count if user is invalid
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
          setUnreadCount(0); // Reset count if response is invalid
          return;
        }

        // Filter out invalid notifications
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
        
        // Update unread count only if there are valid unread notifications
        const unreadCount = validNotifications.filter(n => !n.read).length;
        setUnreadCount(unreadCount > 0 ? unreadCount : 0);
        console.log('Unread notifications count:', unreadCount);
        
        setRetryCount(0); // Reset retry count on success
      } catch (mainError) {
        console.error('Error with main endpoint for', user.email, ':', mainError);
        setUnreadCount(0); // Reset count on error
        
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
            
            // Update unread count only if there are valid unread notifications
            const unreadCount = validNotifications.filter(n => !n.read).length;
            setUnreadCount(unreadCount > 0 ? unreadCount : 0);
            console.log('Unread notifications count:', unreadCount);
            
            setRetryCount(0);
            return;
          }
        } catch (fallbackError) {
          console.error('Error with fallback endpoint for', user.email, ':', fallbackError);
          setUnreadCount(0); // Reset count if both endpoints fail
          throw mainError; // Throw the original error if both endpoints fail
        }
      }
    } catch (error) {
      console.error('Error fetching notifications for', user.email, ':', error);
      setUnreadCount(0); // Reset count on any error
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

      // Only retry for 500 errors and if we haven't exceeded max retries
      if (error.response?.status === 500 && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Retry after 5 seconds
        setTimeout(fetchNotifications, 5000);
      } else {
        setRetryCount(0); // Reset retry count
      }
    }
  };

  const handleClick = (event) => {
    // Navigate to notifications page instead of showing menu
    navigate('/notifications');
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      await axios.put(`/api/notifications/${notification.id}/read`);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Handle navigation based on notification type
      if (notification.type === 'LIKE' || notification.type === 'COMMENT' || notification.type === 'REPLY') {
        // Close the notification menu
        setShowNotifications(false);
        
        // Navigate to the post with the comment ID if it's a reply
        if (notification.type === 'REPLY' && notification.relatedCommentId) {
          // Navigate to the post with both postId and commentId
          navigate(`/posts/${notification.relatedPostId}?commentId=${notification.relatedCommentId}&type=reply`);
        } else if (notification.type === 'COMMENT') {
          // For regular comments, just navigate to the post
          navigate(`/posts/${notification.relatedPostId}?type=comment`);
        } else {
          // For likes, just navigate to the post
          navigate(`/posts/${notification.relatedPostId}`);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
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
      
      // Update notifications and unread count immediately
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.map(n => ({ ...n, read: true }));
        setUnreadCount(0);
        return updatedNotifications;
      });

      // Fetch notifications after a short delay to ensure everything is in sync
      setTimeout(fetchNotifications, 500);
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
    if (!notification.senderName) {
      return 'Someone interacted with your post';
    }

    switch (notification.type) {
      case 'LIKE':
        return `${notification.senderName} liked your post`;
      case 'COMMENT':
        return `${notification.senderName} commented on your post`;
      case 'REPLY':
        return `${notification.senderName} replied to your comment`;
      default:
        return notification.message || 'New notification';
    }
  };

  if (!user || !user.id) {
    return null;
  }

  return (
    <div className="notification-container">
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="show notifications"
        sx={{ color: 'white' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </div>
  );
};

export default NotificationList; 