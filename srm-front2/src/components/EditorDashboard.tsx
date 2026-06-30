import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import api, { API_BASE_URL } from '../config/api';
import { useWebSocket } from '../context/WebSocketContext';
import {
    LayoutDashboard,
    FileText,
    Users,
    CheckCircle,
    Clock,
    Menu,
    X,
    Eye,
    UserPlus,
    TrendingUp,
    AlertCircle,
    Search,
    Filter,
    Check,
    Cloud,
    RefreshCw,
    MessageSquare,
    Send,
    History,
} from 'lucide-react';
import ReviewerFilterPanel, { Reviewer } from './ReviewerFilterPanel';
import PDFManagement from './PDFManagement';
import AdminSelectedUsers from './AdminSelectedUsers';

import { Paper, DashboardStats, NavItem, StatusBadge } from './editor/Common';
import { DecisionPanel } from './editor/DecisionPanel';
import { AssignReviewersPanel } from './editor/AssignReviewersPanel';
import { ReviewersTab } from './editor/ReviewersTab';
import { PapersTab } from './editor/PapersTab';
import { PaperDetailsView } from './editor/PaperDetailsView';
import { DashboardHome } from './editor/DashboardHome';
import { CreateReviewerForm } from './editor/CreateReviewerForm';
import { HistoryModal } from './editor/HistoryModal';
import { useEditorDashboard } from '../hooks/useEditorDashboard';

const EditorDashboard = React.memo(() => {
    const navigate = useNavigate();
    const { 
        papers, 
        setPapers, 
        reviewers, 
        setReviewers, 
        stats, 
        loading, 
        error, 
        fetchDashboardData 
    } = useEditorDashboard();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Create reviewer states
    const [showCreateReviewer, setShowCreateReviewer] = useState(false);
    const [isCreatingReviewer, setIsCreatingReviewer] = useState(false);

    const generateRandomPassword = useCallback((length = 10) => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let retVal = '';
        for (let i = 0; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return retVal;
    }, []);

    const [newReviewer, setNewReviewer] = useState({
        email: '',
        username: '',
        password: generateRandomPassword()
    });

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [activeTab]);

    // Paper details view state
    const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
    const [paperReviewers, setPaperReviewers] = useState<any[]>([]);
    const [paperReReviews, setPaperReReviews] = useState<any[]>([]);
    const [reviewerListLoading, setReviewerListLoading] = useState(false);
    const [paperDetailsTab, setPaperDetailsTab] = useState<'details' | 'reviewers'>('details');

    const [selectedReviewForDetails, setSelectedReviewForDetails] = useState<{ reviewId: string; submissionId: string } | null>(null);
    const [activeChat, setActiveChat] = useState<{ submissionId: string; reviewerId: string; reviewerName: string; reviewId?: string | null } | null>(null);
    const [selectedPaperForAuthorMessage, setSelectedPaperForAuthorMessage] = useState<string | null>(null);

    const { on, off } = useWebSocket();

    const [, setFilteredReviewers] = useState<any[]>([]);
    const [selectedReviewerFilter, setSelectedReviewerFilter] = useState<any | null>(null);

    // Author message states
    const [authorMessageText, setAuthorMessageText] = useState('');
    const [authorMessageLoading, setAuthorMessageLoading] = useState(false);
    const [showDetailInlineMessage, setShowDetailInlineMessage] = useState(false);

    // Decision-making states
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState<'accept' | 'reject' | 'revision' | null>(null);

    // Assign reviewers states
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Reviewer management states
    const [reviewerInquiryModal, setReviewerInquiryModal] = useState<{ reviewerId: string; reviewerName: string } | null>(null);
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [inquiryLoading, setInquiryLoading] = useState(false);

    const [allReviewersSearchTerm, setAllReviewersSearchTerm] = useState('');
    const [expandedReviewerId, setExpandedReviewerId] = useState<string | null>(null);

    const [expandedReviewCards, setExpandedReviewCards] = useState<Set<string>>(new Set());
    const [expandedAuthorEmail, setExpandedAuthorEmail] = useState<string | null>(null);

    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReviewData, setEditReviewData] = useState<any>({
        recommendation: '',
        overallRating: 3,
        comments: '',
        commentsToEditor: ''
    });
    const [isLoadingReviewEdit, setIsLoadingReviewEdit] = useState(false);

    const [editingReviewerId, setEditingReviewerId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({ username: '', email: '' });
    const [isLoadingReviewerAction, setIsLoadingReviewerAction] = useState(false);

    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Review search state - REMOVED (Reviews tab removed)
    // const [reviewSearchTerm, setReviewSearchTerm] = useState('');


    // WebSocket event listeners for real-time updates
    useEffect(() => {
        // Listen for paper updates
        const handlePaperUpdate = (data: any) => {
            console.log('WebSocket: Paper updated', data);
            fetchDashboardData(); // Refresh data on update
        };

        const handleNewSubmission = (data: any) => {
            console.log('WebSocket: New paper submission', data);
            fetchDashboardData(); // Refresh to show new paper
        };

        const handleReviewAssigned = (data: any) => {
            console.log('WebSocket: Review assigned', data);
            fetchDashboardData(); // Refresh to show assignment
        };

        const handleStatusChange = (data: any) => {
            console.log('WebSocket: Paper status changed', data);
            fetchDashboardData(); // Refresh on status change
        };

        on('paper:updated', handlePaperUpdate);
        on('paper:new', handleNewSubmission);
        on('review:assigned', handleReviewAssigned);
        on('paper:status-changed', handleStatusChange);

        return () => {
            off('paper:updated', handlePaperUpdate);
            off('paper:new', handleNewSubmission);
            off('review:assigned', handleReviewAssigned);
            off('paper:status-changed', handleStatusChange);
        };
    }, [on, off]);

    // Fetch reviews and reviewers for the viewing paper
    useEffect(() => {
        if (viewingPaper) {
            fetchPaperReviewsAndReviewers(viewingPaper._id);
        }
    }, [viewingPaper?._id, papers, fetchDashboardData]);

    const handleCreateReviewer = async () => {
        setIsCreatingReviewer(true);
        try {
            await api.post(`/api/editor/reviewers`, newReviewer);

            alert('Reviewer created successfully! Credentials sent to their email.');
            setShowCreateReviewer(false);
            setNewReviewer({ email: '', username: '', password: generateRandomPassword() });
            fetchDashboardData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create reviewer');
        } finally {
            setIsCreatingReviewer(false);
        }
    };


    // fetchAllReviews removed - Reviews tab removed

    const fetchPaperReviewsAndReviewers = async (paperId: string) => {
        try {
            setReviewerListLoading(true);

            // Fetch reviews for this paper
            const reviewsRes = await api.get(`/api/editor/papers/${paperId}/reviews`);

            // Fetch re-reviews (Round 2) for this paper if status is "Revision Required"
            let reReviewsData: any[] = [];
            try {
                const reReviewsRes = await api.get(`/api/editor/papers/${paperId}/re-reviews`);
                reReviewsData = reReviewsRes.data.reReviews || [];
            } catch (reReviewError) {
                console.log('No re-reviews found yet:', reReviewError);
            }
            setPaperReReviews(reReviewsData);

            // Fetch reviewers and their assignments for this paper
            const paper = papers.find(p => p._id === paperId);
            if (paper?.assignedReviewers) {
                const reviewersWithStatus = paper.assignedReviewers.map((reviewer: any) => {
                    const rId = typeof reviewer === 'string' ? reviewer : reviewer._id;
                    const rObj = typeof reviewer === 'object' ? reviewer : reviewers.find(r => r._id === rId);

                    const review = (reviewsRes.data.reviews || []).find(
                        (r: any) => r.reviewer?._id === rId || r.reviewer === rId
                    );
                    // Check if reviewer has submitted re-review
                    const reReview = reReviewsData.find(
                        (rr: any) => rr.reviewerId === rId || rr.reviewerId?._id === rId
                    );
                    return {
                        ...(rObj || {}),
                        _id: rId,
                        reviewStatus: review ? 'Submitted' : 'Pending',
                        review: review || null,
                        reReview: reReview || null
                    };
                });
                setPaperReviewers(reviewersWithStatus);
            }
        } catch (error: any) {
            console.error('Error fetching paper reviews and reviewers:', error);
            setPaperReviewers([]);
            setPaperReReviews([]);
        } finally {
            setReviewerListLoading(false);
        }
    };

    const handleSendAuthorMessage = async () => {
        if (!viewingPaper || !authorMessageText.trim()) return;

        setAuthorMessageLoading(true);
        try {
            const response = await api.post(`/api/editor/send-message-to-author`, {
                submissionId: viewingPaper.submissionId,
                authorEmail: viewingPaper.email,
                authorName: viewingPaper.authorName,
                message: authorMessageText
            });

            if (response.data.success) {
                alert('Message sent to author successfully!');
                setAuthorMessageText('');
                setShowDetailInlineMessage(false);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to send message'));
            }
        } catch (error) {
            console.error('Error sending author message:', error);
            alert('Error sending author message');
        } finally {
            setAuthorMessageLoading(false);
        }
    };


    // Handle paper acceptance
    const handleAcceptPaper = async () => {
        if (!viewingPaper) return;

        setDecisionLoading(true);
        try {
                                                                                    const response = await api.post(
                `/api/editor/accept-paper`,
                {
                    paperId: viewingPaper._id
                }
            );

            if (response.data.success) {
                alert('Paper accepted! Acceptance email sent to author.');
                setViewingPaper(null);
                // Refresh papers list
                const papersRes = await api.get(`/api/editor/papers`);
                setPapers(papersRes.data.papers || []);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to accept paper'));
            }
        } catch (error) {
            console.error('Error accepting paper:', error);
            alert('Error accepting paper');
        } finally {
            setDecisionLoading(false);
        }
    };



    // Handle send re-review emails
    const handleSendReReviewEmails = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!viewingPaper) {
            alert('No paper selected');
            return;
        }

        setDecisionLoading(true);
        try {
            const response = await api.post(
                `/api/editor/send-re-review-emails`,
                { paperId: viewingPaper._id },
            );

            if (response.data.success) {
                alert(`Re-review emails sent to ${response.data.emailsSent} reviewer(s)!`);
                fetchPaperReviewsAndReviewers(viewingPaper._id);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to send re-review emails'));
            }
        } catch (error: any) {
            console.error('Error sending re-review emails:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to send re-review emails';
            alert('Error: ' + errorMsg);
        } finally {
            setDecisionLoading(false);
        }
    };

    // Handle send inquiry to reviewer
    const handleSendInquiry = async () => {
        if (!reviewerInquiryModal || !inquiryMessage.trim() || !viewingPaper) {
            alert('Please provide a message');
            return;
        }

        setInquiryLoading(true);
        try {
                                                                                    const response = await api.post(
                `/api/editor/send-reviewer-inquiry`,
                {
                    paperId: viewingPaper._id,
                    reviewerId: reviewerInquiryModal.reviewerId,
                    message: inquiryMessage
                }
            );

            if (response.data.success) {
                alert('Inquiry sent successfully to ' + reviewerInquiryModal.reviewerName);
                setReviewerInquiryModal(null);
                setInquiryMessage('');
            } else {
                alert('Error: ' + (response.data.message || 'Failed to send inquiry'));
            }
        } catch (error) {
            console.error('Error sending inquiry:', error);
            alert('Error sending inquiry');
        } finally {
            setInquiryLoading(false);
        }
    };

    // ========== NEW CRUD FUNCTIONS FOR ALL REVIEWERS PAGE ==========

    // Update reviewer details (Edit)
    const handleEditReviewer = async (reviewerId: string) => {
        if (!editFormData.username || !editFormData.email) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoadingReviewerAction(true);
        try {
            const response = await api.put(
                `/api/editor/reviewers/${reviewerId}`,
                {
                    username: editFormData.username,
                    email: editFormData.email
                }
            );

            if (response.data.success) {
                alert(' Reviewer updated successfully!');
                setEditingReviewerId(null);
                setEditFormData({ username: '', email: '' });

                // Refresh reviewers list
                const reviewersRes = await api.get(`/api/editor/reviewers`);
                setReviewers(reviewersRes.data.reviewers || []);
            } else {
                alert('❌ Error: ' + (response.data.message || 'Failed to update reviewer'));
            }
        } catch (error: any) {
            console.error('Error updating reviewer:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update reviewer';
            alert('❌ Error: ' + errorMsg);
        } finally {
            setIsLoadingReviewerAction(false);
        }
    };

    // Delete reviewer (Remove from system)
    const handleDeleteReviewerFromSystem = async (reviewerId: string, reviewerName: string) => {
        if (!window.confirm(`Are you sure you want to delete reviewer "${reviewerName}"? This action cannot be undone.`)) {
            return;
        }

        setIsLoadingReviewerAction(true);
        try {
                const response = await api.delete(
                `/api/editor/reviewers/${reviewerId}`,
                {
                }
            );

            if (response.data.success) {
                alert(' Reviewer deleted successfully!');

                // Refresh reviewers list
                const reviewersRes = await api.get(`/api/editor/reviewers`);
                setReviewers(reviewersRes.data.reviewers || []);

                // Also refresh papers list to update counts
                const papersRes = await api.get(`/api/editor/papers`);
                setPapers(papersRes.data.papers || []);
            } else {
                alert('❌ Error: ' + (response.data.message || 'Failed to delete reviewer'));
            }
        } catch (error: any) {
            console.error('Error deleting reviewer:', error);
            const errorMsg = error.response?.data?.message || 'Failed to delete reviewer';
            alert('❌ Error: ' + errorMsg);
        } finally {
            setIsLoadingReviewerAction(false);
        }
    };

    // Start editing a reviewer
    const startEditReviewer = (reviewer: any) => {
        setEditingReviewerId(reviewer._id);
        setEditFormData({
            username: reviewer.username || '',
            email: reviewer.email || ''
        });
    };

    // Cancel editing
    const cancelEditReviewer = () => {
        setEditingReviewerId(null);
        setEditFormData({ username: '', email: '' });
    };

    // Start editing a review
    const startEditReview = (review: any) => {
        setEditingReviewId(review._id);
        setEditReviewData({
            recommendation: review.recommendation || '',
            overallRating: review.overallRating || 3,
            comments: review.comments || '',
            commentsToEditor: review.commentsToEditor || ''
        });
    };

    // Cancel editing review
    const cancelEditReview = () => {
        setEditingReviewId(null);
        setEditReviewData({
            recommendation: '',
            overallRating: 3,
            comments: '',
            commentsToEditor: ''
        });
    };

    // Update review
    const updateReview = async (reviewId: string) => {
        if (!editReviewData.recommendation || !editReviewData.comments.trim() || !editReviewData.commentsToEditor.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (window.confirm('Are you sure you want to update this review?')) {
            setIsLoadingReviewEdit(true);
            try {
                const response = await api.put(
                    `/api/editor/reviews/${reviewId}`,
                    editReviewData
                );

                if (response.data.success) {
                    alert(' Review updated successfully!');
                    setEditingReviewId(null);
                    // Refresh the paper view
                    if (viewingPaper?._id) {
                        await fetchPaperReviewsAndReviewers(viewingPaper._id);
                    }
                } else {
                    alert('❌ Error: ' + (response.data.message || 'Failed to update review'));
                }
            } catch (error: any) {
                console.error('Error updating review:', error);
                alert('❌ Error: ' + (error.response?.data?.message || 'Failed to update review'));
            } finally {
                setIsLoadingReviewEdit(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5A051] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Editor Dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error message if access denied or connection error
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-lg p-8 max-w-md text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="space-y-2">
                        {error.includes('backend') || error.includes('offline') ? (
                            <>
                                <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                                    Make sure you are connected to internet<br />
                                    {/* <code>npm start</code> in srm-back folder */}
                                </p>
                            </>
                        ) : null}
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-[#F5A051] text-white py-2 rounded hover:bg-orange-600 transition mt-4"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen min-h-0 min-w-0 bg-gray-50 relative">
            {mobileDrawerOpen && (
                <button
                    type="button"
                    className="lg:hidden fixed inset-0 z-30 bg-black/50"
                    aria-label="Close menu"
                    onClick={() => setMobileDrawerOpen(false)}
                />
            )}
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64 lg:w-64' : 'w-64 lg:w-20'} bg-white border-r border-gray-200 text-gray-800 transition-all duration-300 flex flex-col shrink-0 h-full fixed lg:static inset-y-0 left-0 z-40 max-lg:max-w-[85vw] max-lg:transition-transform max-lg:duration-200 ${mobileDrawerOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'} lg:translate-x-0`}>
                {/* Logo */}
                <div className="p-6 flex items-center justify-between border-b border-gray-200">
                    {sidebarOpen && <h1 className="text-xl font-bold">Editor Panel</h1>}
                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
                                setMobileDrawerOpen(false);
                            } else {
                                setSidebarOpen(!sidebarOpen);
                            }
                        }}
                        className="p-2 hover:bg-gray-100 rounded"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <NavItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        collapsed={!sidebarOpen}
                    />
                    <NavItem
                        icon={FileText}
                        label="Papers"
                        active={activeTab === 'papers'}
                        onClick={() => setActiveTab('papers')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={Cloud}
                        label="PDF Management"
                        active={activeTab === 'pdfs'}
                        onClick={() => setActiveTab('pdfs')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={Users}
                        label="Create Reviewer"
                        active={activeTab === 'createReviewer'}
                        onClick={() => setActiveTab('createReviewer')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={Users}
                        label="All Reviewers"
                        active={activeTab === 'allReviewers'}
                        onClick={() => setActiveTab('allReviewers')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={CheckCircle}
                        label="Selected Users"
                        active={activeTab === 'selectedUsers'}
                        onClick={() => setActiveTab('selectedUsers')}
                        collapsed={!sidebarOpen}
                    />
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={async () => {
                            try {
                                await api.post(`/api/auth/logout`);
                            } catch (error) {
                                console.error('Logout error:', error);
                            }
                            localStorage.removeItem('isAuthenticated');
                            window.dispatchEvent(new Event('authStateChanged'));
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition"
                    >
                        <AlertCircle className="w-5 h-5" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 overflow-auto">
                {/* Header */}
                <div className="bg-white p-4 sm:p-6 flex items-start sm:items-center gap-3">
                    <button
                        type="button"
                        className="lg:hidden shrink-0 mt-1 p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={() => { setSidebarOpen(true); setMobileDrawerOpen(true); }}
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 min-w-0 break-words">
                        {activeTab === 'dashboard' && 'Editor Dashboard (Integrated Stats)'}
                        {activeTab === 'papers' && 'Manage Papers'}
                        {activeTab === 'pdfs' && 'PDF Management'}
                        {activeTab === 'createReviewer' && 'Create New Reviewer'}
                        {activeTab === 'allReviewers' && 'All Reviewers'}

                        {activeTab === 'selectedUsers' && 'Conference Selected Users'}
                    </h2>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6">
                    {activeTab === 'dashboard' && (
                        <DashboardHome 
                            stats={stats}
                            papers={papers}
                            onViewPaper={setViewingPaper}
                        />
                    )}

                    {activeTab === 'selectedUsers' && (
                        <AdminSelectedUsers />
                    )}

                    {activeTab === 'papers' && !viewingPaper && (
                        <PapersTab
                            papers={papers}
                            reviewers={reviewers}
                            onViewPaper={setViewingPaper}
                        />
                    )}

                    {/* Paper Details View - Side by side layout */}
                    {activeTab === 'papers' && viewingPaper && (
                        <PaperDetailsView
                            paper={viewingPaper}
                            onBack={() => setViewingPaper(null)}
                            activeTab={paperDetailsTab}
                            onTabChange={setPaperDetailsTab}
                            reviewers={reviewers}
                            onViewPDF={() => {
                                if (viewingPaper.pdfUrl) window.open(viewingPaper.pdfUrl, '_blank');
                                else alert('PDF not available');
                            }}
                            onShowHistory={() => setShowHistoryModal(true)}
                            onShowAssign={() => setShowAssignModal(true)}
                            onAccept={handleAcceptPaper}
                            onReject={() => setShowDecisionModal('reject')}
                            onRevision={() => setShowDecisionModal('revision')}
                            onSendReReview={handleSendReReviewEmails}
                            decisionLoading={decisionLoading}
                            authorMessage={{
                                text: authorMessageText,
                                setText: setAuthorMessageText,
                                isShowing: showDetailInlineMessage,
                                setShowing: setShowDetailInlineMessage,
                                isLoading: authorMessageLoading,
                                onSend: handleSendAuthorMessage
                            }}
                            reviewerData={{
                                list: paperReviewers,
                                isLoading: reviewerListLoading,
                                selectedReview: selectedReviewForDetails,
                                setSelectedReview: setSelectedReviewForDetails,
                                activeChat: activeChat,
                                setActiveChat: setActiveChat,
                                expandedCards: expandedReviewCards,
                                toggleExpandCard: (id) => {
                                    setExpandedReviewCards(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(id)) newSet.delete(id);
                                        else newSet.add(id);
                                        return newSet;
                                    });
                                },
                                editingReviewId: editingReviewId,
                                startEdit: startEditReview,
                                cancelEdit: cancelEditReview,
                                updateReview: updateReview,
                                editData: editReviewData,
                                setEditData: setEditReviewData,
                                isEditLoading: isLoadingReviewEdit
                            }}
                        />
                    )}




                    {/* Assign Reviewers Inline Panel */}
                    {showAssignModal && viewingPaper && (
                        <AssignReviewersPanel
                            paper={viewingPaper}
                            reviewers={reviewers}
                            assignedReviewers={paperReviewers}
                            onClose={() => setShowAssignModal(false)}
                            onSuccess={() => {
                                fetchPaperReviewsAndReviewers(viewingPaper._id);
                                fetchDashboardData();
                            }}
                            onInquiry={(reviewer) => setReviewerInquiryModal(reviewer)}
                        />
                    )}

                    {/* Reviewer Inquiry Inline Panel */}
                    {reviewerInquiryModal && (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Send Review Status Inquiry</h3>
                                <button
                                    onClick={() => {
                                        setReviewerInquiryModal(null);
                                        setInquiryMessage('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-700 mb-3">
                                    <strong>Reviewer:</strong> {reviewerInquiryModal.reviewerName}
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Message *
                                </label>
                                <textarea
                                    value={inquiryMessage}
                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                    placeholder="e.g., 'Hi, have you had a chance to review the paper? The deadline is approaching...'"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setReviewerInquiryModal(null);
                                        setInquiryMessage('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendInquiry}
                                    disabled={inquiryLoading || !inquiryMessage.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                                >
                                    {inquiryLoading ? 'Sending...' : 'Send Inquiry'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Revision Request Inline Panel */}
                    {(showDecisionModal === 'revision' || showDecisionModal === 'reject') && viewingPaper && (
                        <DecisionPanel
                            paper={viewingPaper}
                            paperReviewers={paperReviewers}
                            type={showDecisionModal}
                            onClose={() => setShowDecisionModal(null)}
                            onSuccess={() => {
                                setShowDecisionModal(null);
                                setViewingPaper(null);
                                fetchDashboardData();
                            }}
                        />
                    )}


                    {/* Reviews Tab - REMOVED */}

                    {activeTab === 'pdfs' && (
                        <div className="h-full flex flex-col">
                            <PDFManagement />
                        </div>
                    )}

                    {activeTab === 'createReviewer' && (
                        <CreateReviewerForm
                            newReviewer={newReviewer}
                            setNewReviewer={setNewReviewer}
                            onSubmit={handleCreateReviewer}
                            isLoading={isCreatingReviewer}
                            onGeneratePassword={() => setNewReviewer({ ...newReviewer, password: generateRandomPassword() })}
                        />
                    )}

                    {activeTab === 'allReviewers' && (
                        <ReviewersTab
                            reviewers={reviewers}
                            searchTerm={allReviewersSearchTerm}
                            onSearchChange={setAllReviewersSearchTerm}
                            onCreateClick={() => setShowCreateReviewer(true)}
                            onEditClick={startEditReviewer}
                            onDeleteClick={(id) => handleDeleteReviewerFromSystem(id, reviewers.find(r => r._id === id)?.username || '')}
                            expandedReviewerId={expandedReviewerId}
                            onToggleExpand={setExpandedReviewerId}
                        />
                    )}

                    {/* Paper Details Modal - Removed (now using side-by-side view instead) */}
                </div>
            </div >

            {/* Message to Reviewer Modal - REMOVED (showing inline in Reviewers tab instead) */}
            {showHistoryModal && viewingPaper && (
                <HistoryModal 
                    paper={viewingPaper} 
                    onClose={() => setShowHistoryModal(false)} 
                />
            )}
        </div >
    );
});


export default EditorDashboard;
