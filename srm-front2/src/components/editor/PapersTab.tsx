import React, { useState, useMemo } from 'react';
import { Search, Filter, Users, Eye, AlertCircle, MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Paper, StatusBadge } from './Common';
import api from '../../config/api';

interface PapersTabProps {
    papers: Paper[];
    reviewers: any[];
    onViewPaper: (paper: Paper) => void;
}

export const PapersTab = React.memo(({ papers, reviewers, onViewPaper }: PapersTabProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedAuthorEmail, setExpandedAuthorEmail] = useState<string | null>(null);
    const [selectedPaperForMessage, setSelectedPaperForMessage] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const filteredPapers = useMemo(() => {
        return papers.filter(p => {
            const matchesSearch = !searchTerm ||
                p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = !statusFilter || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [papers, searchTerm, statusFilter]);

    const authorGroups = useMemo(() => {
        return filteredPapers.reduce((acc: any, paper) => {
            const email = (paper.email || 'unknown').toLowerCase();
            if (!acc[email]) {
                acc[email] = {
                    authorName: paper.authorName,
                    email: paper.email,
                    papers: []
                };
            }
            acc[email].papers.push(paper);
            return acc;
        }, {});
    }, [filteredPapers]);

    const handleSendMessage = async (paper: Paper) => {
        if (!messageText.trim()) return;
        setIsSending(true);
        try {
            const res = await api.post('/api/editor/send-message-to-author', {
                authorEmail: paper.email,
                authorName: paper.authorName,
                submissionId: paper.submissionId,
                message: messageText
            });
            if (res.data.success) {
                alert('Message sent successfully!');
                setSelectedPaperForMessage(null);
                setMessageText('');
            }
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search papers, authors, IDs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#F5A051] rounded-xl transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#F5A051] rounded-xl outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Review Received">Review Received</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {Object.values(authorGroups).map((group: any) => {
                        const isExpanded = expandedAuthorEmail === group.email;
                        return (
                            <div key={group.email} className="border-2 border-gray-50 rounded-2xl overflow-hidden transition-all">
                                <div 
                                    onClick={() => setExpandedAuthorEmail(isExpanded ? null : group.email)}
                                    className={`p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition ${isExpanded ? 'bg-orange-50/50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#F5A051] flex items-center justify-center text-white font-bold text-xl">
                                            {group.authorName?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{group.authorName}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{group.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-[#F5A051] bg-orange-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                            {group.papers.length} Paper{group.papers.length !== 1 ? 's' : ''}
                                        </span>
                                        {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 bg-gray-50/50 space-y-4 animate-in slide-in-from-top-2">
                                        {group.papers.map((paper: any) => (
                                            <div 
                                                key={paper._id}
                                                className="bg-white border-2 border-gray-100 rounded-xl p-5 transition-all group border-l-4 border-l-[#F5A051]"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#F5A051] transition-colors">{paper.paperTitle}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs font-mono font-bold text-gray-400">#{paper.submissionId}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-xs font-bold text-gray-500">{paper.category}</span>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={paper.status} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            Reviewer Status
                                                        </p>
                                                        {paper.assignedReviewers?.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {paper.assignedReviewers.map((r: any, idx: number) => {
                                                                    const assignment = paper.reviewAssignments?.find((a: any) => a.reviewer === (r._id || r));
                                                                    const status = assignment?.status || 'Pending';
                                                                    return (
                                                                        <div key={idx} className="flex justify-between items-center text-xs">
                                                                            <span className="text-gray-600 truncate max-w-[120px]">{r.username || r.email || r}</span>
                                                                            <span className={`font-bold ${status === 'Submitted' ? 'text-green-600' : 'text-yellow-600'}`}>{status}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-orange-500 font-bold flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                No Reviewers Assigned
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => onViewPaper(paper)}
                                                        className="flex-1 py-2.5 bg-[#F5A051] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedPaperForMessage(selectedPaperForMessage === paper._id ? null : paper._id)}
                                                        className={`px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                                                            selectedPaperForMessage === paper._id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {selectedPaperForMessage === paper._id && (
                                                    <div className="mt-4 p-5 bg-orange-50 rounded-xl animate-in zoom-in-95">
                                                        <h5 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                                            <Send className="w-4 h-4" />
                                                            Message to {paper.authorName}
                                                        </h5>
                                                        <textarea
                                                            value={messageText}
                                                            onChange={(e) => setMessageText(e.target.value)}
                                                            placeholder="Enter your message..."
                                                            className="w-full p-4 border-2 border-transparent focus:border-[#F5A051] rounded-xl text-sm outline-none"
                                                            rows={4}
                                                        />
                                                        <div className="flex justify-end gap-3 mt-3">
                                                            <button 
                                                                onClick={() => setSelectedPaperForMessage(null)}
                                                                className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                disabled={isSending || !messageText.trim()}
                                                                onClick={() => handleSendMessage(paper)}
                                                                className="px-6 py-2 bg-[#F5A051] text-white rounded-lg font-bold hover:bg-orange-600 disabled:bg-orange-300"
                                                            >
                                                                {isSending ? 'Sending...' : 'Send Message'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredPapers.length === 0 && (
                    <div className="text-center py-20">
                        <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No papers found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
});
