import express from 'express';
import {
    createEditor,
    getAllEditors,
    assignEditor,
    reassignEditor,
    getAllUsers,
    getDashboardStats,
    deleteUser,
    sendMessageToEditor,
    getConferenceSelectedUsers,
    getAllPdfsAdmin,
    deletePdfAdmin,
    sendSelectedUserEmail
} from '../controllers/adminController.js';
import {
    getDbMeta,
    listDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument
} from '../controllers/adminDbController.js';
import {
    getAnalyticsSummary,
    getByInstitution,
    getAnalyticsPapers,
    exportAcceptedPapersExcel
} from '../controllers/adminAnalyticsController.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import multer from 'multer';
import { uploadPdfToCloudinary } from '../config/cloudinary-pdf.js';
import { cacheMiddleware, invalidateEntityCache } from '../middleware/cache.js';

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Basic authentication for all admin routes, roles checked per route below
router.use(verifyJWT);

// Editor management
router.post('/editors', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('editor');
  createEditor(req, res, next);
});
router.get('/editors', requireAdmin, cacheMiddleware(300), getAllEditors);
router.post('/editors/message', requireAdmin, sendMessageToEditor);

// Paper assignment
router.post('/assign-editor', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('paper');
  assignEditor(req, res, next);
});
router.post('/reassign-editor', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('paper');
  reassignEditor(req, res, next);
});

// User management
router.get('/users', requireAdmin, cacheMiddleware(300), getAllUsers);
router.delete('/users/:userId', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('user');
  deleteUser(req, res, next);
});

// Dashboard statistics
router.get('/dashboard-stats', requireAdmin, cacheMiddleware(300), getDashboardStats);

// Conference analytics (filters: category, search on institution)
router.get('/analytics/summary', requireAdmin, cacheMiddleware(600), getAnalyticsSummary);
router.get('/analytics/by-institution', requireAdmin, cacheMiddleware(600), getByInstitution);
router.get('/analytics/institution', requireAdmin, cacheMiddleware(600), getByInstitution); // Alias for backwards compatibility
router.get('/analytics/papers', requireAdmin, cacheMiddleware(600), getAnalyticsPapers);
router.get('/analytics/export-accepted-excel', requireAdmin, exportAcceptedPapersExcel);

// Conference selected users (Accessible by Editor and Admin)
import { requireEditor } from '../middleware/roleCheck.js';
router.get('/selected-users', requireEditor, getConferenceSelectedUsers);
router.post('/selected-users/send-email', requireAdmin, sendSelectedUserEmail);

// PDF Management (admin only)
router.get('/pdfs', requireAdmin, getAllPdfsAdmin);
router.delete('/pdfs', requireAdmin, deletePdfAdmin);

// Database browser (all collections CRUD — Admin only)
router.get('/db/meta', requireAdmin, getDbMeta);
router.get('/db/:collectionKey/:id', requireAdmin, getDocument);
router.get('/db/:collectionKey', requireAdmin, listDocuments);
router.post('/db/:collectionKey', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('dashboard');
  createDocument(req, res, next);
});
router.put('/db/:collectionKey/:id', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('dashboard');
  updateDocument(req, res, next);
});
router.delete('/db/:collectionKey/:id', requireAdmin, async (req, res, next) => {
  await invalidateEntityCache('dashboard');
  deleteDocument(req, res, next);
});

// Generic admin file upload (for DB editor re-upload)
router.post('/upload', requireAdmin, uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
    const result = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
    return res.json({ success: true, url: result.url, publicId: result.publicId });
  } catch (err) {
    console.error('[admin/upload]', err);
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// Note: Admin submitted papers management routes removed as multi-submission is now handled directly by authors.


export default router;
