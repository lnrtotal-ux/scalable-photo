const { query } = require('../utils/db');
const { authenticate, hasRole } = require('../utils/auth');
const { uploadPhoto } = require('../utils/storage');


async function handler(request, context) {
    try {
        const auth = authenticate(request);
        if (!auth.isAuthenticated) {
            return { status: 401, jsonBody: { error: 'Unauthorized' } };
        }

        const user = auth.user;
        if (!hasRole(user, 'creator')) {
            return { status: 403, jsonBody: { error: 'Only creators can upload photos' } };
        }

        // Get form fields from body (multer parses multipart form fields into req.body)
        const title = request.body?.title;
        const caption = request.body?.caption || '';
        const location = request.body?.location || '';
        
        // Get file from multer (attached by Express wrapper)
        const photoFile = request.file;

        if (!title || !photoFile) {
            return { status: 400, jsonBody: { error: 'Title and photo file are required' } };
        }

        // Upload to blob storage using multer's buffer
        const blobUrl = await uploadPhoto(photoFile.buffer, photoFile.originalname, photoFile.mimetype);

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
                createdAt: newPhoto.CreatedAt
            }
        };

    } catch (error) {
        context.error('Create photo error:', error);
        return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
}

module.exports = { handler };
