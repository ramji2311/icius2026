import React from 'react';
import { 
    X, MessageSquare, History, Users, Check, Eye, Send, 
    ChevronDown, ChevronUp, Clock, AlertCircle, Trash2, Edit2
} from 'lucide-react';
import { Paper, StatusBadge } from './Common';
import { DecisionPanel } from './DecisionPanel';
import ReviewerDetailsPanel from '../ReviewerDetailsPanel';
import ReviewerChat from '../ReviewerChat';

interface PaperDetailsViewProps {
    paper: Paper;
    onBack: () => void;
    activeTab: 'details' | 'reviewers';
    onTabChange: (tab: 'details' | 'reviewers') => void;
    reviewers: any[];
    onViewPDF: () => void;
    onShowHistory: () => void;
    onShowAssign: () => void;
    onAccept: () => void;
    onReject: () => void;
    onRevision: () => void;
    onSendReReview: () => void;
    decisionLoading: boolean;
    authorMessage: {
        text: string;
        setText: (text: string) => void;
        isShowing: boolean;
        setShowing: (show: boolean) => void;
        isLoading: boolean;
        onSend: () => void;
    };
    reviewerData: {
        list: any[];
        isLoading: boolean;
        selectedReview: any | null;
        setSelectedReview: (review: any | null) => void;
        activeChat: any | null;
        setActiveChat: (chat: any | null) => void;
        expandedCards: Set<string>;
        toggleExpandCard: (id: string) => void;
        editingReviewId: string | null;
        startEdit: (review: any) => void;
        cancelEdit: () => void;
        updateReview: (id: string) => void;
        editData: any;
        setEditData: (data: any) => void;
        isEditLoading: boolean;
    };
}

export const PaperDetailsView = React.memo(({
    paper,
    onBack,
    activeTab,
    onTabChange,
    reviewers,
    onViewPDF,
    onShowHistory,
    onShowAssign,
    onAccept,
    onReject,
    onRevision,
    onSendReReview,
    decisionLoading,
    authorMessage,
    reviewerData
}: PaperDetailsViewProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                <button
                    onClick={onBack}
                    className="group px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 flex items-center gap-2 transition-all font-bold border border-transparent hover:border-gray-200"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                    <StatusBadge status={paper.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => onTabChange('details')}
                                className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${
                                    activeTab === 'details' 
                                    ? 'text-[#F5A051] border-[#F5A051] bg-white' 
                                    : 'text-gray-400 border-transparent hover:text-gray-600'
                                }`}
                            >
                                Paper Information
                            </button>
                            <button
                                onClick={() => onTabChange('reviewers')}
                                className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${
                                    activeTab === 'reviewers' 
                                    ? 'text-[#F5A051] border-[#F5A051] bg-white' 
                                    : 'text-gray-400 border-transparent hover:text-gray-600'
                                }`}
                            >
                                Peer Review ({reviewerData.list.length})
                            </button>
                        </div>

                        <div className="p-8">
                            {activeTab === 'details' ? (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-gray-900 leading-tight">{paper.paperTitle}</h2>
                                        <p className="text-gray-500 font-medium flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">#{paper.submissionId}</span>
                                            <span>•</span>
                                            <span>Submitted on {new Date(paper.createdAt || '').toLocaleDateString()}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                            <h4 className="text-xs font-black text-[#F5A051] uppercase tracking-widest mb-4">Author Details</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Primary Author</p>
                                                    <p className="font-bold text-gray-900">{paper.authorName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Contact Email</p>
                                                    <p className="font-medium text-gray-700">{paper.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4">Paper Classification</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Field / Category</p>
                                                    <p className="font-bold text-gray-900">{paper.category}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">System Status</p>
                                                    <StatusBadge status={paper.status} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50">
                                        <button onClick={onViewPDF} className="px-6 py-3 bg-[#F5A051] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition">
                                            <Eye className="w-5 h-5" />
                                            View Full Paper
                                        </button>
                                        <button onClick={() => authorMessage.setShowing(!authorMessage.isShowing)} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 transition">
                                            <MessageSquare className="w-5 h-5" />
                                            Contact Author
                                        </button>
                                        <button onClick={onShowHistory} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition">
                                            <History className="w-5 h-5" />
                                            History
                                        </button>
                                    </div>

                                    {authorMessage.isShowing && (
                                        <div className="p-6 bg-orange-50 rounded-3xl border-2 border-orange-100 animate-in zoom-in-95">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-orange-900">Message to {paper.authorName}</h4>
                                                <button onClick={() => authorMessage.setShowing(false)} className="text-orange-400 hover:text-orange-600"><X /></button>
                                            </div>
                                            <textarea
                                                value={authorMessage.text}
                                                onChange={(e) => authorMessage.setText(e.target.value)}
                                                className="w-full p-4 border-2 border-transparent focus:border-[#F5A051] rounded-2xl outline-none min-h-[150px]"
                                                placeholder="Write your message to the author here..."
                                            />
                                            <div className="flex justify-end mt-4">
                                                <button 
                                                    onClick={authorMessage.onSend}
                                                    disabled={authorMessage.isLoading || !authorMessage.text.trim()}
                                                    className="px-8 py-3 bg-[#F5A051] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 disabled:opacity-50"
                                                >
                                                    {authorMessage.isLoading ? 'Sending...' : 'Send Message'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {reviewerData.isLoading ? (
                                        <div className="py-20 text-center">
                                            <div className="w-12 h-12 border-4 border-[#F5A051] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-500 font-bold">Loading reviewer data...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Detail Panel for selected review */}
                                            {reviewerData.selectedReview && (
                                                <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 animate-in slide-in-from-top-4 duration-300">
                                                    <ReviewerDetailsPanel
                                                        reviewId={reviewerData.selectedReview.reviewId}
                                                        submissionId={reviewerData.selectedReview.submissionId}
                                                        onClose={() => reviewerData.setSelectedReview(null)}
                                                    />
                                                </div>
                                            )}

                                            {/* Chat Panel */}
                                            {reviewerData.activeChat && (
                                                <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 animate-in slide-in-from-top-4 duration-300">
                                                    <ReviewerChat
                                                        submissionId={reviewerData.activeChat.submissionId}
                                                        reviewerId={reviewerData.activeChat.reviewerId}
                                                        reviewerName={reviewerData.activeChat.reviewerName}
                                                        role="editor"
                                                        reviewId={reviewerData.activeChat.reviewId}
                                                        onClose={() => reviewerData.setActiveChat(null)}
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {reviewerData.list.map((reviewer, idx) => (
                                                    <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900">{reviewer.username || reviewer.email}</h4>
                                                                <p className="text-xs text-gray-500">{reviewer.email}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                    reviewer.reviewStatus === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                    {reviewer.reviewStatus}
                                                                </span>
                                                                <button
                                                                    onClick={() => reviewerData.setActiveChat({
                                                                        submissionId: paper.submissionId,
                                                                        reviewerId: reviewer._id,
                                                                        reviewerName: reviewer.username || reviewer.email,
                                                                        reviewId: reviewer.review?._id
                                                                    })}
                                                                    className="p-2 bg-orange-50 text-[#F5A051] rounded-lg hover:bg-orange-100 transition"
                                                                    title="Chat with Reviewer"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {reviewer.review ? (
                                                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Recommendation</p>
                                                                <p className={`font-bold ${
                                                                    reviewer.review.recommendation === 'Accept' ? 'text-green-600' : 'text-orange-600'
                                                                }`}>
                                                                    {reviewer.review.recommendation}
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-2 line-clamp-3 italic">
                                                                    "{reviewer.review.commentsToEditor || reviewer.review.comments}"
                                                                </p>
                                                                <button 
                                                                    onClick={() => reviewerData.setSelectedReview({
                                                                        reviewId: reviewer.review._id,
                                                                        submissionId: paper.submissionId
                                                                    })}
                                                                    className="w-full mt-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition"
                                                                >
                                                                    View Full Review
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-200 text-center">
                                                                <Clock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                                                <p className="text-xs text-gray-400 font-medium">Awaiting Submission</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {reviewerData.list.length < 3 && (
                                                    <button 
                                                        onClick={onShowAssign}
                                                        className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 hover:bg-orange-50/50 hover:border-[#F5A051] transition-all text-[#F5A051] group"
                                                    >
                                                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Users className="w-6 h-6" />
                                                        </div>
                                                        <p className="font-bold text-sm">Assign More Reviewers</p>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Actions & Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Editor Actions</h4>
                        <div className="space-y-3">
                            {paper.status !== 'Accepted' && paper.status !== 'Rejected' && (
                                <>
                                    <button 
                                        onClick={onAccept}
                                        disabled={decisionLoading || (reviewerData.list.length < 3 && paper.status !== 'Revised Submitted')}
                                        className="w-full py-4 bg-[#F5A051] text-white rounded-2xl font-bold hover:bg-orange-600 transition disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        Accept Paper
                                    </button>
                                    <button 
                                        onClick={onRevision}
                                        disabled={decisionLoading}
                                        className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-900 transition disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2"
                                    >
                                        <History className="w-5 h-5" />
                                        Request Revision
                                    </button>
                                    <button 
                                        onClick={onReject}
                                        disabled={decisionLoading}
                                        className="w-full py-4 bg-gray-700 text-white rounded-2xl font-bold hover:bg-gray-800 transition disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Reject Paper
                                    </button>
                                </>
                            )}
                            
                            <button 
                                onClick={onShowAssign}
                                className="w-full py-4 bg-[#F5A051] text-white rounded-2xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                            >
                                <Users className="w-5 h-5" />
                                Manage Reviewers
                            </button>

                            {paper.status === 'Revised Submitted' && (
                                <button 
                                    onClick={onSendReReview}
                                    disabled={decisionLoading}
                                    className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-900 transition flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Send Re-Review Emails
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-3xl p-6 text-white">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Insights</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Reviews Received</span>
                                <span className="text-sm font-bold">{reviewerData.list.filter(r => r.reviewStatus === 'Submitted').length} / {reviewerData.list.length}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5">
                                <div 
                                    className="bg-[#F5A051] h-1.5 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(reviewerData.list.filter(r => r.reviewStatus === 'Submitted').length / (reviewerData.list.length || 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Average Rating</span>
                                <span className="text-sm font-bold text-yellow-400">
                                    {reviewerData.list.filter(r => r.review).length > 0 
                                        ? (reviewerData.list.reduce((acc, curr) => acc + (curr.review?.ratings?.overall || 0), 0) / reviewerData.list.filter(r => r.review).length).toFixed(1)
                                        : 'N/A'
                                    } / 5.0
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
