const { app } = require('@azure/functions');
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

        const formData = await request.formData();
        const title = formData.get('title');
        const caption = formData.get('caption') || '';
        const location = formData.get('location') || '';
        const photoFile = formData.get('photo');

        if (!title || !photoFile) {
            return { status: 400, jsonBody: { error: 'Title and photo file are required' } };
        }

        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const blobUrl = await uploadPhoto(buffer, photoFile.name, photoFile.type);

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
