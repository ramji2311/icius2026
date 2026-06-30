import cloudinary from './cloudinary.js';
import streamifier from 'streamifier';
import path from 'path';
import { Readable } from 'stream';

interface UploadResult {
    url: string;
    publicId: string;
    fileName: string;
}

interface CloudinaryResource {
    public_id: string;
    secure_url: string;
    bytes: number;
    created_at: string;
}

// Use the unified configuration from cloudinary.js

/**
 * Upload PDF to Cloudinary and return the secure URL
 * @param fileBuffer - The PDF file buffer
 * @param fileName - Original file name
 * @returns Promise with URL and public ID
 */
export const uploadPdfToCloudinary = async (fileBuffer: Buffer, fileName: string): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
        const extension = path.extname(fileName).toLowerCase();
        const cleanFileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim().replace(/\s+/g, '_');

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                folder: 'icius-pdfs',
                public_id: `${Date.now()}-${cleanFileNameWithoutExt}${extension}`, // Unique ID based on timestamp and filename
                access_mode: 'authenticated', // Keep PDFs private, only accessible with auth token if needed
                timeout: 60000, // 60 second timeout for upload
                chunk_size: 5242880 // 5MB chunks for large files
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
                        fileName: fileName
                    });
                } else {
                    reject(new Error('Unknown error during Cloudinary upload'));
                }
            }
        );

        // Pipe the file buffer to the upload stream
        const readStream = streamifier.createReadStream(fileBuffer) as unknown as Readable;
        readStream.on('error', (error: Error) => {
            console.error('Stream read error:', error);
            reject(new Error(`Failed to read file stream: ${error.message}`));
        });

        readStream.pipe(uploadStream);
    });
};


/**
 * Delete PDF from Cloudinary
 * @param publicId - Cloudinary public ID of the file
 * @returns Promise
 */
export const deletePdfFromCloudinary = async (publicId: string): Promise<any> => {
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
 * List all PDFs in the icius-pdfs folder from Cloudinary
 * @returns Promise with array of PDF resources
 */
export const listPdfsFromCloudinary = async (): Promise<CloudinaryResource[]> => {
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
