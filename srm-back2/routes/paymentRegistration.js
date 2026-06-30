import express from 'express';
import PaymentRegistration from '../models/PaymentRegistration.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import { PaperSubmission } from '../models/Paper.js';
import { verifyJWT, adminMiddleware } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for payment screenshots'), false);
        }
    }
});

const router = express.Router();

 // Get pre-fill details for registration
router.get('/prefill-details', verifyJWT, async (req, res) => {
    try {
        const { User } = await import('../models/User.js');
        const user = await User.findById(req.user.userId).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const details = {
            institution: user.institution || '',
            address: user.address || '',
            country: user.country || '',
            userType: user.userType || ''
        };

        if (!details.institution || !details.address || !details.country) {
            const lastReg = await PaymentRegistration.findOne({
                authorEmail: { $regex: new RegExp(`^${req.user.email}$`, 'i') }
            }).sort({ createdAt: -1 }).lean();

            if (lastReg) {
                if (!details.institution) details.institution = lastReg.institution;
                if (!details.address) details.address = lastReg.address;
                if (!details.country) details.country = lastReg.country;
            } else {
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

        res.json({ success: true, details });
    } catch (error) {
        console.error('Error fetching pre-fill details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pre-fill details' });
    }
});

// Get author's available papers for registration (v2)
router.get('/accepted-papers', verifyJWT, async (req, res) => {
    try {
        const { PaperSubmission } = await import('../models/Paper.js');
        const userEmail = req.user.email;

        const allPapers = await PaperSubmission.find({
            email: { $regex: new RegExp(`^${userEmail}$`, 'i') }
        }).lean();

        const registrations = await PaymentRegistration.find({
            authorEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') },
            paymentStatus: { $in: ['pending', 'verified'] }
        }).lean();

        const registeredPaperIds = new Set();
        registrations.forEach(reg => {
            if (reg.papers && Array.isArray(reg.papers)) {
                reg.papers.forEach(p => registeredPaperIds.add(p.submissionId));
            }
            if (reg.submissionId) registeredPaperIds.add(reg.submissionId);
        });

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

        res.json({ success: true, papers });
    } catch (error) {
        console.error('Error fetching accepted papers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch available papers' });
    }
});

// Submit Payment Registration
router.post('/submit', verifyJWT, upload.single('paymentScreenshot'), async (req, res) => {
    try {
        let {
            paymentMethod,
            paymentSubMethod,
            transactionId,
            amount,
            currency,
            currencySymbol,
            country,
            paymentScreenshot, // If coming as base64 string
            registrationCategory,
            submissionId,
            submissionIds,
            selectedPapers, // From registrationRoutes.js
            institution,
            address
        } = req.body;

        // Support for multipart/form-data fields from registrationRoutes.js
        if (!submissionIds && selectedPapers) {
            try {
                submissionIds = typeof selectedPapers === 'string' ? JSON.parse(selectedPapers) : selectedPapers;
            } catch (e) {
                submissionIds = Array.isArray(selectedPapers) ? selectedPapers : [selectedPapers];
            }
        }

        const userEmail = req.user.email;

        console.log('📝 Payment registration submission received:', {
            email: userEmail,
            submissionIds: submissionIds || submissionId || selectedPapers,
            paymentMethod,
            amount,
            registrationCategory
        });

        // Find the specific accepted papers
        const idsToFetch = Array.isArray(submissionIds) ? submissionIds : (submissionId ? [submissionId] : []);
        
        if (idsToFetch.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No accepted paper IDs provided for registration.'
            });
        }

        const acceptedPapers = await FinalAcceptance.find({ 
            authorEmail: userEmail,
            submissionId: { $in: idsToFetch }
        });

        if (acceptedPapers.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Accepted papers not found for IDs: ${idsToFetch.join(', ')}`
            });
        }

        const mainPaper = acceptedPapers[0];

        // Validate required fields
        if (!paymentMethod || !amount || !registrationCategory || !country) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: paymentMethod, amount, registrationCategory, country'
            });
        }

        // Validate payment screenshot for bank transfer
        if (paymentMethod === 'bank-transfer' && !paymentScreenshot && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Payment screenshot is required for bank transfer'
            });
        }

        // Check if user has already registered for ANY of these specific papers (only pending or verified)
        const existingRegistration = await PaymentRegistration.findOne({
            authorEmail: userEmail,
            paymentStatus: { $in: ['pending', 'verified'] },
            $or: [
                { submissionId: { $in: idsToFetch } },
                { "papers.submissionId": { $in: idsToFetch } }
            ]
        });
        
        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'One or more selected papers already have a pending or verified registration.',
                existingRegistration: {
                    paymentStatus: existingRegistration.paymentStatus,
                    registrationDate: existingRegistration.registrationDate
                }
            });
        }

        // Upload screenshot to Cloudinary
        let screenshotUrl = '';
        let screenshotPublicId = '';

        const screenshotData = req.file ? req.file.buffer : (paymentScreenshot || null);

        if (screenshotData) {
            try {
                console.log('📤 Uploading payment screenshot to Cloudinary...');

                // Check if screenshotData is a buffer (from multer) or a string (base64)
                let uploadPromise;
                if (Buffer.isBuffer(screenshotData)) {
                    // Use a stream or temp file for buffer
                    const { uploadPdfToCloudinary } = await import('../config/cloudinary-pdf.js');
                    const uploadResult = await uploadPdfToCloudinary(screenshotData, `payment-${Date.now()}`);
                    screenshotUrl = uploadResult.url;
                    screenshotPublicId = uploadResult.publicId;
                } else {
                    const uploadResult = await cloudinary.uploader.upload(screenshotData, {
                        folder: 'payment-screenshots',
                        resource_type: 'image',
                        transformation: [
                            { width: 1000, height: 1000, crop: 'limit' },
                            { quality: 'auto:good' }
                        ]
                    });
                    screenshotUrl = uploadResult.secure_url;
                    screenshotPublicId = uploadResult.public_id;
                }

                console.log(' Screenshot uploaded to Cloudinary:', screenshotPublicId);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload payment screenshot',
                    error: uploadError.message
                });
            }
        }

        const paymentRegistration = new PaymentRegistration({
            userId: req.user?.userId,
            authorEmail: mainPaper.authorEmail,
            authorName: mainPaper.authorName,
            // Main paper fields (compat)
            paperId: mainPaper._id,
            submissionId: mainPaper.submissionId,
            paperTitle: mainPaper.paperTitle,
            paperUrl: mainPaper.pdfUrl || mainPaper.revisionPdfs?.cleanPdfUrl || '',
            // Multiple papers array
            papers: acceptedPapers.map(p => ({
                paperId: p._id,
                submissionId: p.submissionId,
                paperTitle: p.paperTitle,
                paperUrl: p.pdfUrl || p.revisionPdfs?.cleanPdfUrl || ''
            })),
            institution: institution || 'To be updated',
            address: address || 'To be updated',
            country: country || 'Not specified',
            paymentMethod: paymentSubMethod || paymentMethod,
            transactionId,
            amount,
            currency: currency || 'USD',
            paymentScreenshot: screenshotUrl,
            paymentScreenshotPublicId: screenshotPublicId,
            registrationCategory,
            paymentStatus: 'pending'
        });

        await paymentRegistration.save();

        // Update User profile with these details
        try {
            const { User } = await import('../models/User.js');
            await User.findByIdAndUpdate(req.user.userId, {
                institution: institution || undefined,
                address: address || undefined,
                country: country || undefined
            });
            console.log(`👤 Updated User profile details for ${userEmail}`);
        } catch (userUpdateError) {
            console.error('Error updating user profile during registration:', userUpdateError);
        }

        // Update all selected FinalAcceptance records
        await FinalAcceptance.updateMany(
            { _id: { $in: acceptedPapers.map(p => p._id) } },
            { 
                paymentStatus: 'paid',
                paymentRegistrationId: paymentRegistration._id
            }
        );

        console.log(' Payment registration created:', {
            id: paymentRegistration._id,
            amount: paymentRegistration.amount,
            currency: paymentRegistration.currency,
            country: paymentRegistration.country
        });

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully! Please wait for admin verification.',
            registration: {
                id: paymentRegistration._id,
                paymentStatus: paymentRegistration.paymentStatus,
                registrationDate: paymentRegistration.registrationDate,
                authorName: paymentRegistration.authorName,
                paperTitle: paymentRegistration.paperTitle,
                papersCount: paymentRegistration.papers?.length || 1
            }
        });

    } catch (error) {
        console.error('❌ Error submitting payment registration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit registration',
            error: error.message
        });
    }
});

// Get My Registration Status
router.get('/my-registration', verifyJWT, async (req, res) => {
    try {
        const userEmail = req.user.email;

        const registrations = await PaymentRegistration.find({ authorEmail: userEmail })
            .sort({ createdAt: -1 });

        if (!registrations || registrations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registration found'
            });
        }

        const mappedRegistrations = registrations.map(reg => ({
            id: reg._id,
            authorName: reg.authorName,
            paperTitle: reg.paperTitle,
            submissionId: reg.submissionId,
            institution: reg.institution,
            paymentMethod: reg.paymentMethod,
            transactionId: reg.transactionId,
            amount: reg.amount,
            currency: reg.currency || 'INR',
            paymentStatus: reg.paymentStatus,
            registrationDate: reg.registrationDate,
            verifiedAt: reg.verifiedAt,
            verificationNotes: reg.verificationNotes,
            rejectionReason: reg.rejectionReason,
            registrationType: reg.registrationType || 'Author',
            papers: reg.papers || []
        }));

        res.json({
            success: true,
            registrations: mappedRegistrations,
            registration: mappedRegistrations[0] // Keep for backward compatibility
        });

    } catch (error) {
        console.error('❌ Error fetching registration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registration',
            error: error.message
        });
    }
});

// Get registration status for author (v2 with pagination)
router.get('/status', verifyJWT, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { getPagination, formatPaginatedResponse } = await import('../utils/pagination.js');
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

// Get User's Accepted Paper Details (for auto-filling registration)
// Checks both FinalAcceptance and PaperSubmission collections
router.get('/my-paper-details', verifyJWT, async (req, res) => {
    try {
        const userEmail = req.user.email;

        console.log('🔍 Searching for accepted paper for email:', userEmail);

        // Fetch user profile data (userType and country)
        const { User } = await import('../models/User.js');
        const user = await User.findOne({ email: userEmail }).select('userType country');

        const userProfile = {
            userType: user?.userType || null,
            country: user?.country || null
        };

        console.log('👤 User profile data:', userProfile);

        // Fetch all accepted papers from FinalAcceptance (migrated papers)
        const acceptedPapers = await FinalAcceptance.find({
            authorEmail: userEmail
        }).sort({ acceptanceDate: -1 });

        // Also check PaperSubmission for accepted papers that might not be in FinalAcceptance yet
        const submittedPapers = await PaperSubmission.find({
            email: userEmail,
            status: 'Accepted'
        }).sort({ updatedAt: -1 });

        // Combine and de-duplicate by submissionId
        const paperMap = new Map();

        acceptedPapers.forEach(p => {
            paperMap.set(p.submissionId, {
                submissionId: p.submissionId,
                paperTitle: p.paperTitle,
                authorName: p.authorName,
                authorEmail: p.authorEmail,
                category: p.category || 'General',
                acceptanceDate: p.acceptanceDate,
                paymentStatus: 'pending',
                source: 'FinalAcceptance'
            });
        });

        submittedPapers.forEach(p => {
            if (!paperMap.has(p.submissionId)) {
                paperMap.set(p.submissionId, {
                    submissionId: p.submissionId,
                    paperTitle: p.paperTitle,
                    authorName: p.authorName,
                    authorEmail: p.email,
                    category: p.category || 'General',
                    acceptanceDate: p.updatedAt,
                    paymentStatus: 'pending',
                    source: 'PaperSubmission'
                });
            }
        });

        const allPapers = Array.from(paperMap.values());

        if (allPapers.length > 0) {
            console.log(` Found ${allPapers.length} accepted papers for user:`, userEmail);

            return res.json({
                success: true,
                papers: allPapers,
                paperDetails: allPapers[0], // Keep for backward compatibility
                userProfile
            });
        }

        // No accepted paper found
        console.log('❌ No accepted paper found for user:', userEmail);

        return res.status(404).json({
            success: false,
            message: 'No accepted paper found for this user'
        });

        // No accepted paper found
        console.log('❌ No accepted paper found for user:', userEmail);

        return res.status(404).json({
            success: false,
            message: 'No accepted paper found for this user'
        });

    } catch (error) {
        console.error('❌ Error fetching paper details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch paper details',
            error: error.message
        });
    }
});

// ADMIN ROUTES

// Get All Pending Registrations (Admin Only)
router.get('/admin/pending', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const pendingRegistrations = await PaymentRegistration.find({ paymentStatus: 'pending' })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pendingRegistrations.length,
            registrations: pendingRegistrations
        });

    } catch (error) {
        console.error('❌ Error fetching pending registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending registrations',
            error: error.message
        });
    }
});

// Get All Registrations (Admin Only)
router.get('/admin/all', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.query;

        const query = status ? { paymentStatus: status } : {};
        const registrations = await PaymentRegistration.find(query)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error('❌ Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
            error: error.message
        });
    }
});

// Verify Payment (Admin Only)
router.put('/admin/:id/verify', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationNotes, paperAmounts } = req.body;

        const registration = await PaymentRegistration.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Check if already verified
        if (registration.paymentStatus === 'verified') {
            return res.status(400).json({
                success: false,
                message: 'Payment already verified'
            });
        }

        const papersList = (registration.papers && registration.papers.length > 0)
            ? registration.papers.map((p) => ({
                paperId: p.paperId,
                submissionId: p.submissionId,
                paperTitle: p.paperTitle,
                paperUrl: p.paperUrl
            }))
            : [{
                paperId: registration.paperId,
                submissionId: registration.submissionId,
                paperTitle: registration.paperTitle,
                paperUrl: registration.paperUrl
            }];

        if (!paperAmounts || !Array.isArray(paperAmounts) || paperAmounts.length !== papersList.length) {
            return res.status(400).json({
                success: false,
                message: `Enter amount paid for each paper (${papersList.length} paper(s) in this registration).`
            });
        }

        const amountBySubmissionId = new Map();
        for (const row of paperAmounts) {
            const sid = row.submissionId != null ? String(row.submissionId).trim() : '';
            const amt = Number(row.amount);
            if (!sid) {
                return res.status(400).json({ success: false, message: 'Each paperAmounts entry needs submissionId' });
            }
            if (!Number.isFinite(amt) || amt < 0) {
                return res.status(400).json({ success: false, message: `Invalid amount for submission ${sid}` });
            }
            amountBySubmissionId.set(sid, amt);
        }

        let verifiedTotal = 0;
        for (const p of papersList) {
            const sid = p.submissionId != null ? String(p.submissionId).trim() : '';
            if (!amountBySubmissionId.has(sid)) {
                return res.status(400).json({
                    success: false,
                    message: `Missing amount for submission ${sid || '(unknown)'}`
                });
            }
            verifiedTotal += amountBySubmissionId.get(sid);
        }

        if (registration.papers && registration.papers.length > 0) {
            for (const p of registration.papers) {
                const sid = p.submissionId != null ? String(p.submissionId).trim() : '';
                p.amountPaid = amountBySubmissionId.get(sid);
            }
            registration.markModified('papers');
        } else {
            registration.papers = papersList.map((p) => ({
                paperId: p.paperId,
                submissionId: p.submissionId,
                paperTitle: p.paperTitle,
                paperUrl: p.paperUrl || '',
                amountPaid: amountBySubmissionId.get(String(p.submissionId).trim())
            }));
        }

        registration.verifiedAmount = verifiedTotal;
        registration.paymentStatus = 'verified';
        registration.verifiedBy = req.user.userId;
        registration.verifiedAt = new Date();
        registration.verificationNotes = verificationNotes || 'Payment verified by admin';
        await registration.save();

        const paperIds = papersList.map(p => p.paperId).filter(pid => pid);
        if (paperIds.length > 0) {
            await FinalAcceptance.updateMany(
                { _id: { $in: paperIds } },
                { paymentStatus: 'verified' }
            );
        }

        const { PaymentDoneFinalUser } = await import('../models/PaymentDoneFinalUser.js');
        const { sendRegistrationConfirmationEmail } = await import('../utils/emailService.js');
        const createdFinalUsers = [];

        for (const paper of papersList) {
            const sid = paper.submissionId != null ? String(paper.submissionId).trim() : '';
            const paperAmount = amountBySubmissionId.get(sid) ?? 0;
            const finalUser = new PaymentDoneFinalUser({
                userId: registration.userId,
                authorEmail: registration.authorEmail,
                authorName: registration.authorName,
                paperId: paper.paperId,
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                paperUrl: paper.paperUrl || '',
                institution: registration.institution,
                address: registration.address,
                country: registration.country,
                paymentMethod: registration.paymentMethod,
                transactionId: registration.transactionId,
                amount: paperAmount,
                currency: registration.currency,
                paymentRegistrationId: registration._id,
                registrationCategory: registration.registrationCategory,
                verifiedBy: req.user.userId,
                verifiedByName: req.user.username || 'Admin',
                verifiedByEmail: req.user.email,
                verifiedAt: new Date(),
                verificationNotes: registration.verificationNotes,
                registrationDate: registration.registrationDate
            });

            await finalUser.save();
            createdFinalUsers.push(finalUser);

            try {
                await sendRegistrationConfirmationEmail({
                    authorEmail: finalUser.authorEmail,
                    authorName: finalUser.authorName,
                    paperTitle: finalUser.paperTitle,
                    submissionId: finalUser.submissionId,
                    registrationNumber: finalUser.registrationNumber,
                    registrationCategory: finalUser.registrationCategory,
                    amount: paperAmount,
                    currency: finalUser.currency
                });
            } catch (emailError) {
                console.error(`⚠️ Email failed for paper ${paper.submissionId}:`, emailError);
            }
        }

        console.log(' Payment verified and final user(s) created:', {
            registrationId: id,
            finalUsersCount: createdFinalUsers.length,
            finalUserIds: createdFinalUsers.map(u => u._id),
            registrationNumbers: createdFinalUsers.map(u => u.registrationNumber)
        });

        res.json({
            success: true,
            message: `Payment verified successfully! ${createdFinalUsers.length} paper(s) registered.`,
            registration,
            finalUsers: createdFinalUsers.map(u => ({
                id: u._id,
                registrationNumber: u.registrationNumber,
                authorName: u.authorName,
                submissionId: u.submissionId
            }))
        });

    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        if (error.name === 'ValidationError') {
            console.error('🔍 Validation Errors:', Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`));
            return res.status(400).json({
                success: false,
                message: 'Data validation failed during verification',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
});

// Reject Payment (Admin Only)
router.put('/admin/:id/reject', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const registration = await PaymentRegistration.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Store registration details before deletion for email
        const registrationDetails = {
            authorEmail: registration.authorEmail,
            authorName: registration.authorName,
            paperTitle: registration.paperTitle,
            submissionId: registration.submissionId,
            amount: registration.amount,
            transactionId: registration.transactionId,
            rejectionReason
        };

        // Update FinalAcceptance for all linked papers
        if (registration.papers && registration.papers.length > 0) {
            const submissionIds = registration.papers.map(p => p.submissionId);
            await FinalAcceptance.updateMany(
                { submissionId: { $in: submissionIds } },
                { paymentStatus: 'pending' }
            );
        } else if (registration.paperId) {
            await FinalAcceptance.findByIdAndUpdate(registration.paperId, {
                paymentStatus: 'pending'
            });
        }

        // Delete the cloudinary screenshot if exists
        if (registration.paymentScreenshotPublicId) {
            try {
                await cloudinary.uploader.destroy(registration.paymentScreenshotPublicId);
                console.log('🗑️ Cloudinary screenshot deleted:', registration.paymentScreenshotPublicId);
            } catch (cloudinaryError) {
                console.error('⚠️ Failed to delete cloudinary screenshot:', cloudinaryError);
            }
        }

        // Delete the registration from database
        await PaymentRegistration.findByIdAndDelete(id);

        // Send rejection email to author
        try {
            const { sendPaymentRejectionEmail } = await import('../utils/emailService.js');
            const paperTitles = registration.papers && registration.papers.length > 0 
                ? registration.papers.map(p => p.paperTitle).join(', ')
                : registration.paperTitle;
            const submissionIds = registration.papers && registration.papers.length > 0
                ? registration.papers.map(p => p.submissionId).join(', ')
                : registration.submissionId;

            await sendPaymentRejectionEmail({
                authorEmail: registrationDetails.authorEmail,
                authorName: registrationDetails.authorName,
                paperTitle: paperTitles,
                submissionId: submissionIds,
                rejectionReason: registrationDetails.rejectionReason,
                amount: registrationDetails.amount,
                transactionId: registrationDetails.transactionId,
                registrationType: 'author'
            });
            console.log(' Payment rejection email sent to:', registrationDetails.authorEmail);
        } catch (emailError) {
            console.error('⚠️ Failed to send rejection email:', emailError);
            // Don't fail the rejection if email fails
        }

        console.log('❌ Payment rejected and deleted for registration:', id);

        res.json({
            success: true,
            message: 'Payment rejected and registration removed. User has been notified to resubmit payment.',
            deletedRegistration: {
                authorEmail: registrationDetails.authorEmail,
                authorName: registrationDetails.authorName,
                rejectionReason: registrationDetails.rejectionReason
            }
        });

    } catch (error) {
        console.error('❌ Error rejecting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject payment',
            error: error.message
        });
    }
});

// DEBUG ENDPOINT: Check all accepted papers in database
router.get('/debug/all-papers', async (req, res) => {
    try {
        const allPapers = await FinalAcceptance.find({}).select('submissionId authorName authorEmail paperTitle acceptanceDate');
        res.json({
            success: true,
            totalPapers: allPapers.length,
            papers: allPapers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DEBUG ENDPOINT: Create test accepted paper for user
router.post('/debug/create-test-paper', async (req, res) => {
    try {
        // First create a test paper
        const testPaper = new PaperSubmission({
            submissionId: 'TEST-' + Date.now(),
            paperTitle: 'Test Paper for Registration',
            authorName: 'Test Author',
            email: 'icius2026@isius.org',
            category: 'STEM',
            abstract: 'Test abstract',
            status: 'Accepted',
            pdfUrl: 'https://example.com/test.pdf'
        });

        const savedPaper = await testPaper.save();

        // Now create FinalAcceptance record
        const finalAcceptance = new FinalAcceptance({
            paperId: savedPaper._id,
            submissionId: savedPaper.submissionId,
            paperTitle: savedPaper.paperTitle,
            authorName: savedPaper.authorName,
            authorEmail: savedPaper.email,
            category: savedPaper.category,
            pdfUrl: 'https://example.com/test.pdf',
            acceptanceDate: new Date(),
            paymentStatus: 'pending',
            status: 'Accepted'
        });

        const savedAcceptance = await finalAcceptance.save();

        res.json({
            success: true,
            message: 'Test paper created successfully',
            paper: savedAcceptance
        });
    } catch (error) {
        console.error('Error creating test paper:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
