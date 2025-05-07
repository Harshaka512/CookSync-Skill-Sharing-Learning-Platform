import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080', // Adjust the port according to your backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to handle auth tokens
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api; 