const { app } = require('@azure/functions');
const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');

app.http('photo-get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'photos/{id}',
    handler: async (request, context) => {
        try {
            const photoId = request.params.id;
            
            // Get authentication (optional for viewing)
            const auth = authenticate(request);
            const currentUserId = auth.isAuthenticated ? auth.user.userId : null;

            // Get photo with user info
            const photoQuery = `
                SELECT 
                    p.PhotoId,
                    p.UserId,
                    p.Title,
                    p.Caption,
                    p.Location,
                    p.BlobUrl,
                    p.ThumbnailUrl,
                    p.LikesCount,
                    p.CommentsCount,
                    p.CreatedAt,
                    p.UpdatedAt,
                    u.Username,
                    u.Role
                FROM Photos p
                INNER JOIN Users u ON p.UserId = u.UserId
                WHERE p.PhotoId = @photoId
            `;

            const photoResult = await query(photoQuery, { photoId });

            if (photoResult.recordset.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        error: 'Photo not found'
                    }
                };
            }

            const photo = photoResult.recordset[0];

            // Get comments
            const commentsQuery = `
                SELECT 
                    c.CommentId,
                    c.PhotoId,
                    c.UserId,
                    c.CommentText,
                    c.CreatedAt,
                    u.Username
                FROM Comments c
                INNER JOIN Users u ON c.UserId = u.UserId
                WHERE c.PhotoId = @photoId
                ORDER BY c.CreatedAt DESC
            `;

            const commentsResult = await query(commentsQuery, { photoId });

            // Check if current user has liked this photo
            let hasLiked = false;
            if (currentUserId) {
                const likeQuery = `
                    SELECT LikeId 
                    FROM Likes 
                    WHERE PhotoId = @photoId AND UserId = @currentUserId
                `;
                const likeResult = await query(likeQuery, { photoId, currentUserId });
                hasLiked = likeResult.recordset.length > 0;
            }

            return {
                status: 200,
                jsonBody: {
                    ...photo,
                    comments: commentsResult.recordset,
                    hasLiked
                }
            };

        } catch (error) {
            context.error('Get photo error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
