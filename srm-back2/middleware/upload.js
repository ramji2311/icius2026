import multer from 'multer';
import path from 'path';
import { sanitizeFilename, validateFileUpload, logSecurityEventSimple } from './security.js';

// Memory storage for PDFs (we'll convert to base64)
const memoryStorage = multer.memoryStorage();

// Enhanced file filter for PDFs only with security checks
const pdfFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';

    // Security checks
    const sanitizedFilename = sanitizeFilename(file.originalname);
    if (sanitizedFilename !== file.originalname) {
        logSecurityEventSimple('Suspicious filename detected', {
            original: file.originalname,
            sanitized: sanitizedFilename,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    }

    // Check for dangerous file patterns
    const dangerousPatterns = [
        /\.(exe|bat|cmd|sh|php|js|html|htm|jsp|asp|aspx)$/i,
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
        /[<>:"|?*]/
    ];

    const isDangerous = dangerousPatterns.some(pattern => pattern.test(file.originalname));
    if (isDangerous) {
        logSecurityEventSimple('Dangerous file upload attempt', {
            filename: file.originalname,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            severity: 'high'
        });
        return cb(new Error('Dangerous file name detected'));
    }

    if (extname && mimetype) {
        // Sanitize filename
        file.originalname = sanitizedFilename;
        return cb(null, true);
    }
    
    logSecurityEventSimple('Invalid file type upload attempt', {
        filename: file.originalname,
        mimetype: file.mimetype,
        ip: req.ip
    });
    cb(new Error('Only PDF files are allowed'));
};

// File filter for documents (PDF, DOC, DOCX)
const documentFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
};

// Upload middleware for paper PDFs (stores in memory)
export const uploadPaperPDF = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: pdfFileFilter
});

// Upload middleware for review files
export const uploadReviewFile = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: documentFileFilter
});

// Upload middleware for temporary uploads (if needed)
export const uploadMemory = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: pdfFileFilter
});

// Upload middleware for final documents (PDF, DOC, DOCX)
export const uploadFinalDocument = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    },
    fileFilter: documentFileFilter
});

// File filter for images (JPG, PNG, WebP)
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Only images (JPEG, JPG, PNG, WebP) are allowed'));
};

// Upload middleware for images
export const uploadImage = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: imageFileFilter
});

// Default export for backward compatibility
export default uploadPaperPDF;
