import cloudinary from './cloudinary.js';
import streamifier from 'streamifier';
import path from 'path';

/**
 * Upload PDF to Cloudinary and return the secure URL.
 */
export const uploadPdfToCloudinary = async (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const extension = path.extname(fileName).toLowerCase();
        const cleanFileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim().replace(/\s+/g, '_');

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                folder: 'icius-pdfs',
                public_id: `${Date.now()}-${cleanFileNameWithoutExt}${extension}`,
                access_mode: 'authenticated',
                timeout: 60000,
                chunk_size: 5242880
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(new Error(`Failed to upload PDF to Cloudinary: ${error.message}`));
                } else if (result) {
                    console.log('PDF uploaded to Cloudinary:', {
                        url: result.secure_url,
                        publicId: result.public_id,
                        size: result.bytes
                    });
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        fileName
                    });
                } else {
                    reject(new Error('Unknown error during Cloudinary upload'));
                }
            }
        );

        const readStream = streamifier.createReadStream(fileBuffer);
        readStream.on('error', (error) => {
            console.error('Stream read error:', error);
            reject(new Error(`Failed to read file stream: ${error.message}`));
        });

        readStream.pipe(uploadStream);
    });
};

/**
 * Delete PDF from Cloudinary.
 */
export const deletePdfFromCloudinary = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
            if (error) {
                console.error('Cloudinary delete error:', error);
                reject(new Error(`Failed to delete PDF from Cloudinary: ${error.message}`));
            } else {
                console.log('PDF deleted from Cloudinary:', publicId);
                resolve(result);
            }
        });
    });
};

/**
 * List all PDFs in the icius-pdfs folder from Cloudinary.
 */
export const listPdfsFromCloudinary = async () => {
    return new Promise((resolve, reject) => {
        cloudinary.api.resources(
            {
                type: 'upload',
                prefix: 'icius-pdfs',
                resource_type: 'raw',
                max_results: 500
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary list error:', error);
                    reject(new Error(`Failed to list PDFs from Cloudinary: ${error.message}`));
                } else if (result && result.resources) {
                    console.log(`Found ${result.resources.length} PDFs in Cloudinary`);
                    resolve(result.resources);
                } else {
                    reject(new Error('Unknown error during Cloudinary list operation'));
                }
            }
        );
    });
};

export default cloudinary;
