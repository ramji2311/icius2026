import express from 'express';
import * as committeeController from '../controllers/committeeController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', committeeController.getAllMembers);
router.get('/:id', committeeController.getMemberById);

// Admin-only list (same as public for now, but secured)
router.get('/admin/all', verifyToken, isAdmin, committeeController.getAllMembers);

// Admin-only routes
router.post(
  '/',
  verifyToken,
  isAdmin,
  upload.single('image'),
  committeeController.createMember
);

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  upload.single('image'),
  committeeController.updateMember
);

router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  committeeController.deleteMember
);



export default router;
