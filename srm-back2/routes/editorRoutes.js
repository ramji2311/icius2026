import express from 'express';
import {
    verifyEditorAccess,
    getAssignedPapers,
    createReviewer,
    getAllReviewers,
    assignReviewers,
    getPaperReviews,
    makeFinalDecision,
    getEditorDashboardStats,
    getAllPapers,
    getPdfBase64,
    getReviewerDetails,
    sendMessage,
    getMessageThread,
    getPaperMessages,
    getAllMessages,
    getNonRespondingReviewers,
    sendReviewerReminder,
    sendBulkReminders,
    getAllPdfs,
    deletePdf,
    sendMessageToReviewer,
    sendMessageToAuthor,
    requestRevision,
    acceptPaper,
    rejectPaper,
    getRevisionStatus,
    submitRevisedPaper,
    removeReviewerFromPaper,
    sendReviewerInquiry,
    sendReReviewEmails,
    deleteReview,
    updateReview,
    getPaperReReviews,
    updateReviewerDetails,
    deleteReviewerFromSystem,
    getAllAcceptedPapers,
    getAcceptedPapersByCategory,
    getAcceptedPapersByAuthor,
    getHighRatedPapers,
    getAcceptedPaperDetails,
    getAcceptanceStatistics,
    updateAcceptanceStatus
} from '../controllers/editorController.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireEditor } from '../middleware/roleCheck.js';
import { cacheMiddleware, invalidateEntityCache } from '../middleware/cache.js';

const router = express.Router();

// All editor routes require authentication and editor role
router.use(verifyJWT, requireEditor);

// Verify editor access
router.get('/verify-access', verifyEditorAccess);

// Paper management
router.get('/papers', cacheMiddleware(300), getAllPapers);              // Get ALL papers (not just assigned)
router.get('/pdf/:submissionId', getPdfBase64);  // Get PDF as base64 (usually better not to cache base64 in Redis)
router.get('/papers/:paperId/reviews', cacheMiddleware(300), getPaperReviews);

// Reviewer management
router.post('/reviewers', async (req, res, next) => {
    await invalidateEntityCache('editor');
    createReviewer(req, res, next);
});
router.get('/reviewers', cacheMiddleware(300), getAllReviewers);
router.put('/reviewers/:reviewerId', async (req, res, next) => {
    await invalidateEntityCache('editor');
    updateReviewerDetails(req, res, next);
});
router.delete('/reviewers/:reviewerId', async (req, res, next) => {
    await invalidateEntityCache('editor');
    deleteReviewerFromSystem(req, res, next);
});
router.post('/assign-reviewers', async (req, res, next) => {
    await invalidateEntityCache('paper');
    assignReviewers(req, res, next);
});
router.post('/remove-reviewer', async (req, res, next) => {
    await invalidateEntityCache('paper');
    removeReviewerFromPaper(req, res, next);
});
router.post('/send-reviewer-inquiry', sendReviewerInquiry);

// Reviewer details and messaging
router.get('/review/:reviewId', getReviewerDetails);
router.get('/messages', getAllMessages);
router.get('/papers/:paperId/messages', getPaperMessages);
router.get('/messages/:submissionId/:reviewId', getMessageThread);
router.post('/send-message', sendMessage);
router.post('/send-message-to-reviewer', sendMessageToReviewer);
router.post('/send-message-to-author', sendMessageToAuthor);

// Decision making - Revision requests use the existing requestRevision function
router.post('/make-decision', async (req, res, next) => {
    await invalidateEntityCache('paper');
    makeFinalDecision(req, res, next);
});
router.post('/request-revision', async (req, res, next) => {
    await invalidateEntityCache('paper');
    requestRevision(req, res, next);
});
router.post('/accept-paper', async (req, res, next) => {
    await invalidateEntityCache('paper');
    acceptPaper(req, res, next);
});
router.post('/reject-paper/:paperId', async (req, res, next) => {
    await invalidateEntityCache('paper');
    rejectPaper(req, res, next);
});
router.post('/send-re-review-emails', sendReReviewEmails);

// Review management - CRUD operations
router.delete('/reviews/:reviewId', async (req, res, next) => {
    await invalidateEntityCache('paper');
    deleteReview(req, res, next);
});
router.put('/reviews/:reviewId', async (req, res, next) => {
    await invalidateEntityCache('paper');
    updateReview(req, res, next);
});
router.get('/papers/:paperId/re-reviews', getPaperReReviews); // Get re-reviews (Round 2)

// Reviewer reminders
router.get('/non-responding-reviewers', getNonRespondingReviewers);
router.post('/send-reminder', sendReviewerReminder);
router.post('/send-bulk-reminders', sendBulkReminders);

// PDF Management
router.get('/pdfs', getAllPdfs);          // Get all PDFs from Cloudinary
router.delete('/pdfs', deletePdf);        // Delete PDF from Cloudinary

// Dashboard statistics
router.get('/dashboard-stats', cacheMiddleware(300, { isPrivate: true }), getEditorDashboardStats);

// ========================================
// FINAL ACCEPTANCE / ACCEPTED PAPERS MANAGEMENT
// ========================================
router.get('/accepted-papers', cacheMiddleware(300), getAllAcceptedPapers);                           // Get all accepted papers
router.get('/accepted-papers/category/:category', cacheMiddleware(300), getAcceptedPapersByCategory); // Get by category
router.get('/accepted-papers/author/:email', cacheMiddleware(300), getAcceptedPapersByAuthor);        // Get by author email
router.get('/accepted-papers/high-rated', cacheMiddleware(300), getHighRatedPapers);                  // Get high-rated papers
router.get('/accepted-papers/:submissionId', cacheMiddleware(300), getAcceptedPaperDetails);          // Get single paper details
router.get('/acceptance-statistics', cacheMiddleware(600), getAcceptanceStatistics);                  // Get statistics
router.put('/accepted-papers/:submissionId/status', updateAcceptanceStatus);    // Update status

// Selected users routes (shared with admin but role check is verified by verifyJWT + role Check)
router.get('/selected-users', (req, res, next) => {
    // We can reuse the adminController function if we export it properly
    import('../controllers/adminController.js').then(m => m.getConferenceSelectedUsers(req, res, next));
});
router.post('/selected-users/send-email', (req, res, next) => {
    import('../controllers/adminController.js').then(m => m.sendSelectedUserEmail(req, res, next));
});

export default router;
