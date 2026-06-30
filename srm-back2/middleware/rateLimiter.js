import rateLimit from 'express-rate-limit';
import { MemoryStore } from 'express-rate-limit';

// Store for tracking failed attempts
const failedAttempts = new Map();

// General API rate limiter
export const generalLimiter = rateLimit({
    store: new MemoryStore(),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        });
    }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
    store: new MemoryStore(),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        console.warn(`⚠️ Auth rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts, please try again later.'
        });
    }
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
    store: new MemoryStore(),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        console.warn(`⚠️ Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts, please try again later.'
        });
    }
});

// Email verification rate limiter
export const emailVerificationLimiter = rateLimit({
    store: new MemoryStore(),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 verification requests per hour
    message: {
        success: false,
        message: 'Too many verification attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        console.warn(`⚠️ Email verification rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many verification attempts, please try again later.'
        });
    }
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
    store: new MemoryStore(),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 file uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️ Upload rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many file uploads, please try again later.'
        });
    }
});

// Admin routes rate limiter (more restrictive)
export const adminLimiter = rateLimit({
    store: new MemoryStore(),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 admin requests per windowMs
    message: {
        success: false,
        message: 'Too many admin requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️ Admin rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many admin requests, please try again later.'
        });
    }
});

// Progressive delay middleware for failed login attempts
export const progressiveDelay = (req, res, next) => {
    const key = `${req.ip}:${req.body.email || 'unknown'}`;
    const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    
    // Reset attempts if last attempt was more than 15 minutes ago
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
    }
    
    // Calculate delay based on number of failed attempts
    const delay = Math.min(1000 * Math.pow(2, attempts.count), 30000); // Max 30 seconds
    
    if (attempts.count > 2) {
        console.warn(`🔒 Applying progressive delay for ${key}: ${delay}ms (attempts: ${attempts.count})`);
        setTimeout(() => {
            next();
        }, delay);
    } else {
        next();
    }
};

// Track failed login attempts
export const trackFailedAttempt = (req, res, next) => {
    const key = `${req.ip}:${req.body.email || 'unknown'}`;
    const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
    
    // Only track on failed responses
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            attempts.count++;
            attempts.lastAttempt = Date.now();
            failedAttempts.set(key, attempts);
            console.warn(`❌ Failed attempt tracked for ${key}: ${attempts.count} attempts`);
        }
        originalSend.call(this, data);
    };
    
    next();
};

// Clear failed attempts on successful login
export const clearFailedAttempts = (req, res, next) => {
    const key = `${req.ip}:${req.body.email || 'unknown'}`;
    failedAttempts.delete(key);
    next();
};

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const cutoff = now - (15 * 60 * 1000); // 15 minutes ago
    
    for (const [key, attempts] of failedAttempts.entries()) {
        if (attempts.lastAttempt < cutoff) {
            failedAttempts.delete(key);
        }
    }
    
    console.log(`🧹 Cleaned up ${failedAttempts.size} active failed attempt records`);
}, 5 * 60 * 1000);
