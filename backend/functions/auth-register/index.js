const { app } = require('@azure/functions');
const { query } = require('../utils/db');
const { hashPassword, generateToken } = require('../utils/auth');

app.http('auth-register', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/register',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { username, email, password, role = 'consumer' } = body;

            // Validate input
            if (!username || !email || !password) {
                return {
                    status: 400,
                    jsonBody: {
                        error: 'Username, email, and password are required'
                    }
                };
            }

            // Validate role
            if (!['consumer', 'creator'].includes(role)) {
                return {
                    status: 400,
                    jsonBody: {
                        error: 'Invalid role. Must be consumer or creator'
                    }
                };
            }

            // Check if username or email already exists
            const existingUser = await query(
                'SELECT UserId FROM Users WHERE Username = @username OR Email = @email',
                { username, email }
            );

            if (existingUser.recordset.length > 0) {
                return {
                    status: 409,
                    jsonBody: {
                        error: 'Username or email already exists'
                    }
                };
            }

            // Hash password
            const passwordHash = await hashPassword(password);

            // Create user
            const result = await query(
                `INSERT INTO Users (Username, Email, PasswordHash, Role) 
                 OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.Role, INSERTED.CreatedAt
                 VALUES (@username, @email, @passwordHash, @role)`,
                { username, email, passwordHash, role }
            );

            const newUser = result.recordset[0];

            // Generate token
            const token = generateToken(newUser);

            return {
                status: 201,
                jsonBody: {
                    token,
                    user: {
                        userId: newUser.UserId,
                        username: newUser.Username,
                        email: newUser.Email,
                        role: newUser.Role,
                        createdAt: newUser.CreatedAt
                    }
                }
            };

        } catch (error) {
            context.error('Registration error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
