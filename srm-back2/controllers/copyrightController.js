import { Copyright } from '../models/Copyright.js';
import { PaymentDoneFinalUser } from '../models/PaymentDoneFinalUser.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import ConferenceSelectedUser from '../models/ConferenceSelectedUser.js';
import { PaperSubmission } from '../models/Paper.js';
import PaymentRegistration from '../models/PaymentRegistration.js';
import { User } from '../models/User.js';
import {
    sendAcceptanceEmail,
    sendSelectionEmail,
    sendPaymentReminderEmail,
    sendPaperDeclinedEmail
} from '../utils/emailService.js';
import { emitToUser, emitToAdmins } from '../utils/socket.js';
import { withCache, invalidatePattern } from '../utils/cacheHelper.js';

// Controller for sending camera-ready email notification
export const sendCameraReadyEmail = async (req, res) => {
    try {
        const { copyrightId, authorEmail, authorName, paperTitle, submissionId } = req.body;

        if (!submissionId || !authorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing submissionId or authorEmail'
            });
        }

        // Determine if this is a general reminder or a payment reminder
        const isUnpaid = req.body.isUnpaid === true;

        if (isUnpaid) {
            await sendPaymentReminderEmail(authorEmail, authorName, {
                submissionId,
                paperTitle
            });
            return res.status(200).json({
                success: true,
                message: 'Payment reminder email sent successfully'
            });
        }

        // Default: Call selection email function which currently handles this final notification
        await sendSelectionEmail(authorEmail, authorName, {
            submissionId,
            paperTitle
        });

        return res.status(200).json({
            success: true,
            message: 'Notification email sent successfully'
        });
    } catch (error) {
        console.error('Error sending camera-ready email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending email',
            error: error.message
        });
    }
};

// Escape regex special characters in a string for safe use in RegExp
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Author: Get Dashboard Data
export const getAuthorCopyrightDashboard = async (req, res) => {
    const authorEmail = req.user.email;
    const cacheKey = `cache:copyright:dashboard:${authorEmail}`;
    
    const result = await withCache(
        cacheKey,
        async () => {
            try {
                const safeEmail = escapeRegex(authorEmail);

                // 1. Get all paper submissions from all possible collections
                const [mainPapers, finalAcceptedPapers] = await Promise.all([
                    PaperSubmission.find({ email: { $regex: new RegExp(`^${safeEmail}$`, 'i') } }),
                    FinalAcceptance.find({ authorEmail: { $regex: new RegExp(`^${safeEmail}$`, 'i') } })
                ]);

                console.log(`🔍 Dashboard fetch for ${authorEmail}: Found ${mainPapers.length} main, ${finalAcceptedPapers.length} final accepted.`);

                if (mainPapers.length === 0 && finalAcceptedPapers.length === 0) {
                    return {
                        success: true,
                        hasPaper: false,
                        message: "No paper submission found."
                    };
                }

                // 2. Merge and de-duplicate by submissionId using a Map
                const submissionMap = new Map();

                // Helper: merge a paper record into the map
                const mergePaper = (p, source) => {
                    const sid = p.submissionId?.toLowerCase();
                    if (!sid) return;

                    const pobj = p.toObject ? p.toObject() : { ...p };
                    pobj._source = source;

                    if (!pobj.email && pobj.authorEmail) pobj.email = pobj.authorEmail;
                    if (!pobj.authorEmail && pobj.email) pobj.authorEmail = pobj.email;

                    if (!submissionMap.has(sid)) {
                        submissionMap.set(sid, pobj);
                    } else {
                        const existing = submissionMap.get(sid);
                        if (source === 'FinalAcceptance') {
                            existing.status = pobj.status || existing.status;
                            existing.finalDecision = pobj.finalDecision || existing.finalDecision;
                        }
                        for (const key of Object.keys(pobj)) {
                            if ((existing[key] === undefined || existing[key] === null) && pobj[key] != null) {
                                existing[key] = pobj[key];
                            }
                        }
                        if (pobj.pdfUrl && source === 'FinalAcceptance') {
                            existing.pdfUrl = pobj.pdfUrl;
                        }
                    }
                };

                mainPapers.forEach(p => mergePaper(p, 'PaperSubmission'));
                finalAcceptedPapers.forEach(p => mergePaper(p, 'FinalAcceptance'));

                const allPapers = Array.from(submissionMap.values());

                // 3. Enrich papers with copyright information
                const papersWithCopyright = await Promise.all(allPapers.map(async (pobj) => {
                    const safeSid = escapeRegex(pobj.submissionId);
                    let copyright = await Copyright.findOne({
                        submissionId: { $regex: new RegExp(`^${safeSid}$`, 'i') }
                    });

                    const acceptedStatuses = ['Accepted', 'Published', 'Certificate Generated'];
                    const isAccepted = (
                        acceptedStatuses.includes(pobj.status) ||
                        pobj.finalDecision === 'Accept'
                    );

                    if (!copyright && isAccepted) {
                        try {
                            copyright = await Copyright.create({
                                paperId: pobj._id,
                                submissionId: pobj.submissionId,
                                authorEmail: authorEmail,
                                authorName: pobj.authorName || 'Author',
                                paperTitle: pobj.paperTitle || 'Untitled Paper',
                                status: 'Pending'
                            });
                        } catch (err) {
                            if (err.code === 11000) {
                                copyright = await Copyright.findOne({
                                    submissionId: { $regex: new RegExp(`^${safeSid}$`, 'i') }
                                });
                            }
                        }
                    }

                    return { ...pobj, copyright: copyright ? (copyright.toObject ? copyright.toObject() : copyright) : null };
                }));

                // Sort: Accepted papers first, then by date
                papersWithCopyright.sort((a, b) => {
                    const acceptedStatuses = ['Accepted', 'Published', 'Certificate Generated'];
                    const aIsAccepted = acceptedStatuses.includes(a.status) || a.finalDecision === 'Accept';
                    const bIsAccepted = acceptedStatuses.includes(b.status) || b.finalDecision === 'Accept';
                    if (aIsAccepted && !bIsAccepted) return -1;
                    if (!aIsAccepted && bIsAccepted) return 1;
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });

                // 4. Calculate notifications summary
                const notifications = {
                    unreadMessages: 0,
                    pendingCopyrights: 0,
                    pendingCameraReady: 0,
                    totalTasks: 0
                };

                papersWithCopyright.forEach(p => {
                    const cp = p.copyright;
                    if (cp) {
                        const unread = cp.messages ? cp.messages.filter(m => m.sender === 'Admin' && !m.isReadByAuthor).length : 0;
                        p.unreadCount = unread;
                        notifications.unreadMessages += unread;

                        if (cp.status === 'Pending' || cp.status === 'Rejected') {
                            p.needsCopyright = true;
                            notifications.pendingCopyrights++;
                            notifications.totalTasks++;
                        }

                        const isAccepted = (
                            ['Accepted', 'Published', 'Certificate Generated'].includes(p.status) ||
                            p.finalDecision === 'Accept'
                        );

                        if (isAccepted && !cp.cameraReadyUrl) {
                            p.needsCameraReady = true;
                            notifications.pendingCameraReady++;
                            notifications.totalTasks++;
                        }
                    }
                });

                const payment = await PaymentDoneFinalUser.findOne({ authorEmail: { $regex: new RegExp(`^${safeEmail}$`, 'i') } });

                return {
                    success: true,
                    hasPaper: true,
                    notifications,
                    data: {
                        payment,
                        paper: papersWithCopyright[0],
                        allPapers: papersWithCopyright,
                        copyright: papersWithCopyright[0].copyright
                    }
                };
            } catch (error) {
                console.error('Error in getAuthorCopyrightDashboard callback:', error);
                return {
                    success: false,
                    message: 'Error fetching copyright dashboard',
                    error: error.message
                };
            }
        },
        600
    );

    return res.json(result);
};

// Author: Upload Copyright Form
export const uploadCopyrightForm = async (req, res) => {
    try {
        const authorEmail = req.user.email;
        let { copyrightFormUrl, copyrightFormPublicId } = req.body;

        // If a file is uploaded via multer, use it
        if (req.file) {
            const { uploadPdfToCloudinary } = await import('../config/cloudinary-pdf.js');
            try {
                const cloudinaryResult = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
                copyrightFormUrl = cloudinaryResult.url;
                copyrightFormPublicId = cloudinaryResult.publicId;
            } catch (uploadError) {
                console.error('Failed to upload Copyright to Cloudinary:', uploadError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload Copyright form to Cloudinary'
                });
            }
        }

        if (!copyrightFormUrl) {
            return res.status(400).json({
                success: false,
                message: 'Copyright form URL or file is required'
            });
        }

        const { submissionId } = req.body;

        // Find copyright by both email and submissionId to be safe
        const copyright = await Copyright.findOne({ authorEmail, submissionId });
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found for this submission'
            });
        }

        copyright.copyrightFormUrl = copyrightFormUrl;
        copyright.copyrightFormPublicId = copyrightFormPublicId;
        copyright.status = 'Submitted';
        copyright.submittedAt = new Date();
        await copyright.save();

        // Emit to Author
        emitToUser(copyright.authorEmail, 'copyright:update', {
            submissionId: copyright.submissionId,
            status: copyright.status,
            copyrightFormUrl: copyright.copyrightFormUrl
        });

        // Emit to Admins
        emitToAdmins('copyright:update', {
            submissionId: copyright.submissionId,
            authorEmail: copyright.authorEmail,
            status: copyright.status
        });

        await invalidatePattern('cache:*copyright*');

        return res.status(200).json({
            success: true,
            message: 'Copyright form uploaded successfully',
            data: copyright
        });
    } catch (error) {
        console.error('Error in uploadCopyrightForm:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading copyright form',
            error: error.message
        });
    }
};

// Author/Admin: Send Message
export const sendCopyrightMessage = async (req, res) => {
    try {
        const { copyrightId, message } = req.body;
        const senderRole = req.user.role === 'Admin' ? 'Admin' : 'Author';
        const senderId = req.user.id;

        const copyright = await Copyright.findById(copyrightId);
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found'
            });
        }

        // Check permission: Admin can message anyone, Author can only message their own
        if (senderRole === 'Author' && copyright.authorEmail !== req.user.email) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const newMessage = {
            sender: senderRole,
            senderId,
            message,
            timestamp: new Date()
        };
        copyright.messages.push(newMessage);

        await copyright.save();

        // Emit message to relevant parties
        if (senderRole === 'Admin') {
            emitToUser(copyright.authorEmail, 'copyright:message', {
                submissionId: copyright.submissionId,
                message: newMessage,
                unreadCount: copyright.messages.filter(m => m.sender === 'Admin' && !m.isReadByAuthor).length
            });
        } else { // Author
            emitToAdmins('copyright:message', {
                submissionId: copyright.submissionId,
                authorEmail: copyright.authorEmail,
                message: newMessage,
                unreadCount: copyright.messages.filter(m => m.sender === 'Author' && !m.isReadByAdmin).length
            });
        }

        await invalidatePattern('cache:*copyright*');

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: copyright.messages
        });
    } catch (error) {
        console.error('Error in sendCopyrightMessage:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// Admin: Get All Copyright Forms with Payment Info
export const getAllCopyrightForms = async (req, res) => {
    const cacheKey = 'cache:copyright:forms';
    
    const result = await withCache(
        cacheKey,
        async () => {
            try {
                // Fetch all copyright records
                const copyrights = await Copyright.find().sort({ updatedAt: -1 });
                
                // Enrich with payment information
                const enrichedCopyrights = await Promise.all(copyrights.map(async (cp) => {
                    const cpObj = cp.toObject();
                    const safeSid = escapeRegex(cp.submissionId || '');
                    const sidRegex = new RegExp(`^${safeSid}$`, 'i');
                    
                    // Try to find payment registration for this SPECIFIC submissionId (case-insensitive)
                    let payment = await PaymentRegistration.findOne({ 
                        submissionId: sidRegex
                    });
                    
                    // If and ONLY IF not found by submissionId, check by email 
                    if (!payment) {
                        const genericPayment = await PaymentRegistration.findOne({ 
                            authorEmail: cp.authorEmail?.toLowerCase(),
                            $or: [
                                { submissionId: { $exists: false } },
                                { submissionId: null },
                                { submissionId: '' }
                            ]
                        }).sort({ createdAt: -1 });
                        
                        if (genericPayment) {
                            payment = genericPayment;
                        }
                    }

                    return {
                        ...cpObj,
                        paymentStatus: payment ? payment.paymentStatus : 'pending',
                        paymentDetails: payment || null
                    };
                }));

                return {
                    success: true,
                    count: enrichedCopyrights.length,
                    data: enrichedCopyrights
                };
            } catch (error) {
                console.error('Error in getAllCopyrightForms callback:', error);
                throw error;
            }
        },
        1800 // 30 minutes TTL
    );

    return res.json(result);
};

// Admin: Review Copyright Form
export const reviewCopyrightForm = async (req, res) => {
    try {
        const { copyrightId, status, adminComment } = req.body;

        if (!['Approved', 'Rejected', 'Declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const copyright = await Copyright.findById(copyrightId);
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found'
            });
        }

        copyright.status = status;
        if (adminComment) {
            copyright.messages.push({
                sender: 'Admin',
                senderId: req.user.id,
                message: `Review: ${status}. Comment: ${adminComment}`,
                timestamp: new Date()
            });
        }

        if (status === 'Approved') {
            copyright.messages.push({
                sender: 'Admin',
                senderId: req.user.id,
                message: `Congratulations! Your copyright form has been approved. Please pay the registration amount for this paper as soon as possible to finalize your publication. If payment is not completed, your paper will not be considered for the final proceedings.`,
                timestamp: new Date()
            });
        }

        if (status === 'Declined') {
            copyright.messages.push({
                sender: 'Admin',
                senderId: req.user.id,
                message: `Your paper has been declined due to non-payment or failure to meet the final deadline. If you feel this is an error, please contact the administrators immediately.`,
                timestamp: new Date()
            });
            
            // Also send email
            try {
                await sendPaperDeclinedEmail(copyright.authorEmail, copyright.authorName, {
                    submissionId: copyright.submissionId,
                    paperTitle: copyright.paperTitle
                });
            } catch (err) {
                console.error('Error sending decline email:', err);
            }
        }

        await copyright.save();

        // Emit to Author
        emitToUser(copyright.authorEmail, 'copyright:update', {
            submissionId: copyright.submissionId,
            status: copyright.status,
            adminComment: adminComment
        });

        // Emit to Admins
        emitToAdmins('copyright:update', {
            submissionId: copyright.submissionId,
            authorEmail: copyright.authorEmail,
            status: copyright.status
        });

        // If approved, create or update record in ConferenceSelectedUser
        if (status === 'Approved') {
            try {
                // Find paper and payment details for rich metadata
                let paper = await PaperSubmission.findOne({ submissionId: copyright.submissionId })
                    .populate('assignedEditor', 'email username')
                    .populate('reviewAssignments.reviewer', 'email username');

                if (!paper) {
                    const {PaperSubmission} = await import('../models/Paper.js');
                    paper = await PaperSubmission.findOne({ submissionId: copyright.submissionId })
                        .populate('assignedEditor', 'email username')
                        .populate('reviewAssignments.reviewer', 'email username');
                }

                const payment = await PaymentDoneFinalUser.findOne({ authorEmail: copyright.authorEmail });

                // Extract reviewer names/emails
                const reviewersList = paper?.reviewAssignments?.map(a =>
                    `${a.reviewer?.username || 'Unknown'} (${a.reviewer?.email || 'N/A'})`
                ) || [];

                await ConferenceSelectedUser.findOneAndUpdate(
                    { submissionId: copyright.submissionId },
                    {
                        authorEmail: copyright.authorEmail,
                        authorName: copyright.authorName,
                        paperTitle: copyright.paperTitle,
                        submissionId: copyright.submissionId,
                        paperUrl: paper?.pdfUrl || 'N/A',
                        copyrightUrl: copyright.copyrightFormUrl,
                        paymentId: payment?._id,
                        registrationNumber: payment?.registrationNumber,
                        category: paper?.category,
                        abstract: paper?.abstract,
                        editorEmail: paper?.assignedEditor?.email,
                        reviewers: reviewersList,
                        revisionRounds: paper?.revisionCount || 0,
                        paperSubmittedAt: paper?.createdAt,
                        copyrightSubmittedAt: copyright.submittedAt || copyright.updatedAt,
                        selectionDate: new Date(),
                        status: 'Confirmed'
                    },
                    { upsert: true, new: true }
                );
                console.log(` User ${copyright.authorEmail} added to ConferenceSelectedUser`);
            } catch (selectedUserError) {
                console.error('Error saving to ConferenceSelectedUser:', selectedUserError);
                // We don't fail the main request if this secondary storage fails,
                // but we log it.
            }
        }

        await invalidatePattern('cache:*copyright*');

        return res.status(200).json({
            success: true,
            message: `Copyright form ${status.toLowerCase()} successfully`,
            data: copyright
        });
    } catch (error) {
        console.error('Error in reviewCopyrightForm:', error);
        return res.status(500).json({
            success: false,
            message: 'Error reviewing copyright form',
            error: error.message
        });
    }
};

// Author: Upload Camera-Ready Paper
export const uploadCameraReady = async (req, res) => {
    try {
        const { submissionId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Find the copyright record
        const copyright = await Copyright.findOne({ submissionId });
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found'
            });
        }

        // Upload to Cloudinary
        let fileUrl;
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const { uploadPdfToCloudinary } = await import('../config/cloudinary-pdf.js');
            const cloudinaryResult = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
            fileUrl = cloudinaryResult.url;
            copyright.cameraReadyUrl = fileUrl; // Update copyright record
        } else {
            fileUrl = `/uploads/${req.file.filename}`;
            copyright.cameraReadyUrl = fileUrl; // Update copyright record
        }
        
        await copyright.save();

        // Notify Admins
        emitToAdmins('final:camera_ready', {
            submissionId: copyright.submissionId,
            authorName: copyright.authorName,
            paperTitle: copyright.paperTitle
        });

        // Notify Author (confirming success)
        emitToUser(copyright.authorEmail, 'copyright:update', {
            submissionId: copyright.submissionId,
            cameraReadyUploaded: true,
            cameraReadyUrl: fileUrl
        });

        await invalidatePattern('cache:*copyright*');

        return res.status(200).json({
            success: true,
            message: 'Camera-ready paper uploaded successfully',
            cameraReadyUrl: fileUrl
        });
    } catch (error) {
        console.error('Error in uploadCameraReady:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading camera-ready paper',
            error: error.message
        });
    }
};

// Author/Admin: Mark messages as read
export const markCopyrightMessagesAsRead = async (req, res) => {
    try {
        const { copyrightId } = req.body;
        const userRole = req.user.role;

        const copyright = await Copyright.findById(copyrightId);
        if (!copyright) {
            return res.status(404).json({ success: false, message: 'Copyright record not found' });
        }

        let modified = false;
        copyright.messages.forEach(msg => {
            if (userRole === 'Author' && msg.sender === 'Admin' && !msg.isReadByAuthor) {
                msg.isReadByAuthor = true;
                modified = true;
            } else if (userRole === 'Admin' && msg.sender === 'Author' && !msg.isReadByAdmin) {
                msg.isReadByAdmin = true;
                modified = true;
            }
        });

        if (modified) {
            await copyright.save();
            // Emit to Author
            emitToUser(copyright.authorEmail, 'copyright:update', {
                submissionId: copyright.submissionId,
                status: copyright.status,
                messages: copyright.messages
            });
            await invalidatePattern('cache:*copyright*');
        }
        return res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({ success: false, message: 'Error marking messages as read' });
    }
};

// Admin: Update Payment Status directly from Copyright Dashboard
export const updatePaymentStatusByAdmin = async (req, res) => {
    try {
        const { authorEmail, submissionId, status } = req.body;

        if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

        const safeSid = escapeRegex(submissionId || '');
        const sidRegex = new RegExp(`^${safeSid}$`, 'i');
        const safeEmail = authorEmail?.toLowerCase();

        console.log(`[ManualUpdate] Paper: ${submissionId}, Author: ${authorEmail}, Status: ${status}`);

        // 1. Find record for this SPECIFIC submission
        let paymentApp = await PaymentRegistration.findOne({ submissionId: sidRegex });

        // 2. If no paper-specific record, look for a generic one for this author
        if (!paymentApp && safeEmail) {
            paymentApp = await PaymentRegistration.findOne({ 
                authorEmail: safeEmail,
                $or: [
                    { submissionId: { $exists: false } },
                    { submissionId: null },
                    { submissionId: '' }
                ]
            });
            if (paymentApp) console.log(`[ManualUpdate] Found generic payment for ${authorEmail}, will assign to ${submissionId}`);
        }

        if (!paymentApp) {
            console.log(`[ManualUpdate] No record found. Creating new PaymentRegistration for ${submissionId}`);
            // Find copyright record to get info for dummy record
            const copyright = await Copyright.findOne({
                $or: [{ submissionId: sidRegex }, { authorEmail: safeEmail }]
            });

            // Create a dummy record
            paymentApp = new PaymentRegistration({
                authorEmail: authorEmail || copyright?.authorEmail || 'unknown@example.com',
                submissionId: submissionId || copyright?.submissionId || 'N/A',
                paymentStatus: status,
                verifiedAt: status === 'verified' ? new Date() : null,
                authorName: copyright?.authorName || authorEmail?.split('@')[0] || 'Unknown Author',
                registrationCategory: 'indian-author',
                amount: 0,
                transactionId: 'ADMIN_MANUAL_ENTRY',
                paymentMethod: 'external',
                institution: 'Manual Entry',
                address: 'Manual Entry',
                country: 'Manual Entry',
                paperTitle: copyright?.paperTitle || 'Untitled Paper',
                paymentScreenshot: 'N/A'
            });
        } else {
            console.log(`[ManualUpdate] Updating existing record: ${paymentApp._id} with status ${status}`);
            paymentApp.paymentStatus = status;
            if (status === 'verified') {
                paymentApp.verifiedAt = new Date();
                paymentApp.verifiedByName = req.user?.username || req.user?.email || 'Admin';
            }
        }

        await paymentApp.save();

        // 3. Update FinalAcceptance record if it exists
        if (submissionId) {
            const faUpdate = await FinalAcceptance.findOneAndUpdate(
                { submissionId: sidRegex },
                { 
                    paymentStatus: status === 'verified' ? 'verified' : 'pending',
                    paymentRegistrationId: paymentApp._id
                },
                { new: true }
            );
            if (faUpdate) console.log(`[ManualUpdate] Synced FinalAcceptance: ${submissionId}`);
        }

        console.log(`[ManualUpdate] Success for ${submissionId}`);

        await invalidatePattern('cache:*copyright*');

        return res.status(200).json({
            success: true,
            message: `Payment status updated to ${status} for ${submissionId || authorEmail}`,
            data: paymentApp
        });
    } catch (error) {
        console.error('[ManualUpdate] Error:', error);
        return res.status(500).json({ success: false, message: 'Error updating payment status', error: error.message });
    }
};
