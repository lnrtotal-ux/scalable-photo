const { app } = require('@azure/functions');
const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');

app.http('photo-update', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'photos/{id}',
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

            const body = await request.json();
            const { title, caption, location } = body;

            // Check if photo exists and user owns it
            const existingPhoto = await query(
                'SELECT UserId FROM Photos WHERE PhotoId = @photoId',
                { photoId }
            );

            if (existingPhoto.recordset.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        error: 'Photo not found'
                    }
                };
            }

            // Verify ownership (unless admin)
            if (existingPhoto.recordset[0].UserId !== auth.user.userId && auth.user.role !== 'admin') {
                return {
                    status: 403,
                    jsonBody: {
                        error: 'You can only update your own photos'
                    }
                };
            }

            // Build update query dynamically
            const updates = [];
            const params = { photoId };

            if (title !== undefined) {
                updates.push('Title = @title');
                params.title = title;
            }
            if (caption !== undefined) {
                updates.push('Caption = @caption');
                params.caption = caption;
            }
            if (location !== undefined) {
                updates.push('Location = @location');
                params.location = location;
            }

            if (updates.length === 0) {
                return {
                    status: 400,
                    jsonBody: {
                        error: 'No fields to update'
                    }
                };
            }

            updates.push('UpdatedAt = GETDATE()');

            const updateQuery = `
                UPDATE Photos 
                SET ${updates.join(', ')}
                OUTPUT INSERTED.*
                WHERE PhotoId = @photoId
            `;

            const result = await query(updateQuery, params);
            const updatedPhoto = result.recordset[0];

            return {
                status: 200,
                jsonBody: updatedPhoto
            };

        } catch (error) {
            context.error('Update photo error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
