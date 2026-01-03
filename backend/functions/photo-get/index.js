const { app } = require('@azure/functions');
const { query } = require('../utils/db');

app.http('photo-get', {
    methods: ['GET'],
async function handler(request, context) {
    try {
        const photoId = request.params.id;
        
        // Get authentication (optional for viewing)
        const auth = authenticate(request);
        const currentUserId = auth.isAuthenticated ? auth.user.userId : null;
            const auth = authenticate(request);
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
                    }
        const photoResult = await query(photoQuery, { photoId });
                const likeQuery = `
        if (photoResult.recordset.length === 0) {
            return {
                status: 404,
                jsonBody: { error: 'Photo not found' }
            };
        }
                    SELECT LikeId 
        const photo = photoResult.recordset[0];
                    FROM Likes 
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
                    WHERE PhotoId = @photoId AND UserId = @currentUserId
        const commentsResult = await query(commentsQuery, { photoId });
                `;
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
                const likeResult = await query(likeQuery, { photoId, currentUserId });
        return {
            status: 200,
            jsonBody: {
                ...photo,
                comments: commentsResult.recordset,
                hasLiked
            }
        };
                hasLiked = likeResult.recordset.length > 0;
    } catch (error) {
        context.error('Get photo error:', error);
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

module.exports = { handler };
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
