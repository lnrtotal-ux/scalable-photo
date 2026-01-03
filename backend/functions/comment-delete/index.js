const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');

async function handler(request, context) {
    try {
        const commentId = request.params?.id;
        const auth = authenticate(request);

        if (!auth.isAuthenticated) {
            return { status: 401, jsonBody: { error: auth.error || 'Authentication required' } };
        }

        const commentResult = await query(
            'SELECT UserId, PhotoId FROM Comments WHERE CommentId = @commentId',
            { commentId }
        );

        if (commentResult.recordset.length === 0) {
            return { status: 404, jsonBody: { error: 'Comment not found' } };
        }

        const comment = commentResult.recordset[0];

        if (comment.UserId !== auth.user.userId && auth.user.role !== 'admin') {
            return { status: 403, jsonBody: { error: 'You can only delete your own comments' } };
        }

        await query('DELETE FROM Comments WHERE CommentId = @commentId', { commentId });
        await query('UPDATE Photos SET CommentsCount = CommentsCount - 1 WHERE PhotoId = @photoId', { photoId: comment.PhotoId });

        return { status: 200, jsonBody: { message: 'Comment deleted successfully' } };

    } catch (error) {
        context.error('Delete comment error:', error);
        return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
}

module.exports = { handler };
