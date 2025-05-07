import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import api from '../services/api';
import { postService } from '../services/postService';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import './CommunityPage.css';

const CommunityPage = () => {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current user data
                const userResponse = await api.get('/api/users/me');
                setCurrentUser(userResponse.data);

                // Fetch all users
                const usersResponse = await api.get('/api/users');
                setUsers(usersResponse.data);

                // Fetch all posts
                const postsResponse = await postService.getAllPosts();
                setPosts(postsResponse.content || []);
            } catch (err) {
                setError('Failed to load community data');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleFollow = async (userId) => {
        try {
            await api.post(`/api/users/${userId}/follow`);
            setUsers(users.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        followers: [...(user.followers || []), currentUser.id]
                    };
                }
                return user;
            }));
        } catch (err) {
            console.error('Failed to follow user:', err);
        }
    };

    const handleUnfollow = async (userId) => {
        try {
            await api.delete(`/api/users/${userId}/follow`);
            setUsers(users.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        followers: user.followers.filter(id => id !== currentUser.id)
                    };
                }
                return user;
            }));
        } catch (err) {
            console.error('Failed to unfollow user:', err);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId);
            setPosts(posts.filter(post => post.id !== postId));
        } catch (err) {
            console.error('Failed to delete post:', err);
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.ingredients.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="loading">Loading community data...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <Container className="community-page py-4">
            <div className="community-header mb-4">
                <h1>Cooking Community</h1>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'posts' ? 'recipes' : 'users'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="posts" title="Recipes">
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {filteredPosts.map(post => (
                            <Col key={post.id}>
                                <PostCard
                                    post={post}
                                    onDelete={handleDeletePost}
                                    isAuthor={currentUser && post.author.id === currentUser.id}
                                />
                            </Col>
                        ))}
                    </Row>
                </Tab>
                <Tab eventKey="users" title="Users">
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {filteredUsers.map(user => (
                            <Col key={user.id}>
                                <UserCard
                                    user={user}
                                    currentUser={currentUser}
                                    onFollow={handleFollow}
                                    onUnfollow={handleUnfollow}
                                />
                            </Col>
                        ))}
                    </Row>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default CommunityPage; 