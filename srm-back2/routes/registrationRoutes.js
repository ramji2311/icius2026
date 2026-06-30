import express from 'express';
import multer from 'multer';
import { verifyJWT } from '../middleware/auth.js';
import { uploadPdfToCloudinary } from '../config/cloudinary-pdf.js';
import PaymentRegistration from '../models/PaymentRegistration.js';
import { getPagination, formatPaginatedResponse } from '../utils/pagination.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only for payment screenshots
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for payment screenshots'), false);
    }
  }
});

// Get pre-fill details for registration
router.get('/prefill-details', verifyJWT, async (req, res) => {
  try {
    const { User } = await import('../models/User.js');
    const user = await User.findById(req.user.userId).lean();
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return profile details if they exist
    const details = {
      institution: user.institution || '',
      address: user.address || '',
      country: user.country || '',
      userType: user.userType || ''
    };

    // If some details are missing, try to fetch from the most recent registration
    if (!details.institution || !details.address || !details.country) {
      const lastReg = await PaymentRegistration.findOne({ 
        authorEmail: { $regex: new RegExp(`^${req.user.email}$`, 'i') } 
      }).sort({ createdAt: -1 }).lean();

      if (lastReg) {
        if (!details.institution) details.institution = lastReg.institution;
        if (!details.address) details.address = lastReg.address;
        if (!details.country) details.country = lastReg.country;
      } else {
        // Also check listener registration
        const { default: ListenerRegistration } = await import('../models/ListenerRegistration.js');
        const lastListenerReg = await ListenerRegistration.findOne({ 
          userId: req.user.userId 
        }).sort({ createdAt: -1 }).lean();

        if (lastListenerReg) {
          if (!details.institution) details.institution = lastListenerReg.institution;
          if (!details.address) details.address = lastListenerReg.address;
          if (!details.country) details.country = lastListenerReg.country;
        }
      }
    }

    res.json({
      success: true,
      details
    });
  } catch (error) {
    console.error('Error fetching pre-fill details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pre-fill details' });
  }
});

// Get author's available papers for registration
router.get('/accepted-papers', verifyJWT, async (req, res) => {
  try {
    const { PaperSubmission } = await import('../models/Paper.js');
    const { FinalAcceptance } = await import('../models/FinalAcceptance.js');
    
    const userEmail = req.user.email;
    
    // Get all papers submitted by this author
    const allPapers = await PaperSubmission.find({ 
      email: { $regex: new RegExp(`^${userEmail}$`, 'i') } 
    }).lean();

    // Get all successful/pending registrations for this author
    const registrations = await PaymentRegistration.find({
      authorEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') },
      paymentStatus: { $in: ['pending', 'verified'] }
    }).lean();

    // Flatten all registered paper IDs
    const registeredPaperIds = new Set();
    registrations.forEach(reg => {
      if (reg.papers && Array.isArray(reg.papers)) {
        reg.papers.forEach(p => registeredPaperIds.add(p.submissionId));
      }
      // Legacy support for single paper registration
      if (reg.submissionId) registeredPaperIds.add(reg.submissionId);
    });

    // Map papers with their status and payment info
    const papers = allPapers.map(paper => {
      const isPaid = registeredPaperIds.has(paper.submissionId);
      let paymentStatus = 'unpaid';
      
      if (isPaid) {
        const reg = registrations.find(r => 
          (r.submissionId === paper.submissionId) || 
          (r.papers && r.papers.some(p => p.submissionId === paper.submissionId))
        );
        paymentStatus = reg ? reg.paymentStatus : 'paid';
      }

      return {
        submissionId: paper.submissionId,
        paperTitle: paper.paperTitle,
        status: paper.status,
        category: paper.category,
        isAccepted: paper.status === 'Accepted' || paper.status === 'Published',
        paymentStatus: paymentStatus,
        createdAt: paper.createdAt
      };
    });
    
    res.json({
      success: true,
      papers: papers
    });
  } catch (error) {
    console.error('Error fetching accepted papers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available papers'
    });
  }
});

// Submit author registration
router.post('/submit', verifyJWT, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const {
      selectedPapers,
      institution,
      address,
      country,
      paymentMethod,
      transactionId,
      registrationCategory,
      amount,
      paperCount
    } = req.body;
    
    const userEmail = req.user.email;
    const userName = req.user.username || req.user.name;
    
    // Parse selected papers array
    let papersArray = [];
    try {
      papersArray = typeof selectedPapers === 'string' ? JSON.parse(selectedPapers) : selectedPapers;
      if (!Array.isArray(papersArray)) papersArray = [papersArray];
    } catch (e) {
      papersArray = Array.isArray(selectedPapers) ? selectedPapers : [selectedPapers];
    }
    
    if (papersArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one paper for registration'
      });
    }

    // Check if any of these papers already have a pending or verified registration
    const existingRegistration = await PaymentRegistration.findOne({
      authorEmail: userEmail,
      paymentStatus: { $in: ['pending', 'verified'] },
      $or: [
        { submissionId: { $in: papersArray } },
        { "papers.submissionId": { $in: papersArray } }
      ]
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected papers already have a pending or verified registration.'
      });
    }
    
    // Upload payment screenshot to Cloudinary
    let paymentScreenshotUrl = '';
    let paymentScreenshotPublicId = '';
    
    if (req.file) {
      try {
        const uploadResult = await uploadPdfToCloudinary(req.file.buffer, `payment-${Date.now()}-${req.file.originalname}`);
        paymentScreenshotUrl = uploadResult.url;
        paymentScreenshotPublicId = uploadResult.publicId;
      } catch (uploadError) {
        console.error('Error uploading payment screenshot:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload payment screenshot'
        });
      }
    }
    
    // Create payment registration record
    const paymentRegistration = new PaymentRegistration({
      authorEmail: userEmail,
      authorName: userName,
      institution,
      address,
      country,
      paymentMethod,
      transactionId,
      amount: parseFloat(amount),
      registrationCategory,
      paymentScreenshot: paymentScreenshotUrl,
      paymentScreenshotPublicId: paymentScreenshotPublicId,
      paymentStatus: 'pending', // Will be verified by admin
      papers: papersArray.map(paperId => ({
        submissionId: paperId,
        paperTitle: '', // Will be populated if needed
        paperUrl: '',
        amountPaid: parseFloat(amount) / paperCount // Distribute amount across papers
      }))
    });
    
    await paymentRegistration.save();

    // Update User profile with these details if they exist
    try {
      const { User } = await import('../models/User.js');
      await User.findByIdAndUpdate(req.user.userId, {
        institution: institution || undefined,
        address: address || undefined,
        country: country || undefined
      });
      console.log(`👤 Updated User profile details for ${req.user.email}`);
    } catch (userUpdateError) {
      console.error('Error updating user profile during registration:', userUpdateError);
      // Don't fail the registration if profile update fails
    }

    // Update FinalAcceptance records
    const { FinalAcceptance } = await import('../models/FinalAcceptance.js');
    await FinalAcceptance.updateMany(
      { submissionId: { $in: papersArray } },
      { 
        paymentStatus: 'paid',
        paymentRegistrationId: paymentRegistration._id
      }
    );
    
    res.json({
      success: true,
      message: 'Registration submitted successfully. Your payment will be verified by the admin.',
      registrationId: paymentRegistration._id
    });
    
  } catch (error) {
    console.error('Registration submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit registration'
    });
  }
});

// Get registration status for author
router.get('/status', verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { page, limit, skip } = getPagination(req.query);
    
    const [total, registrations] = await Promise.all([
      PaymentRegistration.countDocuments({ authorEmail: userEmail }),
      PaymentRegistration.find({ authorEmail: userEmail })
        .sort({ createdAt: -1 })
        .select('registrationNumber paymentStatus amount registrationCategory createdAt verifiedAt')
        .skip(skip)
        .limit(limit)
        .lean()
    ]);
    
    res.json(formatPaginatedResponse(registrations, total, page, limit));
  } catch (error) {
    console.error('Error fetching registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration status'
    });
  }
});

export default router;
