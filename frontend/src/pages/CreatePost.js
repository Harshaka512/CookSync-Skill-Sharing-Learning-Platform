import React, { useState } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import './CreatePost.css';

const CreatePost = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        ingredients: '',
        cookingTime: '',
        difficultyLevel: 'EASY',
        image: null,
        video: null
    });
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file,
                video: null // Clear video if image is selected
            }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                video: file,
                image: null // Clear image if video is selected
            }));
            // Create a thumbnail from the video
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                setPreview(canvas.toDataURL());
            };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await postService.createPost(formData);
            navigate('/');
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Card className="create-post-card">
                <Card.Body>
                    <h2 className="text-center mb-4">Create New Recipe</h2>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter recipe title"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Ingredients</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="ingredients"
                                value={formData.ingredients}
                                onChange={handleChange}
                                required
                                placeholder="Enter ingredients (comma separated)"
                                rows={3}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Instructions</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                required
                                placeholder="Enter cooking instructions"
                                rows={5}
                            />
                        </Form.Group>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Cooking Time (minutes)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="cookingTime"
                                        value={formData.cookingTime}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Difficulty Level</Form.Label>
                                    <Form.Select
                                        name="difficultyLevel"
                                        value={formData.difficultyLevel}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="EASY">Easy</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HARD">Hard</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Recipe Image</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={formData.video !== null}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Recipe Video</Form.Label>
                            <Form.Control
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                disabled={formData.image !== null}
                            />
                            <Form.Text className="text-muted">
                                You can upload either an image or a video, not both.
                            </Form.Text>
                        </Form.Group>

                        {preview && (
                            <div className="preview-container mb-4">
                                {formData.video ? (
                                    <video
                                        src={preview}
                                        controls
                                        className="preview-media"
                                    />
                                ) : (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="preview-media"
                                    />
                                )}
                            </div>
                        )}

                        <div className="d-grid gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Recipe'}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={() => navigate('/')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CreatePost; 