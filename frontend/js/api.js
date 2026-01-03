// API client for PhotoShare
import API_CONFIG from './config.js';
import auth from './auth.js';

class APIClient {
    constructor() {
        this.baseUrl = API_CONFIG.baseUrl;
    }

    // Helper to make authenticated requests
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = {
            ...options.headers
        };

        // Add authentication token if available
        const token = auth.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add Content-Type for JSON requests
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle 401 - unauthorized
            if (response.status === 401) {
                auth.clearAuth();
                window.location.href = '/login.html';
                throw new Error('Session expired. Please login again.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async register(username, email, password, role = 'consumer') {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role })
        });
    }

    // Photo endpoints
    async getPhotos(page = 1, limit = 20, search = '', userId = null) {
        let endpoint = `/photos?page=${page}&limit=${limit}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
        if (userId) endpoint += `&userId=${userId}`;
        
        return this.request(endpoint);
    }

    async getPhoto(photoId) {
        return this.request(`/photos/${photoId}`);
    }

    async createPhoto(formData) {
        return this.request('/photos', {
            method: 'POST',
            body: formData
        });
    }

    async updatePhoto(photoId, updates) {
        return this.request(`/photos/${photoId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deletePhoto(photoId) {
        return this.request(`/photos/${photoId}`, {
            method: 'DELETE'
        });
    }

    // Like endpoint
    async toggleLike(photoId) {
        return this.request(`/photos/${photoId}/like`, {
            method: 'POST'
        });
    }

    // Comment endpoints
    async addComment(photoId, commentText) {
        return this.request(`/photos/${photoId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ commentText })
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE'
        });
    }
}

// Create global instance
const api = new APIClient();

export default api;
