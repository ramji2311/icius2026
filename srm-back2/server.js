import express from 'express';
import { createServer } from 'http';
import { initializeSocket } from './utils/socket.js';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';
import compression from 'compression';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { validateProductionEnv } from './config/validateEnv.js';
import { PaperSubmission } from './models/Paper.js';
// Rate limiting removed
import { securityLogger, helmetConfig } from './middleware/security.js';
import { requestLogger } from './utils/securityLogger.js';



import authRoutes from './routes/authRoutes.js';
import paperRoutes from './routes/paperRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import editorRoutes from './routes/editorRoutes.js';
import reviewerRoutes from './routes/reviewerRoutes.js';
import paymentRegistrationRoutes from './routes/paymentRegistration.js';
import committeeRoutes from './routes/committee.js';
import keynoteSpeakerRoutes from './routes/keynoteSpeaker.js';
import membershipRoutes from './routes/membershipRoutes.js';
import listenerRoutes from './routes/listenerRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import copyrightRoutes from './routes/copyrightRoutes.js';
import paperMessageRoutes from './routes/paperMessageRoutes.js';
import supportMessageRoutes from './routes/supportMessageRoutes.js';
import adminPaperSubmissionRoutes from './routes/adminPaperSubmissionRoutes.js';
import adminPaperAcceptanceRoutes from './routes/adminPaperAcceptanceRoutes.js';
import { verifyJWT } from './middleware/auth.js';
import { invalidateEntityCache } from './middleware/cache.js';


dotenv.config();

/** Debug/test routes that expose data or proxy fetches — off in production unless explicitly enabled */
const allowDebugEndpoints =
    process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_ROUTES === 'true';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io only when not in serverless mode
if (process.env.VERCEL !== '1') {
    initializeSocket(httpServer);
}

// Trust Proxy - Essential for secure cookies when behind a load balancer (Railway, Vercel, Heroku)
app.set('trust proxy', 1);

// Database connection middleware - ENSURES connection is ready before processing ANY request
// This is critical for serverless environments to prevent "buffering timed out" errors
app.use(async (req, res, next) => {
    try {
        await connectDatabase();
        next();
    } catch (err) {
        console.error('❌ Database connection middleware error:', err.message);
        res.status(503).json({
            success: false,
            message: 'Database connection failed. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Apply security logging and request logging
app.use(securityLogger);
app.use(requestLogger);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 2. Data Sanitization against NoSQL Injection
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️ Sanitized potentially malicious data in ${key}`);
    }
}));

// 3. Prevent HTTP Parameter Pollution attacks
app.use(hpp({
    whitelist: ['email', 'category', 'status', 'role', 'participantType', 'isInternational']
}));

// 4. Security Headers
app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove X-Powered-By header to hide Express
    res.removeHeader('X-Powered-By');

    next();
});

// 6. Compression Middleware - Enable gzip compression for all responses
app.use(compression({
    filter: (req, res) => {
        // Don't compress responses that are already compressed
        if (res.getHeader('Content-Encoding')) {
            return false;
        }
        // Compress all responses
        return true;
    },
    level: 6, // Compression level (1-9, 6 is default)
    threshold: 1024, // Only compress responses larger than 1KB
}));

// 7. CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:5173',
            'http://localhost:3000',
            'https://is-woad.vercel.app',
            'https://icius2026.unsysdigital.com'
        ];

        // Allow requests without an Origin header for local tooling
        if (!origin) {
            callback(null, true);
            return;
        }

        // Check if origin is in whitelist
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 BLOCKED: Unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
    maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 8. Static files with security and caching
app.use('/public', express.static('public', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Add security headers for static files
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Add caching headers for static assets
        if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// 9. Response caching headers for API responses
app.use((req, res, next) => {
    // Add caching headers for GET requests to static data
    if (req.method === 'GET') {
        // Cache committee data for 1 hour
        if (req.path.includes('/committee')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        // Cache keynote speakers for 1 hour
        else if (req.path.includes('/keynote-speakers')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        // Cache paper data for 30 minutes
        else if (req.path.includes('/papers') && !req.path.includes('/submit')) {
            res.setHeader('Cache-Control', 'public, max-age=1800');
        }
        // Cache analytics data for 15 minutes
        else if (req.path.includes('/analytics')) {
            res.setHeader('Cache-Control', 'public, max-age=900');
        }
    }
    next();
});

// The local verifyJWT has been removed in favor of the imported one from middleware/auth.js

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ICIUS 2026 Research Paper Management System API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            papers: '/api/papers',
            admin: '/api/admin',
            editor: '/api/editor',
            reviewer: '/api/reviewer'
        }
    });
});

app.get('/health', (req, res) => {
    const dbOk = mongoose.connection.readyState === 1;
    res.status(dbOk ? 200 : 503).json({
        success: dbOk,
        status: dbOk ? 'healthy' : 'degraded',
        database: dbOk ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// CORS Verification Endpoint
app.get('/cors-check', (req, res) => {
    const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3000',
        'https://is-woad.vercel.app',
        'https://icius2026.unsysdigital.com'
    ];

    const origin = req.headers.origin;

    // Allow basic tooling checks without an Origin header
    if (!origin) {
        return res.status(200).json({
            success: true,
            message: 'CORS check passed - No Origin header',
            origin: 'none',
            allowed: allowed,
            info: 'Requests without Origin are allowed for local tooling'
        });
    }

    // REJECT: Origin not in whitelist
    if (!allowed.includes(origin)) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden - Origin not in allowed list',
            origin: origin,
            allowed: allowed
        });
    }

    // ALLOW: Valid origin
    return res.status(200).json({
        success: true,
        message: 'CORS check passed - Origin authorized',
        origin: origin,
        allowed: allowed
    });
});


// Security Middleware (Rate limiting removed as per user request)

// Apply enhanced Helmet for security headers
app.use(helmetConfig);

// Apply XSS protection
app.use(xss());

// Routes (Rate limiting removed as per user request)
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/reviewer', reviewerRoutes);
app.use('/api/registration', paymentRegistrationRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/keynote-speakers', keynoteSpeakerRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/listener', listenerRoutes);
if (allowDebugEndpoints) {
    app.use('/api/debug', debugRoutes);
}
app.use('/api/copyright', copyrightRoutes);
app.use('/api/paper-messages', paperMessageRoutes);
app.use('/api/support-messages', supportMessageRoutes);
app.use('/api/admin-paper-submission', adminPaperSubmissionRoutes);
app.use('/api/admin-paper-acceptance', adminPaperAcceptanceRoutes);



app.get('/user-submission', verifyJWT, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { PaperSubmission } = await import('./models/Paper.js');

        // Fetch all paper submissions for this email from the single collection
        const paperSubmissions = await PaperSubmission.find({ email: userEmail })
            .sort({ createdAt: -1 });

        if (paperSubmissions.length === 0) {
            return res.status(200).json({
                success: true,
                hasSubmission: false,
                submission: null,
                submissions: []
            });
        }

        return res.status(200).json({
            success: true,
            hasSubmission: true,
            submission: paperSubmissions[0],
            submissions: paperSubmissions
        });
    } catch (error) {
        console.error('Error fetching user submission:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
});

// Get revision status for author
app.get('/revision-status', verifyJWT, async (req, res) => {
    try {
        const { Revision } = await import('./models/Revision.js');
        const userEmail = req.user.email;

        const revisions = await Revision.find({ authorEmail: userEmail })
            .populate('reviewerComments.reviewerId', 'username email');

        return res.status(200).json({
            success: true,
            hasRevision: revisions.length > 0,
            revisions
        });
    } catch (error) {
        console.error('Error fetching revision status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching revision status',
            error: error.message
        });
    }
});

// Submit revised paper endpoint
app.post('/submit-revised-paper', verifyJWT, async (req, res) => {
    try {
        const { submissionId, authorResponse } = req.body;
        const userEmail = req.user.email;

        if (!submissionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing submissionId'
            });
        }

        // For now, store the PDF URL from the upload (this would come from Cloudinary in real implementation)
        // In production, you'd handle file upload to Cloudinary here
        const { Revision } = await import('./models/Revision.js');

        const revision = await Revision.findOne({ submissionId, authorEmail: userEmail });
        if (!revision) {
            return res.status(404).json({
                success: false,
                message: 'Revision record not found'
            });
        }

        // Update revision with revised paper info
        revision.authorResponse = authorResponse || '';
        revision.revisedPaperSubmittedAt = new Date();
        revision.revisionStatus = 'Resubmitted';
        await revision.save();

        // Update paper status
        const paper = await PaperSubmission.findOne({ submissionId });
        if (paper) {
            paper.status = 'Revised Submitted';
            paper.revisionCount = (paper.revisionCount || 0) + 1;
            await paper.save();
        }

        await invalidateEntityCache('paper');

        return res.status(200).json({
            success: true,
            message: 'Revised paper submitted successfully',
            revision
        });
    } catch (error) {
        console.error('Error submitting revised paper:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting revised paper',
            error: error.message
        });
    }
});

// ==================== TEST ROUTES (disabled in production; set ENABLE_DEBUG_ROUTES=true to enable) ====================
function isSafeCloudinaryPublicId(publicId) {
    if (!publicId || typeof publicId !== 'string' || publicId.length > 500) return false;
    if (/[\r\n\0]/.test(publicId) || publicId.includes('..')) return false;
    return true;
}

if (allowDebugEndpoints) {
    app.get('/test/paperfetch', async (req, res) => {
        try {
            const papers = await PaperSubmission.find({})
                .populate('assignedEditor', 'username email')
                .populate('assignedReviewers', 'username email')
                .sort({ createdAt: -1 });

            console.log(`Found ${papers.length} papers in database`);

            if (papers.length > 0) {
                console.log('First paper:', JSON.stringify(papers[0], null, 2));
            }

            return res.status(200).json({
                success: true,
                count: papers.length,
                papers: papers
            });
        } catch (error) {
            console.error('Error fetching papers:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching papers',
                error: error.message
            });
        }
    });

    // PDF fetch: publicId only (arbitrary `url` was removed — it enabled SSRF)
    app.get('/test/pdf-fetch', async (req, res) => {
        try {
            const { publicId } = req.query;

            if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) {
                return res.status(400).json({
                    success: false,
                    message: 'publicId required and CLOUDINARY_CLOUD_NAME must be set'
                });
            }

            const decodedPublicId = decodeURIComponent(publicId);
            if (!isSafeCloudinaryPublicId(decodedPublicId)) {
                return res.status(400).json({ success: false, message: 'Invalid publicId' });
            }

            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const publicIdWithoutExt = decodedPublicId.replace(/\.pdf$/, '');
            const pdfUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicIdWithoutExt}.pdf`;

            const response = await fetch(pdfUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch PDF:', response.status, response.statusText);
                return res.status(response.status).json({
                    success: false,
                    message: `Failed to fetch PDF: ${response.statusText}`,
                    status: response.status
                });
            }

            const contentType = response.headers.get('content-type') || 'application/pdf';
            const contentLength = response.headers.get('content-length');

            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Accept-Ranges', 'bytes');

            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }

            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        } catch (error) {
            console.error('PDF Fetch Error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error fetching PDF',
                error: error.message
            });
        }
    });

    app.get('/test/cloudinary-pdf', async (req, res) => {
        try {
            const { publicId } = req.query;

            if (!publicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cloudinary public ID required'
                });
            }

            const decoded = decodeURIComponent(publicId);
            if (!isSafeCloudinaryPublicId(decoded)) {
                return res.status(400).json({ success: false, message: 'Invalid publicId' });
            }

            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                return res.status(500).json({ success: false, message: 'CLOUDINARY_CLOUD_NAME not configured' });
            }

            const pdfUrl = `https://res.cloudinary.com/${cloudName}/fl_attachment/v1/${decoded}`;

            const response = await fetch(pdfUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/pdf',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    message: 'Failed to fetch PDF from Cloudinary',
                    status: response.status
                });
            }

            const contentType = response.headers.get('content-type') || 'application/pdf';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', 'inline; filename="paper.pdf"');

            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching Cloudinary PDF',
                error: error.message
            });
        }
    });
}

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Default error — avoid leaking internal details in production
    const status = err.status || 500;
    const isDev = process.env.NODE_ENV === 'development';
    const safeMessage =
        status >= 500 && !isDev
            ? 'Internal server error'
            : err.message || 'Internal server error';

    res.status(status).json({
        success: false,
        message: safeMessage,
        ...(isDev && { stack: err.stack })
    });
});

// ==================== SERVER STARTUP ====================
/** Vercel and other serverless hosts inject this; do not call listen() there */
const isServerless = process.env.VERCEL === '1';

async function bootstrap() {
    validateProductionEnv();
    await connectDatabase();
    await initRedis();

    if (isServerless) {
        console.log(
            'Serverless mode (VERCEL=1): HTTP bind skipped — platform invokes the app. WebSockets need a long-lived host (e.g. Railway).'
        );
        return;
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ICIUS 2026 Research Paper Management System           ║
║   Server running on http://localhost:${PORT}                ║
║   WebSocket Enabled: Yes                                   ║
║                                                           ║
║   API Endpoints:                                          ║
║   - Auth:     /api/auth                                   ║
║   - Papers:   /api/papers                                 ║
║   - Admin:    /api/admin                                  ║
║   - Editor:   /api/editor                                 ║
║   - Reviewer: /api/reviewer                               ║
║                                                           ║
║   Environment:                                            ║
║   - Node:     ${process.env.NODE_ENV || 'development'}                           ║
║   - CORS:     Configured for frontend deployment        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
    });

    const shutdown = async (signal) => {
        console.log(`\n${signal} received, closing server...`);
        httpServer.close(async () => {
            mongoose.connection.close(false).then(async () => {
                console.log('MongoDB connection closed.');
                const { closeRedis } = await import('./config/redis.js');
                await closeRedis();
                process.exit(0);
            });
        });
        setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    if (!isServerless) {
        process.exit(1);
    }
});

export default app;
