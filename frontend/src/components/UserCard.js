import React from 'react';
import { Link } from 'react-router-dom';
import './UserCard.css';

const UserCard = ({ user, currentUser, onFollow, onUnfollow }) => {
    const isFollowing = currentUser && user.followers?.includes(currentUser.id);
    const isCurrentUser = currentUser && user.id === currentUser.id;

    return (
        <div className="user-card">
            <Link to={`/users/${user.id}`} className="user-card-link">
                <img 
                    src={user.profilePicture || '/default-profile.png'} 
                    alt={user.username} 
                    className="user-card-avatar"
                />
                <div className="user-card-info">
                    <h3>{user.username}</h3>
                    <p className="user-bio">{user.bio || 'No bio yet'}</p>
                    <div className="user-stats">
                        <span>{user.posts?.length || 0} posts</span>
                        <span>{user.followers?.length || 0} followers</span>
                        <span>{user.following?.length || 0} following</span>
                    </div>
                </div>
            </Link>
            {!isCurrentUser && currentUser && (
                <button
                    className={`follow-button ${isFollowing ? 'following' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        isFollowing ? onUnfollow(user.id) : onFollow(user.id);
                    }}
                >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
            )}
        </div>
    );
};

export default UserCard; 