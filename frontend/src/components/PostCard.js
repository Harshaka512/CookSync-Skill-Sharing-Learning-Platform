import React, { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './PostCard.css';

const PostCard = ({ post, onDelete, isAuthor }) => {
    const [showVideo, setShowVideo] = useState(false);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const toggleVideo = () => {
        setShowVideo(!showVideo);
    };

    return (
        <Card className="post-card mb-4">
            {post.videoUrl ? (
                <div className="video-container">
                    {showVideo ? (
                        <video
                            className="post-media"
                            controls
                            src={post.videoUrl}
                            poster={post.videoThumbnailUrl}
                        />
                    ) : (
                        <div 
                            className="video-thumbnail"
                            onClick={toggleVideo}
                            style={{ backgroundImage: `url(${post.videoThumbnailUrl || post.imageUrl})` }}
                        >
                            <div className="play-button">
                                <i className="bi bi-play-circle-fill"></i>
                            </div>
                        </div>
                    )}
                </div>
            ) : post.imageUrl && (
                <Card.Img 
                    variant="top" 
                    src={post.imageUrl} 
                    className="post-media"
                    alt={post.title}
                />
            )}
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <Card.Title>{post.title}</Card.Title>
                    <Badge bg="info">{post.difficultyLevel}</Badge>
                </div>
                <Card.Text className="text-muted">
                    <small>
                        By {post.author.username} on {formatDate(post.createdAt)}
                    </small>
                </Card.Text>
                <Card.Text className="cooking-info">
                    <i className="bi bi-clock"></i> {post.cookingTime} minutes
                </Card.Text>
                <Card.Text className="ingredients-preview">
                    <strong>Ingredients:</strong> {post.ingredients.split(',').slice(0, 3).join(', ')}
                    {post.ingredients.split(',').length > 3 && '...'}
                </Card.Text>
                <Card.Text className="content-preview">
                    {post.content.substring(0, 150)}...
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                    <Link to={`/posts/${post.id}`} className="btn btn-primary">
                        View Recipe
                    </Link>
                    {isAuthor && (
                        <div>
                            <Link to={`/posts/edit/${post.id}`} className="btn btn-outline-secondary me-2">
                                Edit
                            </Link>
                            <Button variant="outline-danger" onClick={() => onDelete(post.id)}>
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default PostCard; 