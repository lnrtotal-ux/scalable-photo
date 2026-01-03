const { app } = require('@azure/functions');
const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');

app.http('photo-like', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'photos/{id}/like',
    handler: async (request, context) => {
        try {
            const photoId = request.params.id;

            // Authenticate user
            const auth = authenticate(request);
            
            if (!auth.isAuthenticated) {
                return {
                    status: 401,
                    jsonBody: {
                        error: auth.error || 'Authentication required'
                    }
                };
            }

            // Check if photo exists
            const photoCheck = await query(
                'SELECT PhotoId FROM Photos WHERE PhotoId = @photoId',
                { photoId }
            );

            if (photoCheck.recordset.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        error: 'Photo not found'
                    }
                };
            }

            // Check if already liked
            const existingLike = await query(
                'SELECT LikeId FROM Likes WHERE PhotoId = @photoId AND UserId = @userId',
                { photoId, userId: auth.user.userId }
            );

            let liked = true;

            if (existingLike.recordset.length > 0) {
                // Unlike - remove like
                await query(
                    'DELETE FROM Likes WHERE PhotoId = @photoId AND UserId = @userId',
                    { photoId, userId: auth.user.userId }
                );

                // Decrement like count
                await query(
                    'UPDATE Photos SET LikesCount = LikesCount - 1 WHERE PhotoId = @photoId',
                    { photoId }
                );

                liked = false;
            } else {
                // Like - add like
                await query(
                    'INSERT INTO Likes (PhotoId, UserId) VALUES (@photoId, @userId)',
                    { photoId, userId: auth.user.userId }
                );

                // Increment like count
                await query(
                    'UPDATE Photos SET LikesCount = LikesCount + 1 WHERE PhotoId = @photoId',
                    { photoId }
                );
            }

            // Get updated like count
            const updatedPhoto = await query(
                'SELECT LikesCount FROM Photos WHERE PhotoId = @photoId',
                { photoId }
            );

            return {
                status: 200,
                jsonBody: {
                    liked,
                    likesCount: updatedPhoto.recordset[0].LikesCount
                }
            };

        } catch (error) {
            context.error('Like photo error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
