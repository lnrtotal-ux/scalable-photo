// Azure Blob Storage utilities
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

const accountName = process.env.STORAGE_ACCOUNT_NAME;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const containerName = process.env.STORAGE_CONTAINER || 'photos';

let blobServiceClient = null;

function getBlobServiceClient() {
    if (!blobServiceClient) {
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential
        );
    }
    return blobServiceClient;
}

/**
 * Upload a photo to blob storage
 */
async function uploadPhoto(buffer, fileName, contentType) {
    try {
        const client = getBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);
        
        // Generate unique filename
        const ext = fileName.split('.').pop();
        const blobName = `${Date.now()}-${uuidv4()}.${ext}`;
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: {
                blobContentType: contentType
            }
        });
        
        return blockBlobClient.url;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

/**
 * Delete a photo from blob storage
 */
async function deletePhoto(blobUrl) {
    try {
        const client = getBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);
        
        // Extract blob name from URL
        const blobName = blobUrl.split('/').pop();
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
        
        return true;
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
}

/**
 * Get a blob's properties
 */
async function getBlobProperties(blobUrl) {
    try {
        const client = getBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);
        
        const blobName = blobUrl.split('/').pop();
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        const properties = await blockBlobClient.getProperties();
        return properties;
    } catch (error) {
        console.error('Get properties error:', error);
        throw error;
    }
}

module.exports = {
    uploadPhoto,
    deletePhoto,
    getBlobProperties
};
