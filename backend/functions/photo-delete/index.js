const { app } = require('@azure/functions');
const { query } = require('../utils/db');
const { authenticate } = require('../utils/auth');
const { deletePhoto } = require('../utils/storage');

app.http('photo-delete', {
    methods: ['DELETE'],
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

            // Get photo to verify ownership and get blob URL
            const photoResult = await query(
                'SELECT UserId, BlobUrl FROM Photos WHERE PhotoId = @photoId',
                { photoId }
            );

            if (photoResult.recordset.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        error: 'Photo not found'
                    }
                };
            }

            const photo = photoResult.recordset[0];

            // Verify ownership (unless admin)
            if (photo.UserId !== auth.user.userId && auth.user.role !== 'admin') {
                return {
                    status: 403,
                    jsonBody: {
                        error: 'You can only delete your own photos'
                    }
                };
            }

            // Delete from blob storage
            try {
                await deletePhoto(photo.BlobUrl);
            } catch (storageError) {
                context.warn('Failed to delete blob:', storageError);
                // Continue with database deletion even if blob deletion fails
            }

            // Delete from database (will cascade to likes and comments)
            await query('DELETE FROM Photos WHERE PhotoId = @photoId', { photoId });

            return {
                status: 200,
                jsonBody: {
                    message: 'Photo deleted successfully'
                }
            };

        } catch (error) {
            context.error('Delete photo error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
