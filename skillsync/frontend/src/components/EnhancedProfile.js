import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaCamera, FaEdit, FaUserFriends, FaImages, FaThumbsUp } from 'react-icons/fa';

const EnhancedProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`/api/posts/user/${userId}`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchProfile();
    fetchPosts();
  }, [userId]);

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('coverPhoto', file);
      try {
        await axios.put(`/api/users/${userId}/cover-photo`, formData);
        setCoverPhoto(URL.createObjectURL(file));
      } catch (error) {
        console.error('Error updating cover photo:', error);
      }
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);
      try {
        await axios.put(`/api/users/${userId}/profile-picture`, formData);
        setProfilePicture(URL.createObjectURL(file));
      } catch (error) {
        console.error('Error updating profile picture:', error);
      }
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cover Photo Section */}
      <div className="relative h-96 bg-gray-300">
        {profile.coverPhoto ? (
          <img
            src={profile.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
        
        {/* Cover Photo Upload Button */}
        <label className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100">
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoChange}
            className="hidden"
          />
          <FaCamera className="text-gray-600" />
        </label>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <img
              src={profile.profilePicture || '/default-avatar.png'}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              <FaCamera className="text-gray-600" />
            </label>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-gray-600">{profile.bio || 'No bio yet'}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <FaEdit className="inline mr-2" />
              Edit Profile
            </button>
          </div>

          {/* Stats Section */}
          <div className="flex space-x-8 border-t border-b py-4 my-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{posts.length}</div>
              <div className="text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.followers?.length || 0}</div>
              <div className="text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.following?.length || 0}</div>
              <div className="text-gray-600">Following</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 ${activeTab === 'posts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              <FaImages className="inline mr-2" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`pb-2 ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              <FaUserFriends className="inline mr-2" />
              Friends
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`pb-2 ${activeTab === 'likes' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              <FaThumbsUp className="inline mr-2" />
              Likes
            </button>
          </div>

          {/* Content Section */}
          <div className="mt-6">
            {activeTab === 'posts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                  <div key={post._id} className="bg-white rounded-lg shadow overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <p className="text-gray-800">{post.caption}</p>
                      <div className="flex items-center mt-2 text-gray-600">
                        <FaThumbsUp className="mr-1" />
                        <span>{post.likes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfile; 