import api from './api';

export const postService = {
    createPost: async (postData) => {
        const formData = new FormData();
        Object.keys(postData).forEach(key => {
            if ((key === 'image' || key === 'video') && postData[key]) {
                formData.append(key, postData[key]);
            } else {
                formData.append(key, postData[key]);
            }
        });
        const response = await api.post('/api/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getAllPosts: async (page = 0, size = 10) => {
        const response = await api.get(`/api/posts?page=${page}&size=${size}`);
        return response.data;
    },

    getPostById: async (id) => {
        const response = await api.get(`/api/posts/${id}`);
        return response.data;
    },

    updatePost: async (id, postData) => {
        const formData = new FormData();
        Object.keys(postData).forEach(key => {
            if ((key === 'image' || key === 'video') && postData[key]) {
                formData.append(key, postData[key]);
            } else {
                formData.append(key, postData[key]);
            }
        });
        const response = await api.put(`/api/posts/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deletePost: async (id) => {
        await api.delete(`/api/posts/${id}`);
    },

    getUserPosts: async (userId, page = 0, size = 10) => {
        const response = await api.get(`/api/posts/user/${userId}?page=${page}&size=${size}`);
        return response.data;
    },
}; 