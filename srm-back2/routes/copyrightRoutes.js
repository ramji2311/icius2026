import express from 'express';
import {
    getAuthorCopyrightDashboard,
    uploadCopyrightForm,
    sendCopyrightMessage,
    getAllCopyrightForms,
    reviewCopyrightForm,
    uploadCameraReady,
    markCopyrightMessagesAsRead,
    updatePaymentStatusByAdmin,
    sendCameraReadyEmail
} from '../controllers/copyrightController.js';
import { verifyJWT } from '../middleware/auth.js';
import { uploadReviewFile } from '../middleware/upload.js';

const router = express.Router();

// Author Routes
router.get('/author/dashboard', verifyJWT, getAuthorCopyrightDashboard);
router.post('/author/upload', verifyJWT, uploadReviewFile.single('file'), uploadCopyrightForm);
router.post('/author/upload-camera-ready', verifyJWT, uploadReviewFile.single('cameraReadyPdf'), uploadCameraReady);
router.post('/message', verifyJWT, sendCopyrightMessage);
router.post('/mark-read', verifyJWT, markCopyrightMessagesAsRead);

// Admin Routes
router.get('/admin/list', verifyJWT, (req, res, next) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    next();
}, getAllCopyrightForms);

router.post('/admin/review', verifyJWT, (req, res, next) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    next();
}, reviewCopyrightForm);

router.post('/admin/update-payment-status-manual', verifyJWT, (req, res, next) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    next();
}, updatePaymentStatusByAdmin);

router.post('/admin/send-camera-ready-email', verifyJWT, (req, res, next) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    next();
}, sendCameraReadyEmail);

export default router;
