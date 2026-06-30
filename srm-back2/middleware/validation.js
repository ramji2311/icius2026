import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Email validation
export const validateEmail = body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters');

// Password validation
export const validatePassword = body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .isLength({ max: 128 })
    .withMessage('Password must be less than 128 characters');

// Username validation
export const validateUsername = body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim();

// Country validation
export const validateCountry = body('country')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Country can only contain letters, spaces, hyphens, and apostrophes')
    .trim();

// Role validation
export const validateRole = body('role')
    .isIn(['Author', 'Reviewer', 'Editor', 'Admin'])
    .withMessage('Role must be one of: Author, Reviewer, Editor, Admin');

// User type validation
export const validateUserType = body('userType')
    .isIn(['student', 'faculty', 'scholar'])
    .withMessage('User type must be one of: student, faculty, scholar')
    .optional();

// MongoDB ObjectId validation
export const validateObjectId = (field) => param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);

// Query ObjectId validation
export const validateQueryObjectId = (field) => query(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);

// Paper title validation
export const validatePaperTitle = body('paperTitle')
    .isLength({ min: 5, max: 500 })
    .withMessage('Paper title must be between 5 and 500 characters')
    .trim()
    .escape();

// Author name validation
export const validateAuthorName = body('authorName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Author name can only contain letters, spaces, hyphens, and apostrophes')
    .trim();

// OTP validation
export const validateOTP = body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers');

// Token validation
export const validateToken = (source = 'body') => {
    if (source === 'query') {
        return query('token')
            .isLength({ min: 1 })
            .withMessage('Token is required');
    }
    return body('token')
        .isLength({ min: 1 })
        .withMessage('Token is required');
};

// Registration validation
export const validateRegistration = [
    validateEmail,
    validatePassword,
    validateUsername.optional(),
    validateRole.optional(),
    validateCountry.optional(),
    validateUserType.optional(),
    handleValidationErrors
];

// Login validation
export const validateLogin = [
    validateEmail,
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
    handleValidationErrors
];

// Email verification validation
export const validateEmailVerification = [
    validateToken('query').optional(),
    validateEmail.optional(),
    handleValidationErrors
];

// Forgot password validation
export const validateForgotPassword = [
    validateEmail,
    handleValidationErrors
];

// Reset password validation
export const validateResetPassword = [
    validateEmail,
    validateOTP,
    validatePassword,
    handleValidationErrors
];

// Country update validation
export const validateCountryUpdate = [
    validateCountry,
    handleValidationErrors
];

// Paper submission validation
export const validatePaperSubmission = [
    validatePaperTitle,
    validateAuthorName,
    validateEmail,
    handleValidationErrors
];

// Generic ID validation for routes
export const validateId = (field = 'id') => [
    validateObjectId(field),
    handleValidationErrors
];

// Sanitize HTML content (for rich text fields)
export const sanitizeHtml = (value) => {
    if (!value) return value;
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/data:/gi, '');
};

// Custom validator for sanitized content
export const validateSanitizedContent = (field, maxLength = 10000) => [
    body(field)
        .custom((value) => {
            const sanitized = sanitizeHtml(value);
            if (sanitized.length > maxLength) {
                throw new Error(`${field} must be less than ${maxLength} characters after sanitization`);
            }
            return true;
        })
];

// File upload validation
export const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'Only PDF and Word documents are allowed'
        });
    }

    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: 'File size must be less than 10MB'
        });
    }

    next();
};
