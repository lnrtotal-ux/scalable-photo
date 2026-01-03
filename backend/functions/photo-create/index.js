const { app } = require('@azure/functions');
const { query } = require('../utils/db');
const { authenticate, hasRole } = require('../utils/auth');
const { uploadPhoto } = require('../utils/storage');

app.http('photo-create', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'photos',
    handler: async (request, context) => {
        try {
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

            // Check if user is creator
            if (!hasRole(auth.user, 'creator')) {
                return {
                    status: 403,
                    jsonBody: {
                        error: 'Only creators can upload photos'
                    }
                };
            }

            // Parse multipart form data
            const formData = await request.formData();
            const title = formData.get('title');
            const caption = formData.get('caption') || '';
            const location = formData.get('location') || '';
            const photoFile = formData.get('photo');

            if (!title || !photoFile) {
                return {
                    status: 400,
                    jsonBody: {
                        error: 'Title and photo file are required'
                    }
                };
            }

            // Upload to blob storage
            const buffer = Buffer.from(await photoFile.arrayBuffer());
            const blobUrl = await uploadPhoto(buffer, photoFile.name, photoFile.type);

            // Save to database
            const result = await query(
                `INSERT INTO Photos (UserId, Title, Caption, Location, BlobUrl) 
                 OUTPUT INSERTED.*
                 VALUES (@userId, @title, @caption, @location, @blobUrl)`,
                {
                    userId: auth.user.userId,
                    title,
                    caption,
                    location,
                    blobUrl
                }
            );

            const newPhoto = result.recordset[0];

            return {
                status: 201,
                jsonBody: {
                    photoId: newPhoto.PhotoId,
                    userId: newPhoto.UserId,
                    title: newPhoto.Title,
                    caption: newPhoto.Caption,
                    location: newPhoto.Location,
                    blobUrl: newPhoto.BlobUrl,
                    likesCount: newPhoto.LikesCount,
                    commentsCount: newPhoto.CommentsCount,
                    createdAt: newPhoto.CreatedAt
                }
            };

        } catch (error) {
            context.error('Create photo error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
