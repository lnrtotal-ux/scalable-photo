// Authentication utilities
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = '24h';

/**
 * Hash a password
 */
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateToken(user) {
    const payload = {
        userId: user.UserId,
        username: user.Username,
        email: user.Email,
        role: user.Role
    };
    
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
function extractToken(request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    if (!authHeader) {
        return null;
    }
    
    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
}

/**
 * Middleware to validate authentication
 */
function authenticate(request) {
    const token = extractToken(request);
    
    if (!token) {
        return {
            isAuthenticated: false,
            error: 'No token provided'
        };
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return {
            isAuthenticated: false,
            error: 'Invalid or expired token'
        };
    }
    
    return {
        isAuthenticated: true,
        user: decoded
    };
}

/**
 * Check if user has required role
 */
function hasRole(user, requiredRole) {
    const roleHierarchy = {
        'consumer': 1,
        'creator': 2,
        'admin': 3
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    extractToken,
    authenticate,
    hasRole
};
