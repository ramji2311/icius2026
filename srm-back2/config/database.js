import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Redact user:password from MongoDB URI for safe logging.
function redactMongoUri(uri) {
    if (!uri || typeof uri !== 'string') return '(not set)';
    return uri.replace(/\/\/([^/@:]+):([^@/]+)@/, '//***:***@');
}

let cachedPromise = null;

export const connectDatabase = async () => {
    // If already connected, return
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // If currently connecting, wait for the existing promise
    if (cachedPromise) {
        return cachedPromise;
    }

    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }

        const options = {
            bufferCommands: true, // Keep buffering enabled but we'll ensure connection first
            autoIndex: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 15000, // 15s timeout for server selection
            socketTimeoutMS: 45000, // 45s socket timeout
        };

        console.log(`📡 Connecting to MongoDB... (${redactMongoUri(mongoUri)})`);
        
        cachedPromise = mongoose.connect(mongoUri, options);
        
        const conn = await cachedPromise;
        console.log(`✅ MongoDB connected securely`);

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            cachedPromise = null; // Clear promise so we can try again
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
            cachedPromise = null;
        });

        return conn;
    } catch (err) {
        cachedPromise = null;
        console.error('❌ MongoDB Connection Error Details:', {
            message: err.message,
            stack: err.stack
        });

        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }

        throw err;
    }
};
