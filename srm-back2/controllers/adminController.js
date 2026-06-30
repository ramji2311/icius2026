import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { Review } from '../models/Review.js';
import { Revision } from '../models/Revision.js';
import { generateRandomPassword } from '../utils/helpers.js';
import {
    sendEditorAssignmentEmail,
    sendEditorCredentialsEmail,
    sendEditorMessageEmail,
    sendSelectionEmail
} from '../utils/emailService.js';
import { emitToUser } from '../utils/socket.js';
import { paymentRegistrationEffectiveAmountStage } from '../utils/paymentRegistrationEffectiveAmount.js';
import { invalidatePattern } from '../utils/cacheHelper.js';

// Create editor account
export const createEditor = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Generate password if not provided
        const userPassword = password || generateRandomPassword();
        const hash = await bcrypt.hash(userPassword, 10);

        const newEditor = new User({
            username: username || email.split('@')[0],
            email,
            password: hash,
            role: 'Editor',
            verified: true // Editors are auto-verified
        });

        await newEditor.save();
        await invalidatePattern('cache:*editor*');
        await invalidatePattern('cache:*user*');

        console.log(`📧 Sending credentials email to ${email}...`);

        // Send credentials email
        try {
            await sendEditorCredentialsEmail(email, username || email.split('@')[0], userPassword);
            console.log(` Credentials email sent successfully to ${email}`);
        } catch (emailError) {
            console.error(`⚠️  Failed to send credentials email to ${email}:`, emailError);
            // Don't fail the entire operation if email fails
        }

        return res.status(201).json({
            success: true,
            message: "Editor account created successfully",
            editor: {
                id: newEditor._id,
                email: newEditor.email,
                username: newEditor.username,
                role: newEditor.role
            },
            temporaryPassword: password ? null : userPassword,
            emailSent: true
        });
    } catch (error) {
        console.error("Error creating editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating editor account",
            error: error.message
        });
    }
};

// Get all editors
export const getAllEditors = async (req, res) => {
    try {
        console.log('📋 Fetching all editors from database...');

        // Query all users and check their roles
        const allUsers = await User.find({});
        console.log(`Total users in database: ${allUsers.length}`);
        console.log('User roles:', allUsers.map(u => ({ email: u.email, role: u.role })));

        // Find editors - handle case sensitivity
        const editors = await User.find({
            role: { $in: ['Editor', 'editor', 'EDITOR'] }
        })
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`✓ Found ${editors.length} editor(s)`);

        return res.status(200).json({
            success: true,
            count: editors.length,
            editors,
            debug: {
                totalUsers: allUsers.length,
                rolesInDB: [...new Set(allUsers.map(u => u.role))]
            }
        });
    } catch (error) {
        console.error("❌ Error fetching editors:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching editors",
            error: error.message
        });
    }

};



// Assign editor to paper
export const assignEditor = async (req, res) => {
    try {
        const { paperId, editorId } = req.body;

        // Find the paper
        let paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            paper = await PaperSubmission.findById(paperId);
        }

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Find the editor
        const editor = await User.findById(editorId);
        if (!editor || editor.role !== 'Editor') {
            return res.status(404).json({
                success: false,
                message: "Editor not found"
            });
        }

        // Assign editor
        paper.assignedEditor = editorId;
        paper.status = 'Editor Assigned';
        await paper.save();
        await invalidatePattern('cache:*paper*');

        // Send notification email to editor
        try {
            await sendEditorAssignmentEmail(editor.email, editor.username, {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                authorName: paper.authorName,
                category: paper.category,
                pdfUrl: paper.pdfUrl
            });
        } catch (emailError) {
            console.error("Error sending editor assignment email:", emailError);
        }

        // Notify Author via Socket
        emitToUser(paper.email, 'paper:status_changed', {
            submissionId: paper.submissionId,
            status: paper.status,
            paperTitle: paper.paperTitle
        });

        return res.status(200).json({
            success: true,
            message: "Editor assigned successfully",
            paper
        });
    } catch (error) {
        console.error("Error assigning editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error assigning editor",
            error: error.message
        });
    }
};

// Reassign editor
export const reassignEditor = async (req, res) => {
    try {
        const { paperId, newEditorId } = req.body;

        // Find the paper
        let paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            paper = await PaperSubmission.findById(paperId);
        }

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        const newEditor = await User.findById(newEditorId);
        if (!newEditor || newEditor.role !== 'Editor') {
            return res.status(404).json({
                success: false,
                message: "Editor not found"
            });
        }

        paper.assignedEditor = newEditorId;
        await paper.save();
        await invalidatePattern('cache:*paper*');

        // Send notification email
        try {
            await sendEditorAssignmentEmail(newEditor.email, newEditor.username, {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                authorName: paper.authorName,
                category: paper.category,
                pdfUrl: paper.pdfUrl
            });
        } catch (emailError) {
            console.error("Error sending reassignment email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Editor reassigned successfully",
            paper
        });
    } catch (error) {
        console.error("Error reassigning editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error reassigning editor",
            error: error.message
        });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { email: new RegExp(search, 'i') },
                { username: new RegExp(search, 'i') }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message
        });
    }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Use Promise.all for parallel count queries
        const [
            mainPapers,
            multiPapers,
            mainSubmitted,
            multiSubmitted,
            mainUnderReview,
            multiUnderReview,
            mainAccepted,
            multiAccepted,
            mainRejected,
            multiRejected,
            totalUsers,
            authors,
            editors,
            reviewers
        ] = await Promise.all([
            PaperSubmission.countDocuments(),
            PaperSubmission.countDocuments(),
            PaperSubmission.countDocuments({ status: 'Submitted' }),
            PaperSubmission.countDocuments({ status: 'Submitted' }),
            PaperSubmission.countDocuments({ status: 'Under Review' }),
            PaperSubmission.countDocuments({ status: 'Under Review' }),
            PaperSubmission.countDocuments({ status: 'Accepted' }),
            PaperSubmission.countDocuments({ status: 'Accepted' }),
            PaperSubmission.countDocuments({ status: 'Rejected' }),
            PaperSubmission.countDocuments({ status: 'Rejected' }),
            User.countDocuments(),
            User.countDocuments({ role: 'Author' }),
            User.countDocuments({ role: 'Editor' }),
            User.countDocuments({ role: 'Reviewer' })
        ]);

        const totalPapers = mainPapers;
        const submittedPapers = mainSubmitted;
        const underReview = mainUnderReview;
        const accepted = mainAccepted;
        const rejected = mainRejected;

        // NEW: College-wise Statistics
        const PaymentRegistration = (await import('../models/PaymentRegistration.js')).default;
        
        // 1. Get all papers grouped by institution
        const rawPapersByCollege = await PaperSubmission.aggregate([
            {
                $group: {
                    _id: { $toUpper: { $ifNull: ["$institution", "OTHERS"] } },
                    totalCount: { $sum: 1 }
                }
            }
        ]);

        // 2. Get all verified payments grouped by institution
        const rawPaymentsByCollege = await PaymentRegistration.aggregate([
            {
                $match: { paymentStatus: 'verified' }
            },
            paymentRegistrationEffectiveAmountStage,
            {
                $group: {
                    _id: { $toUpper: { $ifNull: ["$institution", "OTHERS"] } },
                    regCount: { $sum: 1 },
                    totalAmount: { $sum: "$effectiveRegAmount" }
                }
            }
        ]);

        // Merge the two datasets
        const collegeStatsMap = {};
        
        rawPapersByCollege.forEach(item => {
            const org = item._id || "OTHERS";
            if (!collegeStatsMap[org]) {
                collegeStatsMap[org] = { institution: org, count: 0, regCnt: 0, nonRegCnt: 0, amount: 0 };
            }
            collegeStatsMap[org].count = item.totalCount;
            collegeStatsMap[org].nonRegCnt = item.totalCount;
        });

        rawPaymentsByCollege.forEach(item => {
            const org = item._id || "OTHERS";
            if (!collegeStatsMap[org]) {
                collegeStatsMap[org] = { institution: org, count: 0, regCnt: 0, nonRegCnt: 0, amount: 0 };
            }
            collegeStatsMap[org].regCnt = item.regCount;
            collegeStatsMap[org].amount = item.totalAmount;
            // Adjust nonRegCnt if we didn't have paper count for some reason, 
            // but usually every payment has a paper. 
            // In fact, some papers might not have institution but payment does.
            // We'll trust the math: Non-Reg = Total - Reg
            collegeStatsMap[org].nonRegCnt = Math.max(0, collegeStatsMap[org].count - item.regCount);
        });

        const collegeStats = Object.values(collegeStatsMap).sort((a, b) => b.count - a.count);

        // Get papers by status from single collection
        const mainByStatus = await PaperSubmission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const papersByStatus = mainByStatus;

        const recentSubmissions = await PaperSubmission.find()
            .populate('assignedEditor', 'username email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get monthly submission trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrends = await PaperSubmission.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                papers: {
                    total: totalPapers,
                    submitted: submittedPapers,
                    underReview,
                    accepted,
                    rejected
                },
                users: {
                    total: totalUsers,
                    authors,
                    editors,
                    reviewers
                },
                papersByStatus,
                recentSubmissions,
                monthlyTrends,
                collegeStats // Added this
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error.message
        });
    }
};
// Send message to editor
export const sendMessageToEditor = async (req, res) => {
    try {
        const { editorId, message } = req.body;

        if (!editorId || !message) {
            return res.status(400).json({
                success: false,
                message: "Editor ID and message are required"
            });
        }

        const editor = await User.findById(editorId);
        if (!editor || editor.role !== 'Editor') {
            return res.status(404).json({
                success: false,
                message: "Editor not found"
            });
        }

        // For now, we send an email notification. 
        // We could also store this in a Message collection if needed.
        await sendEditorMessageEmail(editor.email, editor.username, message);

        return res.status(200).json({
            success: true,
            message: "Message sent successfully to the editor"
        });
    } catch (error) {
        console.error("Error sending message to editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error sending message",
            error: error.message
        });
    }
};

// Get all conference selected users (users who completed the full process)
export const getConferenceSelectedUsers = async (req, res) => {
    try {
        const { Copyright } = await import('../models/Copyright.js');
        const FinalAcceptance = (await import('../models/FinalAcceptance.js')).default;
        const { PaymentDoneFinalUser } = await import('../models/PaymentDoneFinalUser.js');
        const PaymentRegistration = (await import('../models/PaymentRegistration.js')).default;

        // Fetch based on approved copyrights
        const approvedCopyrights = await Copyright.find({ status: 'Approved' })
            .sort({ updatedAt: -1 });

        // Map to format expected by the frontend panel
        const usersWithPayment = await Promise.all(approvedCopyrights.map(async (cp) => {
            // Find Final Docs / Paper details
            const paper = await FinalAcceptance.findOne({ submissionId: cp.submissionId });
            
            // Find Payment details - Match by submissionId first, then by email
            // Check PaymentDoneFinalUser first
            let payment = await PaymentDoneFinalUser.findOne({
                $or: [
                    { submissionId: cp.submissionId },
                    { authorEmail: { $regex: new RegExp(`^${cp.authorEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
                ]
            });

            // If not found in PaymentDoneFinalUser, check PaymentRegistration for verified payments
            // Must have payment for this specific paper
            if (!payment) {
                const paymentReg = await PaymentRegistration.findOne({
                    authorEmail: { $regex: new RegExp(`^${cp.authorEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    paymentStatus: 'verified',
                    $or: [
                        { submissionId: cp.submissionId },
                        { papers: { $elemMatch: { submissionId: cp.submissionId } } }
                    ]
                });

                if (paymentReg) {
                    payment = {
                        _id: paymentReg._id,
                        registrationNumber: paymentReg.registrationNumber || 'Registered (Payment Verified)',
                        verifiedAt: paymentReg.verifiedAt
                    };
                }
            }

            // Only return if payment exists (verified)
            if (payment) {
                return {
                    _id: cp._id,
                    authorName: cp.authorName,
                    authorEmail: cp.authorEmail,
                    paperTitle: cp.paperTitle,
                    submissionId: cp.submissionId,
                    registrationNumber: payment?.registrationNumber || 'N/A',
                    selectionDate: cp.updatedAt,
                    status: 'Confirmed',
                    paperUrl: paper?.pdfUrl || 'N/A',
                    copyrightUrl: cp.copyrightFormUrl,
                    finalDocUrl: cp.finalDocUrl || cp.cameraReadyUrl,
                    finalDocSubmittedAt: cp.finalDocUploadedAt || cp.cameraReadyUploadedAt,
                    paymentId: payment?._id
                };
            }
            
            return null; // No payment found, don't include this paper
        }));

        // Filter out null values (papers without payment)
        const users = usersWithPayment.filter(user => user !== null);

        return res.status(200).json({
            success: true,
            message: `Found ${users.length} selected users from approved copyrights`,
            users: users,
            total: users.length
        });
    } catch (error) {
        console.error('Error fetching conference selected users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching selected users',
            error: error.message
        });
    }
};

// Get all PDFs from Cloudinary (admin version with delete capability)
export const getAllPdfsAdmin = async (req, res) => {
    try {
        const { listPdfsFromCloudinary } = await import('../config/cloudinary-pdf.js');
        const pdfs = await listPdfsFromCloudinary();

        // Enrich with local database info if available
        const enrichedPdfs = pdfs.map(pdf => {
            const fileName = pdf.public_id.split('/').pop();
            return {
                publicId: pdf.public_id,
                fileName: fileName,
                url: pdf.secure_url,
                size: pdf.bytes,
                uploadedAt: pdf.created_at,
                version: pdf.version
            };
        });

        return res.status(200).json({
            success: true,
            message: `Found ${enrichedPdfs.length} PDFs in Cloudinary`,
            pdfs: enrichedPdfs,
            total: enrichedPdfs.length
        });
    } catch (error) {
        console.error('Error fetching PDFs from Cloudinary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching PDFs from Cloudinary',
            error: error.message
        });
    }
};

// Delete PDF from Cloudinary (admin only)
export const deletePdfAdmin = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'PDF public ID is required'
            });
        }

        const { deletePdfFromCloudinary } = await import('../config/cloudinary-pdf.js');
        await deletePdfFromCloudinary(publicId);

        return res.status(200).json({
            success: true,
            message: 'PDF deleted successfully from Cloudinary'
        });
    } catch (error) {
        console.error('Error deleting PDF:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting PDF',
            error: error.message
        });
    }
};

// Send selection email to author
export const sendSelectedUserEmail = async (req, res) => {
    try {
        const { submissionId } = req.body;
        const ConferenceSelectedUser = (await import('../models/ConferenceSelectedUser.js')).default;

        const selectedUser = await ConferenceSelectedUser.findOne({ submissionId });
        if (!selectedUser) {
            return res.status(404).json({
                success: false,
                message: 'Selected user not found'
            });
        }

        await sendSelectionEmail(selectedUser.authorEmail, selectedUser.authorName, {
            submissionId: selectedUser.submissionId,
            paperTitle: selectedUser.paperTitle
        });

        return res.status(200).json({
            success: true,
            message: 'Selection email sent successfully'
        });
    } catch (error) {
        console.error('Error sending selection email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending selection email',
            error: error.message
        });
    }
};


