const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');

async function handler(request, context) {
    try {
        const photoId = request.params?.id;
        const auth = authenticate(request);

        if (!auth.isAuthenticated) {
            return { status: 401, jsonBody: { error: auth.error || 'Authentication required' } };
        }

        const photoCheck = await query(
            'SELECT PhotoId FROM Photos WHERE PhotoId = @photoId',
            { photoId }
        );

        if (photoCheck.recordset.length === 0) {
            return { status: 404, jsonBody: { error: 'Photo not found' } };
        }

        const existingLike = await query(
            'SELECT LikeId FROM Likes WHERE PhotoId = @photoId AND UserId = @userId',
            { photoId, userId: auth.user.userId }
        );

        let liked = true;

        if (existingLike.recordset.length > 0) {
            await query('DELETE FROM Likes WHERE PhotoId = @photoId AND UserId = @userId', { photoId, userId: auth.user.userId });
            await query('UPDATE Photos SET LikesCount = LikesCount - 1 WHERE PhotoId = @photoId', { photoId });
            liked = false;
        } else {
            await query('INSERT INTO Likes (PhotoId, UserId) VALUES (@photoId, @userId)', { photoId, userId: auth.user.userId });
            await query('UPDATE Photos SET LikesCount = LikesCount + 1 WHERE PhotoId = @photoId', { photoId });
        }

        const updatedPhoto = await query('SELECT LikesCount FROM Photos WHERE PhotoId = @photoId', { photoId });

        return { status: 200, jsonBody: { liked, likesCount: updatedPhoto.recordset[0].LikesCount } };

    } catch (error) {
        context.error('Like photo error:', error);
        return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
}

module.exports = { handler };
