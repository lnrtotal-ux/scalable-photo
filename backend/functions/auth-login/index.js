const { query } = require('../utils/db');
const { comparePassword, generateToken } = require('../utils/auth');

async function handler(request, context) {
    try {
        const body = request.body || (request.json ? await request.json() : {});
        const { username, password } = body;

        if (!username || !password) {
            return {
                status: 400,
                jsonBody: { error: 'Username and password are required' }
            };
        }

        const result = await query(
            'SELECT UserId, Username, Email, PasswordHash, Role, CreatedAt FROM Users WHERE Username = @username',
            { username }
        );

        if (result.recordset.length === 0) {
            return {
                status: 401,
                jsonBody: { error: 'Invalid username or password' }
            };
        }

        const user = result.recordset[0];
        const isValid = await comparePassword(password, user.PasswordHash);

        if (!isValid) {
            return {
                status: 401,
                jsonBody: { error: 'Invalid username or password' }
            };
        }

        const token = generateToken(user);

        return {
            status: 200,
            jsonBody: {
                token,
                user: {
                    userId: user.UserId,
                    username: user.Username,
                    email: user.Email,
                    role: user.Role,
                    createdAt: user.CreatedAt
                }
            }
        };

    } catch (error) {
        context.error('Login error:', error);
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

module.exports = { handler };
