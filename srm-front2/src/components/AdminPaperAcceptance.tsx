import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import api from '../config/api';
import { FileText, CheckCircle, Clock, Search, Filter, Eye, Check, AlertCircle, Loader2, Download, X } from 'lucide-react';
import Swal from 'sweetalert2';
import AdminSidebar from './AdminSidebar';


interface Paper {
    _id: string;
    submissionId: string;
    paperTitle: string;
    authorName: string;
    email: string;
    category: string;
    status: string;
    submittedAt: string;
    pdfUrl?: string;
}

const AdminPaperAcceptance = React.memo(() => {
    const navigate = useNavigate();
    const [pendingPapers, setPendingPapers] = useState<Paper[]>([]);
    const [acceptedPapers, setAcceptedPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
    const [acceptingPaperId, setAcceptingPaperId] = useState<string | null>(null);
    const [expandedAuthorEmail, setExpandedAuthorEmail] = useState<string | null>(null);



    useEffect(() => {
        fetchPapers();
    }, []);

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin-paper-acceptance/pending-papers');
            if (response.data.success) {
                setPendingPapers(response.data.pendingPapers || []);
                setAcceptedPapers(response.data.acceptedPapers || []);
            }
        } catch (error: any) {
            console.error('Error fetching papers:', error);
            if (error.response?.status === 403) {
                Swal.fire({
                    icon: 'info',
                    title: 'Access Denied',
                    text: 'Admin access required',
                    confirmButtonColor: '#dc2626'
                }).then(() => navigate('/login'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptPaper = async (paper: Paper) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Accept Paper?',
            html: `
                <div style="text-align: left;">
                    <p><strong>Paper:</strong> ${paper.paperTitle}</p>
                    <p><strong>Author:</strong> ${paper.authorName}</p>
                    <p><strong>ID:</strong> ${paper.submissionId}</p>
                    <p class="mt-3 text-amber-600">This will accept the paper without requiring 3 reviewers.</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Accept Paper',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            setAcceptingPaperId(paper._id);
            try {
                const response = await api.post('/api/admin-paper-acceptance/accept-paper', {
                    submissionId: paper.submissionId,
                    paperTitle: paper.paperTitle,
                    authorEmail: paper.email,
                    authorName: paper.authorName,
                    category: paper.category
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Paper Accepted!',
                        text: `Paper ${paper.submissionId} has been accepted successfully.`,
                        confirmButtonColor: '#10b981'
                    });
                    // Refresh papers list
                    fetchPapers();
                }
            } catch (error: any) {
                console.error('Error accepting paper:', error);
                Swal.fire({
                    icon: 'info',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to accept paper',
                    confirmButtonColor: '#dc2626'
                });
            } finally {
                setAcceptingPaperId(null);
            }
        }
    };

    const getAllPapers = () => {
        const all = [...pendingPapers, ...acceptedPapers];
        if (statusFilter === 'pending') return all.filter(p => p.status !== 'Accepted' && p.status !== 'Published');
        if (statusFilter === 'accepted') return all.filter(p => p.status === 'Accepted' || p.status === 'Published');
        return all;
    };

    const filteredPapers = getAllPapers().filter(paper =>
        paper.paperTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.submissionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return 'bg-blue-100 text-blue-800';
            case 'Under Review': return 'bg-yellow-100 text-yellow-800';
            case 'Accepted': return 'bg-green-100 text-green-800';
            case 'Published': return 'bg-purple-100 text-purple-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Revision Required': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 min-w-0">
                <AdminSidebar activeTab="paperAcceptance" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-[#F5A051] mx-auto mb-4" />
                        <p className="text-gray-600">Loading papers...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 min-w-0">
            <AdminSidebar activeTab="paperAcceptance" />
            <main className="flex-1 overflow-y-auto h-screen pt-16 lg:pt-0 py-8 px-4 lg:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-[#F5A051]" />
                        Admin Paper Acceptance
                    </h1>
                    <p className="text-gray-600">
                        Accept papers directly without requiring 3 reviewers. 
                        <span className="text-amber-600 font-medium ml-1">
                            ({pendingPapers.length} pending, {acceptedPapers.length} accepted)
                        </span>
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending Papers</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingPapers.length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Accepted</p>
                                <p className="text-2xl font-bold text-gray-900">{acceptedPapers.length}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Quick Accept</p>
                                <p className="text-sm text-gray-600 mt-1">No 3 reviewer requirement</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingPapers.length + acceptedPapers.length}</p>
                            </div>
                            <FileText className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, author, ID, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                            >
                                <option value="all">All Papers</option>
                                <option value="pending">Pending Only</option>
                                <option value="accepted">Accepted Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Papers List */}
                <div className="space-y-4">
                    {(() => {
                        const authorGroups = filteredPapers.reduce((acc: { [key: string]: any }, paper: any) => {
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

                        const groups = Object.values(authorGroups);

                        if (groups.length === 0) {
                            return (
                                <div className="bg-white rounded-xl shadow-sm p-6 sm:p-10 md:p-12 text-center">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No papers found</p>
                                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter</p>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-4">
                                {groups.map((group: any) => {
                                    const isExpanded = expandedAuthorEmail === group.email;
                                    return (
                                        <div key={group.email} className="border rounded-xl shadow-sm bg-white overflow-hidden transition-all duration-300">
                                            {/* 👤 Author Group Header */}
                                            <div 
                                                className={`p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all ${isExpanded ? 'bg-orange-50 border-b border-orange-100' : ''}`}
                                                onClick={() => setExpandedAuthorEmail(isExpanded ? null : group.email)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-[#F5A051] flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
                                                        {group.authorName?.[0]?.toUpperCase() || 'A'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-lg text-gray-900">{group.authorName}</h4>
                                                        <p className="text-sm text-gray-500 font-medium">{group.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className="inline-block text-xs font-black text-orange-700 bg-orange-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                                            {group.papers.length} {group.papers.length === 1 ? 'Paper' : 'Papers'}
                                                        </span>
                                                    </div>
                                                    {isExpanded ? (
                                                        <div className="bg-gray-200 p-2 rounded-full"><X className="w-5 h-5 text-gray-600" /></div>
                                                    ) : (
                                                        <div className="bg-orange-100 p-2 rounded-full"><Eye className="w-5 h-5 text-orange-600" /></div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 📄 Paper List (Expanded) */}
                                            {isExpanded && (
                                                <div className="p-4 bg-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {group.papers.map((paper: any) => (
                                                        <div key={paper._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border border-gray-100 border-l-4 border-l-orange-500">
                                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                                {/* Paper Info */}
                                                                <div className="flex-1">
                                                                    <div className="flex items-start gap-3 mb-2">
                                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(paper.status)}`}>
                                                                            {paper.status}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                                                                            {paper.submissionId}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                                                                        {paper.paperTitle}
                                                                    </h3>
                                                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-gray-600">
                                                                        <p className="flex items-center gap-1.5">
                                                                            <span className="font-bold text-gray-400">CATEGORY</span>
                                                                            <span className="font-black text-gray-700">{paper.category}</span>
                                                                        </p>
                                                                        <span className="text-gray-300">|</span>
                                                                        <p className="flex items-center gap-1.5">
                                                                            <span className="font-bold text-gray-400">SUBMITTED</span>
                                                                            <span className="font-black text-gray-700">{new Date(paper.submittedAt).toLocaleDateString()}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="flex items-center gap-3">
                                                                    {paper.pdfUrl && (
                                                                        <a
                                                                            href={paper.pdfUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-black shadow-sm"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Download className="w-4 h-4" />
                                                                            VIEW PDF
                                                                        </a>
                                                                    )}
                                                                    
                                                                    {/* Show Accept button only for non-accepted papers */}
                                                                    {paper.status !== 'Accepted' && paper.status !== 'Published' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAcceptPaper(paper);
                                                                            }}
                                                                            disabled={acceptingPaperId === paper._id}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-black shadow-md disabled:opacity-50 active:scale-95"
                                                                        >
                                                                            {acceptingPaperId === paper._id ? (
                                                                                <>
                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                    ACCEPTING...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Check className="w-4 h-4" />
                                                                                    QUICK ACCEPT
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {/* Show Already Accepted badge for accepted papers */}
                                                                    {(paper.status === 'Accepted' || paper.status === 'Published') && (
                                                                        <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-black shadow-inner border border-green-200">
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            ACCEPTED
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>
            </main>
        </div>
    );
});

export default AdminPaperAcceptance;
