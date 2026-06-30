import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// JWT verification middleware
// JWT verification middleware
export const verifyJWT = (req, res, next) => {
    // First try to get token from cookie, then fall back to header
    const token = req.cookies.token || req.headers["authorization"]?.replace('Bearer ', '');

    if (!token) {
        if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ No token provided');
        }
        return res.status(401).json({
            success: false,
            message: "Authentication required. No token provided."
        });
    }

    try {
        // Optimization: Try primary secret first
        const primarySecret = process.env.JWT_SECRET;
        let decoded = null;

        if (primarySecret) {
            try {
                decoded = jwt.verify(token, primarySecret);
            } catch (err) {
                // Ignore and try other secrets
            }
        }

        // If primary failed, try others only if defined
        if (!decoded) {
            const secondarySecrets = [
                process.env.JWT_SECRET_ADMIN,
                process.env.JWT_SECRET_EDITOR,
                process.env.JWT_SECRET_AUTHOR
            ].filter(Boolean);

            for (const secret of secondarySecrets) {
                try {
                    decoded = jwt.verify(token, secret);
                    if (decoded) break;
                } catch (err) {
                    continue;
                }
            }
        }

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

// Optional JWT verification (doesn't fail if no token)
export const optionalJWT = (req, res, next) => {
    const token = req.cookies.token || req.headers["authorization"]?.replace('Bearer ', '');

    if (token) {
        try {
            // Quick check with primary secret
            let decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;
        } catch (error) {
            // Silently fail for optional JWT
        }
    }
    next();
};

// Admin middleware - checks if user is admin
// OPTIMIZED: Trust JWT role first, then fallback to DB only if necessary
export const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // 1. Trust JWT role first (extremely fast)
        if (req.user.role === 'Admin') {
            return next();
        }

        // 2. Fallback to DB check only if role in JWT is not Admin 
        // but user claims they should have access (or for extra security)
        const user = await User.findById(req.user.userId).select('role email');
        
        if (user && user.role === 'Admin') {
            req.user.role = 'Admin'; // Update current request's user role
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    } catch (error) {
        console.error('❌ Admin middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying admin access'
        });
    }
};

// Alias for backward compatibility
export const verifyToken = verifyJWT;
