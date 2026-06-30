import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface MongoConnectionOptions extends ConnectOptions {
    tls?: boolean;
    tlsAllowInvalidCertificates?: boolean;
    tlsAllowInvalidHostnames?: boolean;
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
    heartbeatFrequencyMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
    bufferCommands?: boolean;
    appName?: string;
}

/** Redact user:password from MongoDB URI for safe logging */
function redactMongoUri(uri: string | undefined): string {
    if (!uri || typeof uri !== 'string') return '(not set)';
    return uri.replace(/\/\/([^/@:]+):([^@/]+)@/, '//***:***@');
}

export const connectDatabase = async (): Promise<void> => {
    try {
        const options: MongoConnectionOptions = {
            // Security options
            tls: process.env.NODE_ENV === 'production',
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            
            // Connection pooling
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            
            // Additional security
            bufferCommands: true,
            
            // Application name for monitoring
            appName: 'ICIUS_2026_Paper_Management'
        };

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }

        await mongoose.connect(mongoUri, options);
        console.log(`MongoDB connected securely (${redactMongoUri(mongoUri)})`);
        
        // Monitor connection events
        mongoose.connection.on('error', (err: Error) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
    } catch (err: any) {
        console.error("MongoDB Connection Error Details:", {
            message: err.message,
            stack: err.stack
        });
        
        // Don't kill the process in serverless environments
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
        throw err; // Rethrow to be caught by bootstrap
    }
};
