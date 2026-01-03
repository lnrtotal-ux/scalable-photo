const { app } = require('@azure/functions');
const { query } = require('../utils/db');

app.http('photos-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'photos',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 20;
            const search = url.searchParams.get('search') || '';
            const userId = url.searchParams.get('userId');

            const offset = (page - 1) * limit;

            // Build query
            let whereClause = '1=1';
            let params = { limit, offset };

            if (search) {
                whereClause += ` AND (p.Title LIKE @search OR p.Caption LIKE @search OR p.Location LIKE @search)`;
                params.search = `%${search}%`;
            }

            if (userId) {
                whereClause += ` AND p.UserId = @userId`;
                params.userId = parseInt(userId);
            }

            // Get photos with user info
            const photosQuery = `
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
                WHERE ${whereClause}
                ORDER BY p.CreatedAt DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `;

            const photos = await query(photosQuery, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as Total
                FROM Photos p
                WHERE ${whereClause}
            `;
            
            const countParams = { ...params };
            delete countParams.limit;
            delete countParams.offset;
            
            const countResult = await query(countQuery, countParams);
            const total = countResult.recordset[0].Total;

            return {
                status: 200,
                jsonBody: {
                    photos: photos.recordset,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            };

        } catch (error) {
            context.error('List photos error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
