import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';



interface ReviewDetail {
    _id: string;
    comments?: string;
    strengths?: string;
    weaknesses?: string;
    commentsToEditor?: string;
    commentsToReviewer?: string;
    overallRating?: number;
    noveltyRating?: number;
    qualityRating?: number;
    clarityRating?: number;
    recommendation: string;
    submittedAt: string;
    status: string;
    ratings?: {
        overall?: string;
        technicalQuality?: string;
        significance?: string;
        presentation?: string;
        relevance?: string;
        originality?: string;
        adequacyOfCitations?: string;
    };
    additionalQuestions?: {
        suggestOwnReferences?: boolean;
        recommendForBestPaperAward?: boolean;
        suggestAnotherJournal?: boolean;
        willingToReviewRevisions?: boolean;
    };
    reviewer?: {
        username: string;
        email: string;
    };
}

interface ReviewerDetailsProps {
    reviewId: string;
    submissionId: string;
    onClose: () => void;
}

const ReviewerDetailsPanel: React.FC<ReviewerDetailsProps> = ({
    reviewId,
    submissionId,
    onClose
}) => {
    const [review, setReview] = useState<ReviewDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'review' | 'message'>('review');
    const [messageText, setMessageText] = useState('');
    const [messageSending, setMessageSending] = useState(false);

    useEffect(() => {
        fetchReviewDetails();
    }, [reviewId, submissionId]);

    const fetchReviewDetails = async () => {
        try {
            const response = await api.get(
                `/api/editor/review/${reviewId}`
            );
            setReview(response.data.review);
        } catch (error: any) {
            console.error('Error fetching review:', error);
            Swal.fire('Error', 'Failed to load review details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !review?.reviewer?.email) return;

        setMessageSending(true);
        try {
            await api.post(
                '/api/editor/send-message-to-reviewer',
                {
                    reviewerEmail: review.reviewer.email,
                    reviewerName: review.reviewer.username,
                    submissionId,
                    message: messageText
                }
            );
            Swal.fire('Success', 'Message sent to reviewer', 'success');
            setMessageText('');
        } catch (error: any) {
            console.error('Error sending message:', error);
            Swal.fire('Error', 'Failed to send message', 'error');
        } finally {
            setMessageSending(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Reviewer Details & Communication</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition"
                >
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`px-4 py-2 font-medium transition ${
                            activeTab === 'review'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        📋 Review Details
                    </button>
                    <button
                        onClick={() => setActiveTab('message')}
                        className={`px-4 py-2 font-medium transition ${
                            activeTab === 'message'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        💬 Message Reviewer
                    </button>
                </div>
            </div>

            {/* Review Details Tab */}
            {activeTab === 'review' && review && (
                <div className="space-y-6">
                    {/* Reviewer Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Reviewer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Name</p>
                                <p className="text-gray-800">{review.reviewer?.username || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Email</p>
                                <p className="text-gray-800 break-all">{review.reviewer?.email || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Submitted On</p>
                                <p className="text-gray-800">{new Date(review.submittedAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Recommendation</p>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    review.recommendation === 'Accept' ? 'bg-green-200 text-green-800' :
                                    review.recommendation === 'Reject' ? 'bg-red-200 text-red-800' :
                                    review.recommendation === 'Major Revision' ? 'bg-yellow-200 text-yellow-800' :
                                    review.recommendation === 'Minor Revision' ? 'bg-orange-200 text-orange-800' :
                                    'bg-blue-200 text-blue-800'
                                }`}>
                                    {review.recommendation}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ratings - Show individually without header */}
                    <div className="grid grid-cols-4 gap-2">
                        {/* Numeric format ratings */}
                        <div className="text-center bg-purple-100 p-3 rounded border border-purple-200">
                            <p className="text-sm text-gray-600 font-medium mb-1">Overall</p>
                            <p className="text-2xl font-bold text-purple-600">{review.overallRating || 0}/5</p>
                        </div>
                        <div className="text-center bg-blue-100 p-3 rounded border border-blue-200">
                            <p className="text-sm text-gray-600 font-medium mb-1">Novelty</p>
                            <p className="text-2xl font-bold text-blue-600">{review.noveltyRating || 0}/5</p>
                        </div>
                        <div className="text-center bg-green-100 p-3 rounded border border-green-200">
                            <p className="text-sm text-gray-600 font-medium mb-1">Quality</p>
                            <p className="text-2xl font-bold text-green-600">{review.qualityRating || 0}/5</p>
                        </div>
                        <div className="text-center bg-orange-100 p-3 rounded border border-orange-200">
                            <p className="text-sm text-gray-600 font-medium mb-1">Clarity</p>
                            <p className="text-2xl font-bold text-orange-600">{review.clarityRating || 0}/5</p>
                        </div>
                    </div>

                    {/* Review Comments */}
                    {(review.commentsToEditor || review.comments) && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-gray-800 mb-2">Comments to Author</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.commentsToEditor || review.comments}</p>
                        </div>
                    )}

                    {/* Confidential Comments to Editor */}
                    {review.commentsToReviewer && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-gray-800 mb-2">🔒 Confidential Comments to Editor</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.commentsToReviewer}</p>
                        </div>
                    )}

                    {/* Strengths */}
                    {review.strengths && (
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
                            <h4 className="font-semibold text-gray-800 mb-2">✓ Strengths</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.strengths}</p>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {review.weaknesses && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-gray-800 mb-2">✗ Weaknesses</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.weaknesses}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Message Tab */}
            {activeTab === 'message' && review && (
                <div className="space-y-4">
                    {/* Reviewer Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Send Message to Reviewer</h4>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{review.reviewer?.username}</span>
                            <span className="text-gray-500"> ({review.reviewer?.email})</span>
                        </p>
                    </div>

                    {/* Message Compose Area */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Your Message</label>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type your message to the reviewer here..."
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            Character count: {messageText.length}
                        </p>
                    </div>

                    {/* Send Button */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setMessageText('');
                            }}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() || messageSending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
                        >
                            {messageSending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Sending...
                                </>
                            ) : (
                                <>✉️ Send Message</>
                            )}
                        </button>
                    </div>

                    {/* Message Info */}
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                            💡 <span className="font-medium">Note:</span> This message will be sent via email to the reviewer. Keep it professional and constructive.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewerDetailsPanel;
