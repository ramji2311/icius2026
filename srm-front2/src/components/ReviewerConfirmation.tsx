import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';



interface ReviewAssignment {
    _id: string;
    paperId: string;
    paperTitle: string;
    submissionId: string;
    category: string;
    authorName: string;
    abstract?: string;
    reviewerEmail: string;
    reviewerName: string;
    status: 'pending' | 'accepted' | 'rejected';
    deadline: string;
}

const ReviewerConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [assignment, setAssignment] = useState<ReviewAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [action, setAction] = useState<'accept' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [alternativeReviewerEmail, setAlternativeReviewerEmail] = useState('');
    const [alternativeReviewerName, setAlternativeReviewerName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Get assignment ID from URL params
    const assignmentId = searchParams.get('assignmentId');
    const reviewerEmail = searchParams.get('email');

    useEffect(() => {
        if (!assignmentId || !reviewerEmail) {
            setError('Invalid confirmation link. Missing assignment ID or reviewer email.');
            setLoading(false);
            return;
        }

        fetchAssignmentDetails();
    }, [assignmentId, reviewerEmail]);

    const fetchAssignmentDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                `/api/reviewer/assignment/${assignmentId}?email=${reviewerEmail}`
            );

            if (response.data.success) {
                setAssignment(response.data.assignment);
                setError(null);
            } else {
                setError(response.data.message || 'Failed to load assignment details');
            }
        } catch (err) {
            console.error('Error fetching assignment:', err);
            setError('Failed to load assignment details. Please check your link.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!assignment) return;

        try {
            setSubmitting(true);
            const response = await api.post(
                '/api/reviewer/accept-assignment',
                {
                    assignmentId: assignment._id,
                    reviewerEmail: assignment.reviewerEmail,
                    paperId: assignment.paperId
                }
            );

            if (response.data.success) {
                setSubmitted(true);
                setAction('accept');
                setTimeout(() => {
                    navigate('/login', { 
                        state: { 
                            message: 'Assignment accepted! Please login with your credentials to access the paper review.' 
                        } 
                    });
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to accept assignment');
            }
        } catch (err) {
            console.error('Error accepting assignment:', err);
            setError('Failed to accept assignment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!assignment || !rejectionReason.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.post(
                '/api/reviewer/reject-assignment',
                {
                    assignmentId: assignment._id,
                    reviewerEmail: assignment.reviewerEmail,
                    paperId: assignment.paperId,
                    rejectionReason: rejectionReason.trim(),
                    alternativeReviewerEmail: alternativeReviewerEmail.trim() || null,
                    alternativeReviewerName: alternativeReviewerName.trim() || null
                }
            );

            if (response.data.success) {
                setSubmitted(true);
                setAction('reject');
                setTimeout(() => {
                    navigate('/', { 
                        state: { 
                            message: 'Rejection submitted successfully. Thank you for your consideration.' 
                        } 
                    });
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to reject assignment');
            }
        } catch (err) {
            console.error('Error rejecting assignment:', err);
            setError('Failed to reject assignment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading assignment details...</p>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertCircle className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Invalid Link</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        {error || 'The confirmation link is invalid or has expired.'}
                    </p>
                    <a
                        href="/"
                        className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition"
                    >
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    if (submitted && action === 'accept') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-600 mb-2">Assignment Accepted!</h2>
                    <p className="text-gray-600 mb-6">
                        Your review credentials have been sent to your email. Redirecting to login...
                    </p>
                    <div className="text-sm text-gray-500">
                        Check your email for login details.
                    </div>
                </div>
            </div>
        );
    }

    if (submitted && action === 'reject') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-orange-600 mb-2">Rejection Submitted</h2>
                    <p className="text-gray-600 mb-6">
                        Thank you for your feedback. Your rejection has been recorded, and the editor will find an alternative reviewer.
                    </p>
                    <a
                        href="/"
                        className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    if (!action) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                    {/* Header */}
                    <div className="mb-8 pb-6 border-b-2 border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            📋 Review Assignment Confirmation
                        </h1>
                        <p className="text-gray-600">
                            Please confirm whether you can review this paper
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-800">Error</h3>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Paper Details */}
                    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Paper Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">Submission ID:</span>
                                <span className="text-gray-600">{assignment.submissionId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">Paper Title:</span>
                                <span className="text-gray-600 max-w-xs text-right">{assignment.paperTitle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">Category:</span>
                                <span className="text-gray-600">{assignment.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">Author:</span>
                                <span className="text-gray-600">{assignment.authorName}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-blue-200">
                                <span className="font-semibold text-gray-700">Review Deadline:</span>
                                <span className="text-orange-600 font-semibold">
                                    {new Date(assignment.deadline).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Section */}
                    {assignment.abstract && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                📋 Paper Abstract
                            </h2>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                    {assignment.abstract}
                                </p>
                            </div>
                            <p className="text-xs text-amber-700 mt-4 pt-4 border-t border-amber-200">
                                ℹ️ <strong>Please review this abstract carefully</strong> before confirming your availability to review this paper.
                            </p>
                        </div>
                    )}

                    {/* Decision Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setAction('accept')}
                            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Accept
                        </button>
                        <button
                            onClick={() => setAction('reject')}
                            className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-5 h-5" />
                            Reject
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm text-blue-800">
                            <strong>ℹ️ Note:</strong> If you accept, you'll receive login credentials and can access the paper review portal. If you reject, please provide a reason below.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Accept confirmation
    if (action === 'accept') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                    <div className="mb-8 pb-6 border-b-2 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <h1 className="text-3xl font-bold text-green-600">Confirm Acceptance</h1>
                        </div>
                        <p className="text-gray-600">
                            You are about to accept this review assignment
                        </p>
                    </div>

                    {/* Paper Details */}
                    <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Assignment Details</h2>
                        <div className="space-y-2">
                            <p><strong>Paper:</strong> {assignment.paperTitle}</p>
                            <p><strong>Submission ID:</strong> {assignment.submissionId}</p>
                            <p><strong>Category:</strong> {assignment.category}</p>
                            <p><strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>
                    </div>

                    {/* Abstract Section */}
                    {assignment.abstract && (
                        <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                📋 Paper Abstract
                            </h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words text-sm">
                                {assignment.abstract}
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm text-blue-800">
                             Upon acceptance, your review credentials (email and password) will be sent to <strong>{assignment.reviewerEmail}</strong>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setAction(null)}
                            className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Confirm & Accept
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Reject with reason
    if (action === 'reject') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                    <div className="mb-8 pb-6 border-b-2 border-red-200">
                        <div className="flex items-center gap-3 mb-2">
                            <XCircle className="w-8 h-8 text-red-600" />
                            <h1 className="text-3xl font-bold text-red-600">Reject Assignment</h1>
                        </div>
                        <p className="text-gray-600">
                            Please provide details about your rejection
                        </p>
                    </div>

                    {/* Paper Details */}
                    <div className="mb-8 p-6 bg-red-50 rounded-lg border border-red-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Paper Details</h2>
                        <div className="space-y-2">
                            <p><strong>Paper:</strong> {assignment.paperTitle}</p>
                            <p><strong>Submission ID:</strong> {assignment.submissionId}</p>
                            <p><strong>Category:</strong> {assignment.category}</p>
                        </div>
                    </div>

                    {/* Abstract Section */}
                    {assignment.abstract && (
                        <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                📋 Paper Abstract
                            </h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words text-sm">
                                {assignment.abstract}
                            </p>
                        </div>
                    )}

                    {/* Rejection Form */}
                    <div className="space-y-6 mb-8">
                        {/* Rejection Reason */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Reason for Rejection *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Not in my area of expertise, Too busy right now, Conflict of interest, etc."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500 mt-1">{rejectionReason.length} characters</p>
                        </div>

                        {/* Alternative Reviewer */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 font-semibold mb-3">
                                💡 Suggestion: Know someone who could review this paper?
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Alternative Reviewer Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={alternativeReviewerName}
                                        onChange={(e) => setAlternativeReviewerName(e.target.value)}
                                        placeholder="e.g., Dr. John Smith"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Alternative Reviewer Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={alternativeReviewerEmail}
                                        onChange={(e) => setAlternativeReviewerEmail(e.target.value)}
                                        placeholder="e.g., john.smith@example.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setAction(null)}
                            className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={submitting || !rejectionReason.trim()}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold transition flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5" />
                                    Submit Rejection
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default ReviewerConfirmation;
