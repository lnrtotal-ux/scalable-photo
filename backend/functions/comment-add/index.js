const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');

async function handler(request, context) {
    try {
        const photoId = request.params?.id;
        const auth = authenticate(request);

        if (!auth.isAuthenticated) {
            return { status: 401, jsonBody: { error: auth.error || 'Authentication required' } };
        }

        const body = request.body || (request.json ? await request.json() : {});
        const { commentText } = body;

        if (!commentText || commentText.trim().length === 0) {
            return { status: 400, jsonBody: { error: 'Comment text is required' } };
        }
        if (commentText.length > 500) {
            return { status: 400, jsonBody: { error: 'Comment must be 500 characters or less' } };
        }

        const photoCheck = await query('SELECT PhotoId FROM Photos WHERE PhotoId = @photoId', { photoId });
        if (photoCheck.recordset.length === 0) {
            return { status: 404, jsonBody: { error: 'Photo not found' } };
        }

        const result = await query(
            `INSERT INTO Comments (PhotoId, UserId, CommentText) 
             OUTPUT INSERTED.CommentId, INSERTED.PhotoId, INSERTED.UserId, INSERTED.CommentText, INSERTED.CreatedAt
             VALUES (@photoId, @userId, @commentText)`,
            { photoId, userId: auth.user.userId, commentText: commentText.trim() }
        );

        await query('UPDATE Photos SET CommentsCount = CommentsCount + 1 WHERE PhotoId = @photoId', { photoId });

        const newComment = result.recordset[0];
        return { status: 201, jsonBody: { ...newComment, username: auth.user.username } };

    } catch (error) {
        context.error('Add comment error:', error);
        return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
}

module.exports = { handler };
