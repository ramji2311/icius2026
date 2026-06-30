import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import { PaperSubmission } from '../models/Paper.js';
import { sendVerificationEmail, sendOTPEmail } from '../utils/emailService.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import { invalidatePattern } from '../utils/cacheHelper.js';

// Register new user
export const register = [
    validateRegistration,
    async (req, res) => {
    const { email, password, role = 'Author', country, userType, institution } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            username: email.split('@')[0],
            email,
            password: hash,
            role,
            country: country || null,
            userType: userType || null,
            institution: institution || null,
            verified: false,
            verificationToken,
            verificationExpires: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        });

        await newUser.save();
        await invalidatePattern('cache:*user*');

        try {
            await sendVerificationEmail(email, verificationToken);

            return res.status(201).json({
                success: true,
                message: "Account created. Please check your email to verify your account."
            });
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            return res.status(201).json({
                success: true,
                message: "Account created, but we couldn't send a verification email. Please contact support."
            });
        }
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
            error: error.message
        });
    }
    }
];

// Login user
export const login = [
    validateLogin,
    async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log("Missing credentials:", { hasEmail: !!email, hasPassword: !!password });
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        console.log(`[AUTH] Login attempt for email: "${email}"`);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`[AUTH] Login failed: User "${email}" not found in database`);
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }
        console.log(`[AUTH] User found: ${user.email} (Role: ${user.role})`);

        if (!user.password) {
            console.log("User found but has no password field in DB:", email);
            return res.status(400).json({
                success: false,
                message: user.isGoogleAuth
                    ? "This account was created with Google. Please use Google Login."
                    : "No password set for this account. Please contact support."
            });
        }

        console.log("bcrypt.compare check starting for:", email);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password"
            });
        }

        if (!user.verified) {
            return res.status(200).json({
                success: false,
                verified: false,
                needsVerification: true,
                message: "Please verify your email before logging in"
            });
        }

        // Get role-specific secret
        const getSecret = (role) => {
            switch (role) {
                case 'Admin': return process.env.JWT_SECRET_ADMIN;
                case 'Editor': return process.env.JWT_SECRET_EDITOR;
                case 'Author':
                case 'Reviewer': return process.env.JWT_SECRET_AUTHOR;
                default: return process.env.JWT_SECRET_AUTHOR;
            }
        };

        const token = jwt.sign({
            email,
            userId: user._id,
            username: user.username,
            role: user.role
        }, getSecret(user.role), { expiresIn: '24h' });

        // Determine if we should use 'none' for sameSite (required for cross-site)
        // If the request is HTTPS, we should almost always use sameSite: 'none' and secure: true
        // to support cross-domain frontend/backend setups (e.g. Vercel + Render)
        const isHttps = req.protocol === 'https';
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Define common options for cookies
        const cookieOptions = {
            httpOnly: true,
            secure: isHttps || isProduction, // Secure requires HTTPS
            sameSite: (isHttps || isProduction) ? 'none' : 'lax', // Use 'none' for cross-domain
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };

        // Set token as HTTP-only cookie
        res.cookie('token', token, cookieOptions);

        // Set role in non-HTTP-only cookie for client-side UI
        res.cookie('role', user.role, {
            ...cookieOptions,
            httpOnly: false // Allow JavaScript access
        });

        return res.status(200).json({
            success: true,
            verified: true,
            token,
            email: user.email,
            username: user.username,
            role: user.role, // Add role at top level for easy access
            country: user.country, // Add country for pricing display
            user: {
                email: user.email,
                username: user.username,
                role: user.role,
                country: user.country
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
            error: error.message
        });
    }
    }
];

// Verify email with token
export const verifyEmail = async (req, res) => {
    // Support both GET (query params) and POST (body) methods
    const token = req.query.token || req.body.token;
    const email = req.query.email || req.body.email;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Verification token is required"
        });
    }

    try {
        // If email is not provided, find user by token alone
        let query = { verificationToken: token, verificationExpires: { $gt: new Date() } };

        if (email) {
            query.email = email;
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token. Please request a new verification email."
            });
        }

        user.verified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();
        await invalidatePattern('cache:*user*');

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during verification. Please try again.",
            error: error.message
        });
    }
};

// Resend verification email
export const resendVerification = async (req, res) => {
    const { email } = req.body;

    try {
        console.log(`[AUTH] Resending verification to ${email}...`);
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[AUTH] Resend failed: User ${email} not found`);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.verified) {
            console.log(`[AUTH] Resend skipped: User ${email} is already verified`);
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await user.save();
        console.log(`[AUTH] Token generated and saved for ${email}`);

        await sendVerificationEmail(email, verificationToken);
        console.log(`[AUTH] Verification email service completed for ${email}`);

        return res.status(200).json({
            success: true,
            message: "Verification email sent. Please check your inbox."
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while sending the verification email",
            error: error.message
        });
    }
};

// Forgot password - send OTP
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        user.resetPasswordOTP = otp;
        user.resetPasswordExpiry = otpExpiry;
        await user.save();

        await sendOTPEmail(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error: error.message
        });
    }
};

// Reset password with OTP
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while resetting your password",
            error: error.message
        });
    }
};

// Get current user info
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const token = req.cookies.token || req.headers["authorization"]?.replace('Bearer ', '');
        
        return res.status(200).json({
            success: true,
            user,
            token // Return the token so frontend can sync to localStorage fallback
        });
    } catch (error) {
        console.error("Get current user error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching user data",
            error: error.message
        });
    }
};

// Check if user has an accepted paper in PaperSubmission collection
// This determines if they should see "Register as Author" or "Register as Listener"
export const checkAcceptanceStatus = async (req, res) => {
    try {
        // Get email from query or from the authenticated user token
        const email = req.query.email || req.user?.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                isAccepted: false,
                message: "Email is required"
            });
        }

        console.log('🔍 Checking acceptance status for:', email);

        // Check PaperSubmission (single unified collection) for accepted papers
        const acceptedPapersCount = await PaperSubmission.countDocuments({
            email: email,
            status: 'Accepted'
        });

        if (acceptedPapersCount > 0) {
            console.log(` Found ${acceptedPapersCount} accepted papers for ${email}`);
            
            // Still find the most recent one for backward compatibility if needed
            const mostRecentPaper = await PaperSubmission.findOne({
                email: email,
                status: 'Accepted'
            }).sort({ updatedAt: -1 });

            return res.status(200).json({
                success: true,
                isAccepted: true,
                acceptedCount: acceptedPapersCount,
                message: `User has ${acceptedPapersCount} accepted paper(s)`,
                acceptanceData: {
                    paperTitle: mostRecentPaper.paperTitle,
                    authorName: mostRecentPaper.authorName,
                    submissionId: mostRecentPaper.submissionId
                }
            });
        } else {
            console.log('❌ No accepted paper found for:', email);
            return res.status(200).json({
                success: true,
                isAccepted: false,
                message: "User does not have an accepted paper"
            });
        }
    } catch (error) {
        console.error("Check acceptance status error:", error);
        return res.status(500).json({
            success: false,
            isAccepted: false,
            message: "An error occurred while checking acceptance status",
            error: error.message
        });
    }
};

// Update user country
export const updateUserCountry = async (req, res) => {
    try {
        const { country } = req.body;
        const userId = req.user.userId;

        if (!country || typeof country !== 'string' || country.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Invalid country selection. Country is required."
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { country: country.trim() },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        console.log(` Country updated for user ${user.email}: ${country}`);

        return res.status(200).json({
            success: true,
            message: "Country updated successfully",
            user: {
                email: user.email,
                username: user.username,
                role: user.role,
                country: user.country
            }
        });
    } catch (error) {
        console.error("Update country error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating country",
            error: error.message
        });
    }
};

// Logout user - clear cookie
export const logout = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        };

        res.clearCookie('token', cookieOptions);
        res.clearCookie('role', {
            ...cookieOptions,
            httpOnly: false
        });
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during logout",
            error: error.message
        });
    }
};
