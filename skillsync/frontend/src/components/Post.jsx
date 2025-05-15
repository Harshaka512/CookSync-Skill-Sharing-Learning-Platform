import React from 'react';
import { Link } from 'react-router-dom';
import PostInteraction from './PostInteraction';
import '../styles/Post.css';

const Post = ({ post, onUpdate }) => {
  // Get a formatted timestamp for debugging
  const timestamp = Date.now();
  const hasUserPicture = Boolean(post.userPicture);

  return (
    <div className="post" id={`post-${post.id}`}>
      <div className="post-header">
        <Link to={`/users/${post.userId}`} className="post-author">
          <img 
            src={post.userPicture ? `${post.userPicture}?t=${timestamp}` : '/default-avatar.svg'} 
            alt={post.userName} 
            className="author-avatar" 
            data-has-picture={hasUserPicture.toString()}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.svg';
              console.log('Image load error for', post.userName, 'falling back to default');
            }}
          />
          <span className="author-name">{post.userName}</span>
        </Link>
        <span className="post-time">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-description">{post.description}</p>
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <img src={post.mediaUrls[0]} alt={post.title} className="post-image" />
        ) : post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="post-image" />
        )}
      </div>

      <PostInteraction post={post} onUpdate={onUpdate} />
    </div>
  );
};

export default Post; 