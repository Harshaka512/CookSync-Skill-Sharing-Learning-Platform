import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const [userId, setUserId] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    const fetchFollowersAndFollowing = async () => {
      try {
        const followersRes = await axios.get(`/api/users/${userId}/followers`);
        const followingRes = await axios.get(`/api/users/${userId}/following`);
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
      } catch (error) {
        console.error('Error fetching followers/following:', error);
      }
    };

    if (userId) {
      fetchFollowersAndFollowing();
    }
  }, [userId]);

  return (
    <div>
      {/* Existing JSX code */}
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => setShowFollowers(!showFollowers)}
          className="text-gray-600 hover:text-gray-900"
        >
          <span className="font-semibold">{followers.length}</span> Followers
        </button>
        <button 
          onClick={() => setShowFollowing(!showFollowing)}
          className="text-gray-600 hover:text-gray-900"
        >
          <span className="font-semibold">{following.length}</span> Following
        </button>
      </div>

      {showFollowers && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Followers</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {followers.map(follower => (
              <div key={follower._id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow">
                <img 
                  src={follower.profilePicture || '/default-avatar.png'} 
                  alt={follower.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium">{follower.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showFollowing && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Following</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {following.map(followed => (
              <div key={followed._id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow">
                <img 
                  src={followed.profilePicture || '/default-avatar.png'} 
                  alt={followed.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium">{followed.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 