import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import api from '../config/api';
import { FileText, Send, Clock, AlertCircle, CheckCircle, LogOut, Home, ArrowLeft, MessageSquare } from 'lucide-react';
import ReviewerChat from './ReviewerChat';

interface Paper {
    _id: string;
    submissionId: string;
    paperTitle: string;
    authorName: string;
    email: string;
    category: string;
    pdfUrl: string;
    pdfFileName: string;
    assignmentDetails?: {
        deadline: string;
        status: string;
        assignedAt: string;
    };
}

interface ReviewFormData {
    comments: string;
    commentsToReviewer: string;  // Internal comments (shown only in system)
    commentsToEditor: string;     // Comments sent to author in decision email
    strengths: string;
    weaknesses: string;
    overallRating: number;
    noveltyRating: number;
    qualityRating: number;
    clarityRating: number;
    recommendation: string;
    round: number;  // Review round (1, 2, 3, etc.)
}

const ReviewerDashboard = React.memo(() => {
    const navigate = useNavigate();
    const { submissionId } = useParams<{ submissionId?: string }>();
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isDirectReviewLink, setIsDirectReviewLink] = useState(false);
    const [paperRevisionData, setPaperRevisionData] = useState<any>(null);  // Store revision info (includes highlighted PDF for round 2)
    const [totalRevisions, setTotalRevisions] = useState(0);  // Total number of revisions for this paper
    const [showBothPdfsModal, setShowBothPdfsModal] = useState(false);  // Toggle for showing both PDFs side-by-side
    const [activePdfInModal, setActivePdfInModal] = useState<'highlighted' | 'response'>('highlighted');  // Which PDF to show in modal
    const [previousReviews, setPreviousReviews] = useState<any[]>([]);  // Store all previous reviews by this reviewer
    const lastLoadedDraft = useRef<{ submissionId: string, round: number } | null>(null);  // Track last loaded draft to prevent duplicates
    const [currentRoundSubmitted, setCurrentRoundSubmitted] = useState(false);  // Track if current round review is submitted
    const [, setSubmittedReviewId] = useState<string | null>(null);  // Store submitted review ID for editing (only setter used)
    const [showChat, setShowChat] = useState(false);
    const [dashboardTab, setDashboardTab] = useState<'papers' | 'messages'>('papers');
    const [messageThreads, setMessageThreads] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<{ _id?: string; username?: string }>({});

    const [formData, setFormData] = useState<ReviewFormData>({
        comments: '',
        commentsToReviewer: '',
        commentsToEditor: '',
        strengths: '',
        weaknesses: '',
        overallRating: 3,
        noveltyRating: 3,
        qualityRating: 3,
        clarityRating: 3,
        recommendation: 'Major Revision',
        round: 1
    });

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await api.get(`/api/auth/me`);
                if (response.data?.success && response.data?.user) {
                    setCurrentUser({
                        _id: response.data.user._id,
                        username: response.data.user.username
                    });
                }
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };

        fetchCurrentUser();
        verifyReviewerAccess();

        // If accessing via direct review link (e.g., /reviewer/review/ME001)
        if (submissionId) {
            setIsDirectReviewLink(true);
            loadPaperForReview(submissionId);
        } else {
            // Otherwise, load all assigned papers
            fetchAssignedPapers();
        }
    }, [submissionId]);

    useEffect(() => {
        if (selectedPaper) {
            // AUTO-DETECT ROUND: Based on total revisions
            // If there's 1 revision -> Round 2, 2 revisions -> Round 3, etc.
            // Minimum is Round 1
            const autoDetectedRound = Math.max(1, totalRevisions + 1);
            setFormData(prev => ({ ...prev, round: autoDetectedRound }));
            console.log(`🎯 Auto-detected Review Round: ${autoDetectedRound} (Total Revisions: ${totalRevisions})`);
        }
    }, [selectedPaper, totalRevisions]);

    // Separate useEffect to handle PDF URL changes based on round selection
    useEffect(() => {
        if (selectedPaper && formData.round) {
            // Round 1: Always show original submission PDF
            if (formData.round === 1) {
                setPdfUrl(selectedPaper.pdfUrl);
            }
            // Round 2+: Show highlighted PDF if available, otherwise show original
            else if (formData.round > 1) {
                if (paperRevisionData?.highlightedPdfUrl) {
                    setPdfUrl(paperRevisionData.highlightedPdfUrl);
                } else {
                    // No revision data, fallback to original
                    setPdfUrl(selectedPaper.pdfUrl);
                }
            }

            // Load draft for the selected round
            loadDraftForRound(selectedPaper.submissionId, formData.round);
        }
    }, [formData.round, selectedPaper?.submissionId]);  // Only trigger when round or paper changes

    const loadDraftForRound = async (submissionId: string, round: number) => {
        // Prevent loading the same draft multiple times
        if (lastLoadedDraft.current?.submissionId === submissionId && lastLoadedDraft.current?.round === round) {
            console.log(`⏭️ Skipping duplicate draft load for ${submissionId} Round ${round}`);
            return;
        }

        try {
            const draftResponse = await api.get(`/api/reviewer/papers/${submissionId}/draft?round=${round}`);

            const review = draftResponse.data.review;

            if (review) {
                lastLoadedDraft.current = { submissionId, round };

                // Check if this review is already submitted
                if (review.status === 'Submitted') {
                    console.log(` Loaded SUBMITTED review for Round ${round}:`, review);
                    setCurrentRoundSubmitted(true);
                    setSubmittedReviewId(review._id);
                    // Load submitted data (read-only, but editable)
                    setFormData(prev => ({
                        ...prev,
                        comments: review.comments || '',
                        commentsToReviewer: review.commentsToReviewer || '',
                        commentsToEditor: review.commentsToEditor || '',
                        strengths: review.strengths || '',
                        weaknesses: review.weaknesses || '',
                        overallRating: review.overallRating || 3,
                        noveltyRating: review.noveltyRating || 3,
                        qualityRating: review.qualityRating || 3,
                        clarityRating: review.clarityRating || 3,
                        recommendation: review.recommendation || 'Major Revision',
                    }));
                } else if (review.status === 'Draft') {
                    console.log(`📝 Loaded DRAFT for Round ${round}:`, review);
                    setCurrentRoundSubmitted(false);
                    setSubmittedReviewId(null);
                    setFormData(prev => ({
                        ...prev,
                        comments: review.comments || '',
                        commentsToReviewer: review.commentsToReviewer || '',
                        commentsToEditor: review.commentsToEditor || '',
                        strengths: review.strengths || '',
                        weaknesses: review.weaknesses || '',
                        overallRating: review.overallRating || 3,
                        noveltyRating: review.noveltyRating || 3,
                        qualityRating: review.qualityRating || 3,
                        clarityRating: review.clarityRating || 3,
                        recommendation: review.recommendation || 'Major Revision',
                    }));
                }
            } else {
                console.log(`📝 No review found for Round ${round} - resetting form`);
                lastLoadedDraft.current = { submissionId, round };
                setCurrentRoundSubmitted(false);
                setSubmittedReviewId(null);
                // Reset form if no review for this round
                setFormData(prev => ({
                    ...prev,
                    comments: '',
                    commentsToReviewer: '',
                    commentsToEditor: '',
                    strengths: '',
                    weaknesses: '',
                    overallRating: 3,
                    noveltyRating: 3,
                    qualityRating: 3,
                    clarityRating: 3,
                    recommendation: 'Major Revision',
                }));
            }
        } catch (error) {
            console.log(`⚠️ No review for Round ${round}`);
            lastLoadedDraft.current = { submissionId, round };
            setCurrentRoundSubmitted(false);
            setSubmittedReviewId(null);
            // Reset form on error
            setFormData(prev => ({
                ...prev,
                comments: '',
                commentsToReviewer: '',
                commentsToEditor: '',
                strengths: '',
                weaknesses: '',
                overallRating: 3,
                noveltyRating: 3,
                qualityRating: 3,
                clarityRating: 3,
                recommendation: 'Major Revision',
            }));
        }
    };


    const verifyReviewerAccess = async () => {
        // Auth is handled via cookie - route protection in App.tsx handles access control
        // This function can be removed or simplified
    };

    const fetchAssignedPapers = async () => {
        try {
            const response = await api.get(`/api/reviewer/papers`);
            setPapers(response.data.papers || []);

            // Fetch messages too
            fetchMessageThreads();
        } catch (error: any) {
            console.error('Error fetching papers:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMessageThreads = async () => {
        try {
            const response = await api.get(`/api/reviewer/messages`);

            if (response.data.success) {
                setMessageThreads(response.data.messageThreads || []);
            }
        } catch (error) {
            console.error('Error fetching message threads:', error);
        }
    };
    const loadPaperForReview = async (submissionId: string) => {
        try {
            const response = await api.get(`/api/reviewer/papers/${submissionId}`);

            setSelectedPaper(response.data.paper);

            // Store previous reviews
            if (response.data.previousReviews) {
                setPreviousReviews(response.data.previousReviews);
                console.log(`📋 Loaded ${response.data.previousReviews.length} previous reviews:`, response.data.previousReviews);
            }

            // Fetch all revisions to know how many revisions exist
            try {
                const revisionsResponse = await api.get(`/api/papers/revisions/${submissionId}`);
                const totalRevs = revisionsResponse.data.totalRevisions || 0;
                setTotalRevisions(totalRevs);

                // Load the latest revision data
                if (totalRevs > 0) {
                    // Load the latest revision (Revision 1 for first revision, Revision 2 for second, etc.)
                    const latestRevisionNumber = totalRevs;

                    const revisionResponse = await api.get(`/api/papers/revision/${submissionId}?revisionNumber=${latestRevisionNumber}`);
                    console.log('📦 Revision Response:', revisionResponse.data);
                    if (revisionResponse.data.revision) {
                        console.log(' Revision found! Highlighted PDF:', revisionResponse.data.revision.highlightedPdfUrl);
                        setPaperRevisionData(revisionResponse.data.revision);
                    } else {
                        console.log('⚠️ No revision data in response');
                        setPaperRevisionData(null);
                    }
                } else {
                    // No revisions - reviewing initial submission
                    setPaperRevisionData(null);
                }
            } catch (err: any) {
                console.log('⚠️ Error fetching revisions:', err.response?.status, err.message);
                setTotalRevisions(0);
                setPaperRevisionData(null);
            }

            // Note: Draft will be loaded by useEffect when round is determined
        } catch (error: any) {
            console.error('Error loading paper:', error);
            if (error.response?.status === 401) {
                // Token expired or invalid - cookie will be cleared by backend
                localStorage.removeItem('role');
                navigate('/login');
            } else if (error.response?.status === 403) {
                // Paper not accepted yet
                alert('⚠️ You need to accept this assignment via the confirmation email link before you can view the paper.');
            } else {
                alert(error.response?.data?.message || 'Failed to load paper details');
            }
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedPaper) return;

        if (!formData.comments.trim()) {
            alert('Please provide internal review comments');
            return;
        }

        if (!formData.commentsToEditor.trim()) {
            alert('Please provide comments for the editor');
            return;
        }

        // Word count validation (minimum 150 words for both fields)
        // Check word counts if needed
        const confirmMessage = currentRoundSubmitted
            ? 'Are you sure you want to update this submitted review?'
            : 'Are you sure you want to submit this review? You can edit it later if needed.';

        if (window.confirm(confirmMessage)) {
            setSubmitting(true);
            try {
                await api.post(
                    `/api/reviewer/papers/${selectedPaper._id}/submit-review`,
                    formData
                );

                alert(currentRoundSubmitted ? 'Review updated successfully!' : 'Review submitted successfully!');

                // Refresh papers list and reload the review
                await fetchAssignedPapers();
                await loadDraftForRound(selectedPaper.submissionId, formData.round);
            } catch (error: any) {
                console.error('Error submitting review:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                } else {
                    alert(error.response?.data?.message || 'Failed to submit review');
                }
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleAcceptAssignment = async (submissionId: string) => {
        if (!window.confirm(`Are you sure you want to accept the review assignment for ${submissionId}?`)) return;

        try {
            const response = await api.post(
                `/api/reviewer/papers/${submissionId}/accept-assignment`,
                {}
            );

            if (response.data.success) {
                alert('Assignment accepted successfully! You can now view and review the paper.');
                fetchAssignedPapers(); // Refresh the list
            }
        } catch (error: any) {
            console.error('Error accepting assignment:', error);
            alert(error.response?.data?.message || 'Failed to accept assignment');
        }
    };

    const handleLogout = async () => {
        try {
            await api.post(`/api/auth/logout`);
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('isAuthenticated');
        window.dispatchEvent(new Event('authStateChanged'));
        navigate('/login');
    };

    const getDeadlineStatus = (deadline: string) => {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            return { status: 'overdue', text: `Overdue by ${Math.abs(daysLeft)} day(s)`, color: 'text-red-600' };
        } else if (daysLeft === 0) {
            return { status: 'today', text: 'Due today', color: 'text-orange-600' };
        } else if (daysLeft <= 1) {
            return { status: 'urgent', text: `Due in ${daysLeft} day`, color: 'text-orange-600' };
        } else {
            return { status: 'ok', text: `Due in ${daysLeft} days`, color: 'text-green-600' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading assigned papers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-full mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:justify-between xl:items-center">
                        <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-8 h-8 text-blue-600 shrink-0" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {isDirectReviewLink ? 'Paper Review' : 'Reviewer Dashboard'}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {isDirectReviewLink ? 'Review this paper' : 'Review assigned papers'}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        {!isDirectReviewLink && (
                            <div className="flex flex-wrap sm:flex-nowrap bg-gray-100 p-1 rounded-lg shadow-inner w-full xl:w-auto">
                                <button
                                    onClick={() => setDashboardTab('papers')}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 ${dashboardTab === 'papers'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Assigned Papers
                                </button>
                                <button
                                    onClick={() => {
                                        setDashboardTab('messages');
                                        fetchMessageThreads();
                                    }}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 ${dashboardTab === 'messages'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="relative">
                                        <MessageSquare className="w-4 h-4" />
                                        {messageThreads.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                    </div>
                                    Messages
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto xl:justify-end">
                            {isDirectReviewLink && (
                                <button
                                    onClick={() => navigate('/reviewer')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Home
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 min-w-0">
                {dashboardTab === 'papers' ? (
                    <>
                        {/* Papers List - Always visible at top */}
                        {papers.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                    Your Assigned Papers ({papers.length})
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {papers.map((paper) => {
                                        // Debug: Log paper details
                                        console.log('Paper Card:', {
                                            submissionId: paper.submissionId,
                                            assignmentDetails: paper.assignmentDetails,
                                            status: paper.assignmentDetails?.status
                                        });

                                        return (
                                            <div
                                                key={paper._id}
                                                className={`p-4 rounded-lg transition border-2 flex flex-col justify-between ${selectedPaper?._id === paper._id
                                                    ? 'bg-blue-100 border-blue-600 shadow-lg'
                                                    : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-white hover:shadow-md'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
                                                        <div className="flex-1">
                                                            <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                {paper.submissionId}
                                                            </span>
                                                            <h4 className="text-sm font-bold text-gray-800 mt-1 line-clamp-1">
                                                                {paper.paperTitle}
                                                            </h4>
                                                        </div>
                                                        {selectedPaper?._id === paper._id && (
                                                            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                        )}
                                                    </div>

                                                    <div className="space-y-1 mb-3">
                                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                                            <span className="font-semibold w-16">Author:</span> {paper.authorName}
                                                        </p>
                                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                                            <span className="font-semibold w-16">Category:</span> {paper.category}
                                                        </p>
                                                        {paper.assignmentDetails && (
                                                            <p className={`text-xs font-bold flex items-center gap-1 ${getDeadlineStatus(paper.assignmentDetails.deadline).color}`}>
                                                                <Clock className="w-3 h-3" />
                                                                {getDeadlineStatus(paper.assignmentDetails.deadline).text}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-3 border-t border-gray-100">
                                                    {paper.assignmentDetails && (
                                                        <div className="space-y-3">
                                                            {/* Status Indicator */}
                                                            <div className={`text-center py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${paper.assignmentDetails.status === 'Accepted'
                                                                ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                                                                : paper.assignmentDetails.status === 'Rejected'
                                                                    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                                                    : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 animate-pulse'
                                                                }`}>
                                                                {paper.assignmentDetails.status === 'Accepted' && ' Assignment Accepted'}
                                                                {paper.assignmentDetails.status === 'Pending' && '⏳ Pending Your Response'}
                                                                {paper.assignmentDetails.status === 'Rejected' && '❌ Assignment Rejected'}
                                                                {(paper.assignmentDetails.status === 'Submitted' || paper.assignmentDetails.status === 'Review Submitted') && '✓ Review Successfully Submitted'}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            {paper.assignmentDetails.status === 'Pending' ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAcceptAssignment(paper._id);
                                                                    }}
                                                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Accept Review Assignment
                                                                </button>
                                                            ) : (['Accepted', 'Submitted', 'Review Submitted'].includes(paper.assignmentDetails.status)) ? (
                                                                <button
                                                                    onClick={() => loadPaperForReview(paper._id)}
                                                                    className="w-full py-2 bg-gray-800 hover:bg-black text-white rounded-lg font-bold text-xs transition shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    {paper.assignmentDetails.status === 'Accepted' ? 'View & Review Paper' : 'View Submitted Review'}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No Papers Message */}
                        {papers.length === 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Papers Assigned</h3>
                                <p className="text-gray-600">You don't have any papers assigned for review yet.</p>
                            </div>
                        )}

                        {/* Review Section - Show after paper is selected */}
                        {selectedPaper && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Side - PDF Viewer (60%) */}
                                <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
                                    <div className="mb-4 border-b pb-3">
                                        <div className="flex flex-wrap gap-3 items-center">
                                            <button
                                                onClick={() => setShowChat(!showChat)}
                                                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${showChat
                                                    ? 'bg-purple-700 text-white shadow-inner'
                                                    : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-sm'
                                                    }`}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {showChat ? 'Close Chat' : 'Chat with Editor'}
                                            </button>
                                            <button
                                                onClick={() => setSelectedPaper(null)}
                                                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2 text-sm"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Back to List
                                            </button>

                                            {/* View Author Response Button - Show only for Round 2+ */}
                                            {formData.round > 1 && paperRevisionData?.responsePdfUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        window.open(paperRevisionData.responsePdfUrl, '_blank');
                                                    }}
                                                    className="px-3 py-1 bg-green-50 border border-green-300 text-green-700 rounded hover:bg-green-100 font-semibold text-sm flex items-center gap-1"
                                                >
                                                    📝 View Author Response PDF
                                                </button>
                                            )}

                                            {/* View Both PDFs Button - Show only for Round 2+ AND if BOTH PDFs exist */}
                                            {formData.round > 1 && paperRevisionData?.highlightedPdfUrl && paperRevisionData?.responsePdfUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBothPdfsModal(!showBothPdfsModal)}
                                                    className={`px-3 py-1 border rounded font-semibold text-sm flex items-center gap-1 ${showBothPdfsModal
                                                        ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                                                        : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                                                        }`}
                                                >
                                                    {showBothPdfsModal ? '✕ Close' : '📄📄 Compare PDFs'}
                                                </button>
                                            )}

                                            {/* Review Round Indicator */}
                                            <div className="ml-auto bg-blue-100 px-3 py-1 rounded-full text-sm font-semibold text-blue-800">
                                                📋 Review Round {formData.round}
                                            </div>
                                        </div>

                                        {/* Chat Section */}
                                        {showChat && selectedPaper && (
                                            <div className="mb-6">
                                                <ReviewerChat
                                                    submissionId={selectedPaper.submissionId}
                                                    reviewerId={currentUser._id || ''}
                                                    reviewerName={currentUser.username || 'Reviewer'}
                                                    role="reviewer"
                                                    onClose={() => setShowChat(false)}
                                                />
                                            </div>
                                        )}

                                        <h2 className="text-xl font-semibold text-gray-800">{selectedPaper.paperTitle}</h2>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span><strong>ID:</strong> {selectedPaper.submissionId}</span>
                                            <span><strong>Author:</strong> {selectedPaper.authorName}</span>
                                            <span><strong>Category:</strong> {selectedPaper.category}</span>
                                        </div>
                                        {selectedPaper.assignmentDetails && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock className="w-4 h-4" />
                                                <span className={`text-sm font-medium ${getDeadlineStatus(selectedPaper.assignmentDetails.deadline).color}`}>
                                                    {getDeadlineStatus(selectedPaper.assignmentDetails.deadline).text}
                                                </span>
                                            </div>
                                        )}
                                        {/* PDF Type Indicator */}
                                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            {formData.round === 1 ? (
                                                '📄 Reviewing: Original submission'
                                            ) : paperRevisionData ? (
                                                '📝 Reviewing: Author\'s revised version (Highlighted PDF) + Response PDF available below'
                                            ) : (
                                                '⚠️ No revision data available for this round'
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline PDF Comparison - Show only for Round 2+ AND if revision data exists */}
                                    {formData.round > 1 && showBothPdfsModal && paperRevisionData && paperRevisionData.highlightedPdfUrl && paperRevisionData.responsePdfUrl && (
                                        <div className="mb-4 border-2 border-purple-300 rounded-lg overflow-hidden">
                                            {/* PDF Tabs */}
                                            <div className="flex border-b bg-gray-50">
                                                <button
                                                    onClick={() => setActivePdfInModal('highlighted')}
                                                    className={`flex-1 px-4 py-3 font-semibold text-center transition ${activePdfInModal === 'highlighted'
                                                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    📝 Highlighted PDF (Author's Changes)
                                                </button>
                                                <button
                                                    onClick={() => setActivePdfInModal('response')}
                                                    className={`flex-1 px-4 py-3 font-semibold text-center transition ${activePdfInModal === 'response'
                                                        ? 'border-b-2 border-green-600 text-green-600 bg-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    📄 Author Response Document
                                                </button>
                                            </div>

                                            {/* PDF Viewer */}
                                            <div className="bg-gray-100" style={{ height: '60vh' }}>
                                                {activePdfInModal === 'highlighted' && paperRevisionData.highlightedPdfUrl ? (
                                                    <iframe
                                                        src={paperRevisionData.highlightedPdfUrl}
                                                        className="w-full h-full"
                                                        title="Highlighted PDF"
                                                    />
                                                ) : activePdfInModal === 'response' && paperRevisionData.responsePdfUrl ? (
                                                    <iframe
                                                        src={paperRevisionData.responsePdfUrl}
                                                        className="w-full h-full"
                                                        title="Response PDF"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-gray-500">PDF not available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* PDF Viewer */}
                                    <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ height: showBothPdfsModal ? 'calc(50vh - 140px)' : 'calc(100vh - 280px)' }}>
                                        {pdfUrl ? (
                                            <iframe
                                                src={pdfUrl}
                                                className="w-full h-full"
                                                title="PDF Viewer"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500">Loading PDF...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side - Review Form (40%) */}
                                <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Send className="w-5 h-5 text-blue-600" />
                                        Submit Review
                                    </h3>

                                    {/* Review Round Selector with Dynamic Rounds based on Revision */}
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Review Round
                                        </label>
                                        <select
                                            value={formData.round}
                                            onChange={(e) => {
                                                const selectedRound = parseInt(e.target.value);
                                                setFormData({ ...formData, round: selectedRound });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {/* Always show Round 1 for initial review */}
                                            <option value="1">Round 1 - Initial Review</option>

                                            {/* Show Round 2 if at least 1 revision exists */}
                                            {totalRevisions >= 1 && (
                                                <option value="2">Round 2 - After Revision 1</option>
                                            )}

                                            {/* Show Round 3 if at least 2 revisions exist */}
                                            {totalRevisions >= 2 && (
                                                <option value="3">Round 3 - After Revision 2</option>
                                            )}

                                            {/* Show Round 4+ for additional revisions */}
                                            {totalRevisions >= 3 && (
                                                <option value="4">Round 4 - After Revision 3</option>
                                            )}
                                        </select>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {formData.round === 1
                                                ? '📄 Reviewing original submission'
                                                : `📝 Reviewing Revision ${formData.round - 1} (Author's revised version)`}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Total revisions: {totalRevisions}
                                        </p>
                                    </div>

                                    {/* Previous Reviews - Show if any exist */}
                                    {previousReviews.length > 0 && (
                                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                                                📜 Your Previous Reviews for This Paper
                                            </h4>
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {previousReviews.map((review, index) => (
                                                    <div key={index} className="p-3 bg-white rounded border border-amber-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-bold text-blue-700">
                                                                Round {review.round} Review
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(review.submittedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 text-xs">
                                                            <p>
                                                                <strong>Recommendation:</strong>{' '}
                                                                <span className={`font-semibold ${review.recommendation === 'Accept' ? 'text-green-600' :
                                                                    review.recommendation === 'Reject' ? 'text-red-600' :
                                                                        'text-orange-600'
                                                                    }`}>
                                                                    {review.recommendation}
                                                                </span>
                                                            </p>
                                                            <p><strong>Overall Rating:</strong> {review.overallRating}/5</p>
                                                            {review.strengths && (
                                                                <p className="mt-2">
                                                                    <strong>Strengths:</strong> {review.strengths}
                                                                </p>
                                                            )}
                                                            {review.weaknesses && (
                                                                <p className="mt-1">
                                                                    <strong>Weaknesses:</strong> {review.weaknesses}
                                                                </p>
                                                            )}
                                                            {review.commentsToEditor && (
                                                                <p className="mt-1">
                                                                    <strong>Comments to Editor:</strong> {review.commentsToEditor}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-amber-700 mt-2">
                                                ℹ️ These are your previously submitted reviews. Use them as reference when evaluating revisions.
                                            </p>
                                        </div>
                                    )}

                                    {/* Comments */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Review Comments (Internal - Not Sent to Author) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.comments}
                                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            placeholder="Internal comments for your records..."
                                            required
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-500">These comments are for system tracking only and won't be sent to the author.</p>
                                            <p className={`text-xs font-semibold ${formData.comments.trim().length >= 20 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formData.comments.trim().length} / 20 characters
                                            </p>
                                        </div>
                                    </div>

                                    {/* Comments to Editor */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Private Comments to Editor (Will Not Be Shared to Author) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.commentsToEditor}
                                            onChange={(e) => setFormData({ ...formData, commentsToEditor: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            rows={3}
                                            placeholder="Your private comments and observations for the editor only (confidential)..."
                                            required
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-red-600">These comments are PRIVATE and will NOT be sent to the author. Only the editor will see these.</p>
                                            <p className={`text-xs font-semibold ${formData.commentsToEditor.trim().length >= 20 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formData.commentsToEditor.trim().length} / 20 characters
                                            </p>
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Strengths
                                        </label>
                                        <textarea
                                            value={formData.strengths}
                                            onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={2}
                                            placeholder="What are the paper's strengths?"
                                        />
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weaknesses
                                        </label>
                                        <textarea
                                            value={formData.weaknesses}
                                            onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={2}
                                            placeholder="What are the paper's weaknesses?"
                                        />
                                    </div>

                                    {/* Ratings */}
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Ratings (1-5)</h4>

                                        {/* Overall Rating */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Overall Rating
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={formData.overallRating}
                                                    onChange={(e) => setFormData({ ...formData, overallRating: parseInt(e.target.value) })}
                                                    className="flex-1"
                                                />
                                                <span className="text-sm font-bold text-blue-600 w-6">{formData.overallRating}</span>
                                            </div>
                                        </div>

                                        {/* Novelty Rating */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Novelty/Originality
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={formData.noveltyRating}
                                                    onChange={(e) => setFormData({ ...formData, noveltyRating: parseInt(e.target.value) })}
                                                    className="flex-1"
                                                />
                                                <span className="text-sm font-bold text-blue-600 w-6">{formData.noveltyRating}</span>
                                            </div>
                                        </div>

                                        {/* Quality Rating */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Technical Quality
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={formData.qualityRating}
                                                    onChange={(e) => setFormData({ ...formData, qualityRating: parseInt(e.target.value) })}
                                                    className="flex-1"
                                                />
                                                <span className="text-sm font-bold text-blue-600 w-6">{formData.qualityRating}</span>
                                            </div>
                                        </div>

                                        {/* Clarity Rating */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Clarity/Presentation
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={formData.clarityRating}
                                                    onChange={(e) => setFormData({ ...formData, clarityRating: parseInt(e.target.value) })}
                                                    className="flex-1"
                                                />
                                                <span className="text-sm font-bold text-blue-600 w-6">{formData.clarityRating}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendation */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Recommendation <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.recommendation}
                                            onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="Accept"> Accept</option>
                                            <option value="Conditional Accept">✔️ Conditional Accept</option>
                                            <option value="Minor Revision">📝 Minor Revision</option>
                                            <option value="Major Revision">📋 Major Revision</option>
                                            <option value="Reject">❌ Reject</option>
                                        </select>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={submitting || formData.comments.trim().length < 20 || formData.commentsToEditor.trim().length < 20}
                                        className={`w-full px-4 py-3 ${currentRoundSubmitted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold`}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                {currentRoundSubmitted ? 'Updating...' : 'Submitting...'}
                                            </>
                                        ) : (
                                            <>
                                                {currentRoundSubmitted ? (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        ✏️ Edit Review
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Submit Review
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {currentRoundSubmitted ? (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-xs text-green-800 text-center">
                                                ℹ️ This review has been submitted. You can still edit and update it.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            ⚠️ Both comment fields must have at least 20 characters
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Messages Tab View */
                    <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[600px]">
                        <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-[600px]">
                            {/* Conversations List */}
                            <div className="border-r border-gray-200">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                        Your Conversations
                                    </h3>
                                </div>
                                <div className="overflow-y-auto">
                                    {messageThreads.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No messages yet.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {messageThreads.map((thread) => {
                                                const paper = papers.find(p => p.submissionId === thread.submissionId);
                                                return (
                                                    <button
                                                        key={thread._id}
                                                        onClick={() => {
                                                            if (paper) {
                                                                const assignmentStatus = paper.assignmentDetails?.status;
                                                                const allowedStatuses = ['Accepted', 'Submitted', 'Review Submitted'];

                                                                if (allowedStatuses.includes(assignmentStatus || '')) {
                                                                    loadPaperForReview(paper.submissionId);
                                                                    setShowChat(true);
                                                                    setDashboardTab('papers');
                                                                } else {
                                                                    alert(`⚠️ You need to accept this assignment before you can view the paper details. Current status: ${assignmentStatus || 'Unknown'}`);
                                                                }
                                                            }
                                                        }}
                                                        className="w-full p-4 text-left hover:bg-blue-50 transition"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-sm font-bold text-blue-600">{thread.submissionId}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {new Date(thread.lastMessageAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-gray-800 truncate mb-1">
                                                            {paper?.paperTitle || 'Unknown Paper'}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 truncate italic">
                                                            Last message: {thread.conversation[thread.conversation.length - 1]?.message}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Welcome / Selection Area */}
                            <div className="md:col-span-2 bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
                                <div className="max-w-md">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                                        <MessageSquare className="w-16 h-16 text-blue-100 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">Editor Communications</h3>
                                        <p className="text-gray-600 text-sm">
                                            Select a conversation from the list to discuss paper details or review requirements with your Editor.
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        💡 Messages are private between you and the assigned Editor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default ReviewerDashboard;
