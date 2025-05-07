import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';

const UserProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [userResponse, followStatusResponse] = await Promise.all([
                    api.get(`/api/users/${id}/profile`),
                    api.get(`/api/users/${id}/follow-status`)
                ]);
                
                setUser(userResponse.data);
                setIsFollowing(followStatusResponse.data.isFollowing);
                setPosts(userResponse.data.posts || []);
            } catch (err) {
                setError('Failed to load user profile');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    const handleFollow = async () => {
        try {
            await api.post(`/api/users/${id}/follow`);
            setIsFollowing(true);
            // Update user's followers count
            setUser(prev => ({
                ...prev,
                followers: [...(prev.followers || []), 'current-user-id'] // You'll need to get the actual current user ID
            }));
        } catch (err) {
            console.error('Failed to follow user:', err);
        }
    };

    const handleUnfollow = async () => {
        try {
            await api.delete(`/api/users/${id}/follow`);
            setIsFollowing(false);
            // Update user's followers count
            setUser(prev => ({
                ...prev,
                followers: prev.followers.filter(id => id !== 'current-user-id') // You'll need to get the actual current user ID
            }));
        } catch (err) {
            console.error('Failed to unfollow user:', err);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!user) return <div>User not found</div>;

    return (
        <div className="user-profile">
            <div className="profile-header">
                <img src={user.profilePicture} alt={user.username} className="profile-picture" />
                <div className="profile-info">
                    <h1>{user.username}</h1>
                    <p>{user.bio}</p>
                    <div className="follow-stats">
                        <span>{posts.length} posts</span>
                        <span>{user.followers?.length || 0} followers</span>
                        <span>{user.following?.length || 0} following</span>
                    </div>
                    {user.id !== 'current-user-id' && ( // You'll need to get the actual current user ID
                        <button
                            onClick={isFollowing ? handleUnfollow : handleFollow}
                            className={`follow-button ${isFollowing ? 'following' : ''}`}
                        >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>
            <div className="posts-grid">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
};

export default UserProfile; 