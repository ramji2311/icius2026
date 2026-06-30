import React, { useState, useMemo } from 'react';
import { Users, X, Search, Clock, Trash2, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Paper } from './Common';
import { Reviewer } from '../ReviewerFilterPanel';
import api from '../../config/api';

interface AssignReviewersPanelProps {
    paper: Paper;
    reviewers: Reviewer[];
    assignedReviewers: any[];
    onClose: () => void;
    onSuccess: () => void;
    onInquiry: (reviewer: { reviewerId: string; reviewerName: string }) => void;
}

export const AssignReviewersPanel = React.memo(({ 
    paper, 
    reviewers, 
    assignedReviewers, 
    onClose, 
    onSuccess,
    onInquiry 
}: AssignReviewersPanelProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredReviewers = useMemo(() => {
        return reviewers.filter(r => {
            const isAlreadyAssigned = assignedReviewers.some(ar => ar._id === r._id);
            const matchesSearch = r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                r.email.toLowerCase().includes(searchTerm.toLowerCase());
            return !isAlreadyAssigned && matchesSearch;
        });
    }, [reviewers, assignedReviewers, searchTerm]);

    const handleAssign = async () => {
        if (selectedReviewers.length < 1 || !deadline) return;
        setLoading(true);
        try {
            const res = await api.post('/api/editor/assign-reviewers', {
                paperId: paper._id,
                submissionId: paper.submissionId,
                reviewerIds: selectedReviewers,
                deadline
            });
            if (res.data.success) {
                alert('Reviewers assigned successfully!');
                onSuccess();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to assign reviewers');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveReviewer = async (reviewerId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
        try {
            const res = await api.post('/api/editor/remove-reviewer', {
                paperId: paper._id,
                reviewerId
            });
            if (res.data.success) {
                alert('Reviewer removed');
                onSuccess();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to remove reviewer');
        }
    };

    const toggleReviewer = (id: string) => {
        setSelectedReviewers(prev => 
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden mb-6">
            <div className="bg-[#F5A051] px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Reviewer Management
                </h3>
                <button onClick={onClose} className="hover:bg-orange-600 p-1 rounded transition">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 space-y-8">
                {/* Existing Reviewers */}
                {assignedReviewers.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Currently Assigned ({assignedReviewers.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignedReviewers.map(reviewer => {
                                const isOverdue = reviewer.reviewStatus !== 'Submitted' && 
                                    paper.reviewAssignments?.find((a: any) => a.reviewer === reviewer._id)?.deadline &&
                                    new Date(paper.reviewAssignments.find((a: any) => a.reviewer === reviewer._id).deadline) < new Date();

                                return (
                                    <div key={reviewer._id} className="p-4 border rounded-xl bg-gray-50 flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800">{reviewer.username || reviewer.name}</p>
                                            <p className="text-xs text-gray-500 mb-2">{reviewer.email}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                reviewer.reviewStatus === 'Submitted' ? 'bg-green-100 text-green-700' : 
                                                isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {reviewer.reviewStatus} {isOverdue && !reviewer.review && '(Overdue)'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => onInquiry({ reviewerId: reviewer._id, reviewerName: reviewer.username })}
                                                className="p-2 text-[#F5A051] hover:bg-orange-50 rounded-lg transition"
                                                title="Send Inquiry"
                                            >
                                                <HelpCircle className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveReviewer(reviewer._id, reviewer.username)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Remove Reviewer"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Assignment Section */}
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#F5A051]" />
                        Assign New Reviewers
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search available reviewers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#F5A051]"
                            />
                        </div>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F5A051]" />
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#F5A051]"
                            />
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border-2 border-gray-50 rounded-xl divide-y">
                        {filteredReviewers.map(reviewer => (
                            <div 
                                key={reviewer._id}
                                onClick={() => toggleReviewer(reviewer._id)}
                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                    selectedReviewers.includes(reviewer._id) ? 'bg-orange-50' : 'hover:bg-gray-50'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{reviewer.username}</p>
                                    <p className="text-xs text-gray-500">{reviewer.email}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedReviewers.includes(reviewer._id) ? 'bg-[#F5A051] border-[#F5A051]' : 'border-gray-300'
                                }`}>
                                    {selectedReviewers.includes(reviewer._id) && <X className="w-3 h-3 text-white rotate-45" />}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={loading || selectedReviewers.length < 1 || !deadline}
                            className="flex-1 py-3 bg-[#F5A051] text-white rounded-xl font-bold hover:bg-orange-600 disabled:bg-orange-300 transition-all"
                        >
                            {loading ? 'Assigning...' : `Assign ${selectedReviewers.length} Reviewer(s)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
