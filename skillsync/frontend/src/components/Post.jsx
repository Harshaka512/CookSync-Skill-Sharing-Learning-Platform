import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PostInteraction from './PostInteraction';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Post.css';

const Post = ({ post, onUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user && user.id === post.userId;

  const handleEdit = () => {
    navigate(`/posts/${post.id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await fetch(`/api/posts/${post.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  return (
    <div className="post" id={`post-${post.id}`}>
      <div className="post-header">
        <Link to={`/profile/${post.userId}`} className="post-author">
          <img src={post.userPicture ? `${post.userPicture}?t=${Date.now()}` : undefined} alt={post.userName} className="author-avatar" />
          <span className="author-name">{post.userName}</span>
        </Link>
        <div className="post-actions">
          <span className="post-time">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
          {isOwner && (
            <div className="owner-actions">
              <button onClick={handleEdit} className="edit-button" title="Edit post">
                <span className="material-icons">edit</span>
              </button>
              <button onClick={handleDelete} className="delete-button" title="Delete post">
                <span className="material-icons">delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-description">{post.description}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="post-image" />
        )}
      </div>

      <PostInteraction post={post} onUpdate={onUpdate} />
    </div>
  );
};

export default Post; 