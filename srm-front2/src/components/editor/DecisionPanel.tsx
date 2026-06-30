import React, { useState } from 'react';
import { FileText, AlertCircle, X } from 'lucide-react';
import { Paper } from './Common';
import api from '../../config/api';

interface DecisionPanelProps {
    paper: Paper;
    paperReviewers: any[];
    onClose: () => void;
    onSuccess: () => void;
    type: 'revision' | 'reject';
}

export const DecisionPanel = React.memo(({ paper, paperReviewers, onClose, onSuccess, type }: DecisionPanelProps) => {
    const [loading, setLoading] = useState(false);
    const [revisionMessage, setRevisionMessage] = useState('');
    const [revisionDeadline, setRevisionDeadline] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionComments, setRejectionComments] = useState('');

    const handleRevision = async () => {
        if (!revisionMessage.trim() || !revisionDeadline) return;
        setLoading(true);
        try {
            const res = await api.post('/api/editor/request-revision', {
                paperId: paper._id,
                revisionMessage,
                revisionDeadline
            });
            if (res.data.success) {
                alert('Revision request sent!');
                onSuccess();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to request revision');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason || !rejectionComments.trim()) return;
        setLoading(true);
        try {
            const res = await api.post(`/api/editor/reject-paper/${paper._id}`, {
                rejectionReason,
                rejectionComments
            });
            if (res.data.success) {
                alert('Paper rejected');
                onSuccess();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to reject paper');
        } finally {
            setLoading(false);
        }
    };

    if (type === 'revision') {
        const canRequest = paperReviewers.length >= 3 && paperReviewers.every((r: any) => r.review);
        
        return (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        Request Revision
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {!canRequest ? (
                    <div className="p-6 bg-white rounded border-l-4 border-red-500">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="text-lg font-semibold text-red-800 mb-2">Cannot Request Revision</h4>
                                <p className="text-gray-700">Needs at least 3 reviewers with submitted reviews.</p>
                                <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded-lg">Close</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea
                            value={revisionMessage}
                            onChange={(e) => setRevisionMessage(e.target.value)}
                            placeholder="Feedback for author..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5A051]"
                            rows={5}
                        />
                        <input
                            type="date"
                            value={revisionDeadline}
                            onChange={(e) => setRevisionDeadline(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5A051]"
                        />
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-2 bg-gray-300 rounded-lg font-medium">Cancel</button>
                            <button
                                onClick={handleRevision}
                                disabled={loading || !revisionMessage.trim() || !revisionDeadline}
                                className="flex-1 py-2 bg-[#F5A051] text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 font-medium"
                            >
                                {loading ? 'Sending...' : 'Send Revision Request'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Reject Paper
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="space-y-4">
                <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400"
                >
                    <option value="">-- Select Reason --</option>
                    <option value="Quality Issues">Quality Issues</option>
                    <option value="Out of Scope">Out of Scope</option>
                    <option value="Insufficient Novelty">Insufficient Novelty</option>
                </select>
                <textarea
                    value={rejectionComments}
                    onChange={(e) => setRejectionComments(e.target.value)}
                    placeholder="Comments to author..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400"
                    rows={6}
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 bg-gray-300 rounded-lg font-medium">Cancel</button>
                    <button
                        onClick={handleReject}
                        disabled={loading || !rejectionReason || !rejectionComments.trim()}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
                    >
                        {loading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
});
