// ==========================================
// BLOGSPHERE AI - REST API CLIENT
// ==========================================

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:5000/api' 
    : '/api';

class APIClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    getToken() {
        return localStorage.getItem('blogsphere_token');
    }

    setAuth(token, user) {
        if (token) localStorage.setItem('blogsphere_token', token);
        if (user) localStorage.setItem('blogsphere_user', JSON.stringify(user));
    }

    clearAuth() {
        localStorage.removeItem('blogsphere_token');
        localStorage.removeItem('blogsphere_user');
    }

    getCurrentUser() {
        const raw = localStorage.getItem('blogsphere_user');
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    isLoggedIn() {
        return !!this.getToken();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                    // Token expired or invalid
                    this.clearAuth();
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.warn(`API call failed for ${endpoint}:`, error.message);
            throw error;
        }
    }

    // Auth APIs
    async register(userData) {
        const res = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (res.success && res.data) {
            this.setAuth(res.data.token, res.data.user);
        }
        return res;
    }

    async login(credentials) {
        const res = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        if (res.success && res.data) {
            this.setAuth(res.data.token, res.data.user);
        }
        return res;
    }

    async getMe() {
        if (!this.getToken()) return null;
        try {
            const res = await this.request('/auth/me');
            if (res.success && res.data.user) {
                this.setAuth(null, res.data.user);
                return res.data.user;
            }
        } catch (e) {
            this.clearAuth();
        }
        return null;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (e) {}
        this.clearAuth();
    }

    // Posts APIs
    async getPosts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/posts${query ? '?' + query : ''}`);
    }

    async getPost(identifier) {
        return await this.request(`/posts/${identifier}`);
    }

    async createPost(postData) {
        return await this.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updatePost(id, postData) {
        return await this.request(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deletePost(id) {
        return await this.request(`/posts/${id}`, {
            method: 'DELETE'
        });
    }

    async getTrending(limit = 6) {
        return await this.request(`/posts/trending?limit=${limit}`);
    }

    async getRecommendations(limit = 6) {
        return await this.request(`/recommendations?limit=${limit}`);
    }

    // Engagement APIs
    async likePost(id) {
        return await this.request(`/posts/${id}/like`, { method: 'POST' });
    }

    async unlikePost(id) {
        return await this.request(`/posts/${id}/like`, { method: 'DELETE' });
    }

    async bookmarkPost(id) {
        return await this.request(`/posts/${id}/bookmark`, { method: 'POST' });
    }

    async unbookmarkPost(id) {
        return await this.request(`/posts/${id}/bookmark`, { method: 'DELETE' });
    }

    async getBookmarks() {
        return await this.request('/bookmarks');
    }

    async getComments(postId) {
        return await this.request(`/posts/${postId}/comments`);
    }

    async addComment(postId, content, parentId = null) {
        return await this.request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parent_id: parentId })
        });
    }

    async deleteComment(commentId) {
        return await this.request(`/comments/${commentId}`, { method: 'DELETE' });
    }

    async reportPost(postId, reason, description = '') {
        return await this.request(`/posts/${postId}/report`, {
            method: 'POST',
            body: JSON.stringify({ reason, description })
        });
    }

    // AI Assistant APIs
    async aiGenerateSummary(content, maxSentences = 3) {
        return await this.request('/ai/generate-summary', {
            method: 'POST',
            body: JSON.stringify({ content, max_sentences: maxSentences })
        });
    }

    async aiGenerateTags(title, content) {
        return await this.request('/ai/generate-tags', {
            method: 'POST',
            body: JSON.stringify({ title, content })
        });
    }

    async aiImproveContent(content) {
        return await this.request('/ai/improve-content', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    async aiGenerateTitle(content) {
        return await this.request('/ai/generate-title', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    async aiCalculateReadingTime(content) {
        return await this.request('/ai/reading-time', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    // Search APIs
    async search(query) {
        return await this.request(`/search?q=${encodeURIComponent(query)}`);
    }

    // Categories & Tags APIs
    async getCategories() {
        return await this.request('/categories');
    }

    async getTags() {
        return await this.request('/tags');
    }

    // Analytics Dashboard
    async getDashboardAnalytics() {
        return await this.request('/analytics/dashboard');
    }

    // User Profile & Follows
    async getUserProfile(identifier) {
        return await this.request(`/users/${identifier}`);
    }

    async updateUserProfile(userId, data) {
        return await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getUserPosts(identifier, page = 1) {
        return await this.request(`/users/${identifier}/posts?page=${page}`);
    }

    async followUser(userId) {
        return await this.request(`/users/${userId}/follow`, { method: 'POST' });
    }

    async unfollowUser(userId) {
        return await this.request(`/users/${userId}/follow`, { method: 'DELETE' });
    }

    // Admin APIs
    async getAdminStats() {
        return await this.request('/admin/stats');
    }

    async getAdminUsers(page = 1, search = '') {
        return await this.request(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
    }

    async updateUserStatus(userId, statusData) {
        return await this.request(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
        });
    }

    async getAdminPosts(page = 1, search = '') {
        return await this.request(`/admin/posts?page=${page}&search=${encodeURIComponent(search)}`);
    }

    async deleteAdminPost(postId) {
        return await this.request(`/admin/posts/${postId}`, { method: 'DELETE' });
    }

    async getAdminReports(status = '') {
        return await this.request(`/admin/reports${status ? '?status=' + status : ''}`);
    }

    async updateAdminReport(reportId, status) {
        return await this.request(`/admin/reports/${reportId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
}

const api = new APIClient();
