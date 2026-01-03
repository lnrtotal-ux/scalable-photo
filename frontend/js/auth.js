// Authentication manager
class AuthManager {
    constructor() {
        this.TOKEN_KEY = 'photoshare_token';
        this.USER_KEY = 'photoshare_user';
    }

    // Get stored token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Get stored user
    getUser() {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    // Save authentication data
    saveAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }

    // Check if user is creator
    isCreator() {
        const user = this.getUser();
        return user && (user.role === 'creator' || user.role === 'admin');
    }

    // Logout
    logout() {
        this.clearAuth();
        window.location.href = '/login.html';
    }

    // Require authentication
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    // Require creator role
    requireCreator() {
        if (!this.requireAuth()) return false;
        
        if (!this.isCreator()) {
            alert('You must be a creator to access this page');
            window.location.href = '/index.html';
            return false;
        }
        return true;
    }
}

// Create global instance
const auth = new AuthManager();

export default auth;
