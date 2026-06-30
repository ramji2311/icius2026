import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import crypto from 'crypto';

// Rate limiting configuration
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return rateLimit({
        windowMs, // Time window in milliseconds
        max, // Max requests per window
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        // Skip rate limiting for certain IPs (optional)
        skip: (req) => {
            // Skip for localhost in development
            if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
                return true;
            }
            return false;
        }
    });
};

// Specific rate limiters for different endpoints
export const authLimiter = createRateLimiter(15 * 60 * 1000, 20); // 5 requests per 15 minutes for auth
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 200); // 100 requests per 15 minutes for API
export const uploadLimiter = createRateLimiter(60 * 60 * 1000, 1); // 10 uploads per hour
export const strictLimiter = createRateLimiter(15 * 60 * 1000, 5); // 3 requests per 15 minutes for sensitive operations

// Helmet configuration for security headers
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://res.cloudinary.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// MongoDB injection protection
export const mongoSanitizeConfig = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️  Sanitized potentially malicious input: ${key}`);
    }
});

// XSS protection
export const xssConfig = xss();

// HTTP Parameter Pollution protection
export const hppConfig = hpp({
    whitelist: ['category', 'status', 'role'] // Allow these parameters to appear multiple times
});

// Input validation helper
export const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove HTML tags
        return input.replace(/<[^>]*>/g, '');
    }
    return input;
};

// File upload validation
export const validateFileUpload = (file, allowedTypes = ['application/pdf'], maxSize = 10 * 1024 * 1024) => {
    const errors = [];

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
        errors.push(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file name
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html'];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExt)) {
        errors.push('Dangerous file extension detected');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// CORS configuration
export const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:5173',
            'http://localhost:3000'
        ];

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

// Security logging middleware
// OPTIMIZED: Skip deep inspection for GET requests, focus on mutations
export const securityLogger = (req, res, next) => {
    // Only perform deep inspection for mutation requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /\$\{/,
        /union.*select/i,
        /exec\s*\(/i
    ];

    const checkForSuspiciousContent = (obj, depth = 0) => {
        // Prevent infinite recursion and limit depth for performance
        if (depth > 5 || !obj || typeof obj !== 'object') return;

        for (const key in obj) {
            const value = obj[key];

            if (typeof value === 'string') {
                if (value.length > 20) { // Only check strings long enough to contain a payload
                    for (const pattern of suspiciousPatterns) {
                        if (pattern.test(value)) {
                            console.warn(`🚨 SECURITY ALERT: Suspicious pattern in ${key}`);
                        }
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                checkForSuspiciousContent(value, depth + 1);
            }
        }
    };

    // Check request body (most common injection point)
    if (req.body && Object.keys(req.body).length > 0) {
        checkForSuspiciousContent(req.body);
    }

    next();
};

// Advanced security utilities

// Generate secure random token
export const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate secure OTP
export const generateSecureOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
};

// Sanitize filename to prevent directory traversal
export const sanitizeFilename = (filename) => {
    if (!filename) return '';
    
    const sanitized = filename
        .replace(/^.*[\\\/]/, '') // Remove path
        .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace unsafe chars
        .replace(/\.{2,}/g, '.') // Replace multiple dots
        .replace(/^\.+/, '') // Remove leading dots
        .slice(0, 255); // Limit length
    
    return sanitized;
};

// Check for SQL injection patterns
export const containsSqlInjection = (input) => {
    if (!input || typeof input !== 'string') return false;
    
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\*\/|\/\*|;|'|")/,
        /(\bOR\b.*=.*\bOR\b)/i,
        /(\bAND\b.*=.*\bAND\b)/i,
        /(1=1|1 = 1)/i,
        /(\bWHERE\b.*\bOR\b)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
};

// Validate password strength
export const validatePasswordStrength = (password) => {
    if (!password || typeof password !== 'string') return false;
    
    const checks = {
        length: password.length >= 8 && password.length <= 128,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noCommonPatterns: !/(.)\1{2,}/.test(password),
        noSequentialNumbers: !/(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    return {
        isValid: passedChecks >= 5,
        strength: passedChecks,
        checks
    };
};

// Generate CSRF token
export const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('base64');
};

// Log security events
export const logSecurityEventSimple = (event, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        severity: details.severity || 'info'
    };
    
    console.log(`🔒 SECURITY [${logEntry.severity.toUpperCase()}]: ${event}`, details);
    
    if (process.env.NODE_ENV === 'production' && process.env.SECURITY_WEBHOOK_URL) {
        fetch(process.env.SECURITY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
        }).catch(err => console.error('Failed to send security log:', err));
    }
};

export default {
    createRateLimiter,
    authLimiter,
    apiLimiter,
    uploadLimiter,
    strictLimiter,
    helmetConfig,
    mongoSanitizeConfig,
    xssConfig,
    hppConfig,
    sanitizeInput,
    validateFileUpload,
    corsOptions,
    securityLogger,
    generateSecureToken,
    generateSecureOTP,
    sanitizeFilename,
    containsSqlInjection,
    validatePasswordStrength,
    generateCSRFToken,
    logSecurityEvent: logSecurityEventSimple
};
