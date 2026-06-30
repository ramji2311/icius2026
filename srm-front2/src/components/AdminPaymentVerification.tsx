import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, Loader, Search, Award } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../config/api';

interface AuthorRegistration {
    _id: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    submissionId: string;
    paymentMethod: string;
    transactionId: string;
    amount: number;
    verifiedAmount?: number;
    paymentScreenshot: string;
    registrationCategory: string;
    paymentStatus: string;
    registrationDate: string;
    verifiedAt?: string;
    rejectionReason?: string;
    membershipStatus?: {
        isMember: boolean;
        membershipId?: string;
        membershipType?: string;
    };
    papers?: {
        submissionId: string;
        paperTitle: string;
        amountPaid?: number;
    }[];
}

interface ListenerRegistration {
    _id: string;
    name: string;
    email: string;
    institution: string;
    address: string;
    country: string;
    registrationCategory: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentScreenshot: string;
    isScisMember: boolean;
    scisMembershipId?: string;
    paymentStatus: 'pending' | 'verified' | 'rejected';
    registrationNumber?: string;
    verifiedAt?: Date;
    verifiedByName?: string;
    rejectionReason?: string;
    createdAt: Date;
}

type Registration = AuthorRegistration | ListenerRegistration;

const isAuthorRegistration = (reg: Registration): reg is AuthorRegistration => {
    return 'authorName' in reg && 'authorEmail' in reg && 'paperTitle' in reg;
};

function escapeHtml(s: string) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getAuthorPapersForVerify(reg: AuthorRegistration) {
    if (reg.papers && reg.papers.length > 0) {
        return reg.papers.map((p) => ({
            submissionId: p.submissionId,
            paperTitle: p.paperTitle || ''
        }));
    }
    return [{ submissionId: reg.submissionId, paperTitle: reg.paperTitle || '' }];
}

const AdminPaymentVerification: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
    const [registrationType, setRegistrationType] = useState<'authors' | 'listeners' | 'both'>('both');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'paperId' | 'all'>('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistrations();
    }, [filter, registrationType]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);

            const allRegistrations: Registration[] = [];

            // Fetch author registrations
            if (registrationType === 'authors' || registrationType === 'both') {
                try {
                    const endpoint = filter === 'pending'
                        ? '/api/registration/admin/pending'
                        : `/api/registration/admin/all?status=${filter === 'all' ? '' : filter}`;

                    const response = await api.get(`${endpoint}`);

                    if (response.data.success) {
                        const regs = response.data.registrations;
                        // Fetch membership status for each registration
                        const regsWithMembership = await Promise.all(
                            regs.map(async (reg: AuthorRegistration) => {
                                try {
                                    const membershipResponse = await api.post(
                                        '/api/membership/check-user-membership',
                                        { email: reg.authorEmail }
                                    );
                                    return {
                                        ...reg,
                                        membershipStatus: membershipResponse.data
                                    };
                                } catch (error) {
                                    console.error(`Error fetching membership for ${reg.authorEmail}:`, error);
                                    return {
                                        ...reg,
                                        membershipStatus: { isMember: false }
                                    };
                                }
                            })
                        );
                        allRegistrations.push(...regsWithMembership);
                    }
                } catch (error) {
                    console.error('Error fetching author registrations:', error);
                }
            }

            // Fetch listener registrations
            if (registrationType === 'listeners' || registrationType === 'both') {
                try {
                    const listenerEndpoint = filter === 'pending'
                        ? '/api/listener/admin/pending'
                        : `/api/listener/admin/all?status=${filter === 'all' ? '' : filter}`;

                    const listenerResponse = await api.get(`${listenerEndpoint}`);

                    if (listenerResponse.data.success) {
                        allRegistrations.push(...(listenerResponse.data.registrations || []));
                    }
                } catch (error) {
                    console.error('Error fetching listener registrations:', error);
                }
            }

            setRegistrations(allRegistrations);
        } catch (error: any) {
            console.error('Error fetching registrations:', error);

            if (error.response?.status === 401) {
                Swal.fire({
                    icon: 'info',
                    title: 'Unauthorized',
                    text: 'Please log in as an admin to access this page',
                    confirmButtonColor: '#dc2626',
                });
            } else if (error.response?.status === 403) {
                Swal.fire({
                    icon: 'info',
                    title: 'Access Denied',
                    text: 'You need admin privileges to access this page',
                    confirmButtonColor: '#dc2626',
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to fetch registrations',
                    confirmButtonColor: '#dc2626',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, reg: Registration) => {
        const isAuthor = isAuthorRegistration(reg);
        const name = isAuthor ? (reg as AuthorRegistration).authorName : (reg as ListenerRegistration).name;

        if (!isAuthor) {
            const result = await Swal.fire({
                title: `Verify Payment for ${name}?`,
                text: 'This will approve the registration and notify the user.',
                icon: 'question',
                input: 'textarea',
                inputLabel: 'Verification Notes (optional)',
                inputPlaceholder: 'Enter any notes...',
                showCancelButton: true,
                confirmButtonText: 'Verify',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6b7280',
            });

            if (result.isConfirmed) {
                try {
                    const response = await api.put(`/api/listener/admin/verify/${id}`, {
                        verificationNotes: result.value || 'Payment verified',
                    });

                    if (response.data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Verified!',
                            html: `
                            <p>Payment verified successfully for <strong>${name}</strong>!</p>
                            <p class="mt-2 text-sm"><strong>Registration ID:</strong> ${id}</p>
                        `,
                            confirmButtonColor: '#10b981',
                        });
                        fetchRegistrations();
                    }
                } catch (error: any) {
                    console.error('Verification error:', error);
                    Swal.fire({
                        icon: 'info',
                        title: 'Error',
                        text: error.response?.data?.message || 'Failed to verify payment',
                        confirmButtonColor: '#dc2626',
                    });
                }
            }
            return;
        }

        const author = reg as AuthorRegistration;
        const papers = getAuthorPapersForVerify(author);
        const n = papers.length;
        const defaultEach = n > 0 ? Math.round((author.amount / n) * 100) / 100 : author.amount;

        const inputsHtml = papers
            .map(
                (p, i) => `
    <div class="text-left mb-3">
      <label class="block text-xs font-bold text-gray-600 mb-1">${escapeHtml(p.submissionId)} — ${escapeHtml(p.paperTitle)}</label>
      <input type="number" step="0.01" min="0" class="swal2-input verify-amt-input" data-idx="${i}" value="${defaultEach}" />
    </div>`
            )
            .join('');

        const result = await Swal.fire({
            title: `Verify payment — ${escapeHtml(name)}`,
            icon: 'question',
            html: `
      <p class="text-sm text-gray-600 mb-2 text-left">Author declared total: ₹${author.amount.toLocaleString()}</p>
      <p class="text-xs font-bold text-gray-500 mb-2 text-left">Enter verified amount paid (₹) for each paper:</p>
      ${inputsHtml}
      <label class="block text-xs font-bold text-gray-500 mt-2 mb-1 text-left">Notes (optional)</label>
      <textarea id="verify-notes-swal" class="swal2-textarea" placeholder="Verification notes..."></textarea>
    `,
            showCancelButton: true,
            confirmButtonText: 'Verify',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            focusConfirm: false,
            preConfirm: () => {
                const notesEl = document.getElementById('verify-notes-swal') as HTMLTextAreaElement | null;
                const notes = notesEl?.value?.trim() || 'Payment verified';
                const paperAmounts: { submissionId: string; amount: number }[] = [];
                for (let i = 0; i < papers.length; i++) {
                    const el = document.querySelector(
                        `input.verify-amt-input[data-idx="${i}"]`
                    ) as HTMLInputElement | null;
                    const amount = parseFloat(el?.value ?? '');
                    if (!Number.isFinite(amount) || amount < 0) {
                        Swal.showValidationMessage(`Invalid amount for ${papers[i].submissionId}`);
                        return false;
                    }
                    paperAmounts.push({ submissionId: papers[i].submissionId, amount });
                }
                const sum = paperAmounts.reduce((s, r) => s + r.amount, 0);
                if (sum <= 0) {
                    Swal.showValidationMessage('Total verified amount must be greater than zero.');
                    return false;
                }
                return { paperAmounts, verificationNotes: notes };
            },
        });

        if (result.isConfirmed && result.value) {
            try {
                const payload = result.value as {
                    paperAmounts: { submissionId: string; amount: number }[];
                    verificationNotes: string;
                };
                console.log('🔄 Verifying author registration:', { id, paperAmounts: payload.paperAmounts });

                const response = await api.put(`/api/registration/admin/${id}/verify`, {
                    paperAmounts: payload.paperAmounts,
                    verificationNotes: payload.verificationNotes,
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Verified!',
                        html: `
                            <p>Payment verified successfully for <strong>${escapeHtml(name)}</strong>!</p>
                            <p class="mt-2 text-sm"><strong>Registration ID:</strong> ${id}</p>
                        `,
                        confirmButtonColor: '#10b981',
                    });
                    fetchRegistrations();
                }
            } catch (error: any) {
                console.error('Verification error:', error);
                Swal.fire({
                    icon: 'info',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to verify payment',
                    confirmButtonColor: '#dc2626',
                });
            }
        }
    };

    const handleReject = async (id: string, reg: Registration) => {
        const isAuthor = isAuthorRegistration(reg);
        const name = isAuthor ? (reg as AuthorRegistration).authorName : (reg as ListenerRegistration).name;

        const result = await Swal.fire({
            title: `Reject Payment for ${name}?`,
            text: 'Please provide a reason for rejection. This will remove the registration and notify the user.',
            icon: 'warning',
            input: 'textarea',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Enter reason for rejection...',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason!';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Reject',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
        });

        if (result.isConfirmed) {
            try {
                const endpoint = isAuthor 
                    ? `/api/registration/admin/${id}/reject`
                    : `/api/listener/admin/reject/${id}`;

                console.log('🔄 Rejecting registration:', { id, type: isAuthor ? 'author' : 'listener', endpoint });

                await api.put(
                    `${endpoint}`,
                    { rejectionReason: result.value }
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Rejected',
                    text: `Payment for ${name} has been rejected and removed.`,
                    confirmButtonColor: '#dc2626',
                });
                fetchRegistrations();
            } catch (error: any) {
                console.error('Rejection error:', error);
                Swal.fire({
                    icon: 'info',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to reject payment',
                    confirmButtonColor: '#dc2626',
                });
            }
        }
    };

    const viewScreenshot = (url: string) => {
        setSelectedImage(url);
    };

    // Filter registrations based on search term and search type
    const filteredRegistrations = useMemo(() => {
        if (!searchTerm.trim()) {
            return registrations;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();

        return registrations.filter((reg) => {
            const email = isAuthorRegistration(reg) ? reg.authorEmail : reg.email;
            const name = isAuthorRegistration(reg) ? reg.authorName : reg.name;
            const paperTitle = isAuthorRegistration(reg) ? reg.paperTitle : '';
            const submissionId = isAuthorRegistration(reg) ? reg.submissionId : '';

            switch (searchType) {
                case 'email':
                    return email.toLowerCase().includes(lowerSearchTerm);
                case 'paperId':
                    return submissionId.toLowerCase().includes(lowerSearchTerm);
                case 'all':
                    return (
                        email.toLowerCase().includes(lowerSearchTerm) ||
                        submissionId.toLowerCase().includes(lowerSearchTerm) ||
                        name.toLowerCase().includes(lowerSearchTerm) ||
                        paperTitle.toLowerCase().includes(lowerSearchTerm)
                    );
                default:
                    return true;
            }
        });
    }, [registrations, searchTerm, searchType]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-16 sm:p-6 sm:pt-6 max-w-[100vw] overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment Verification</h1>

                {/* Registration Type Filter */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Registration Type:</p>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setRegistrationType('both')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${registrationType === 'both'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Both
                        </button>
                        <button
                            onClick={() => setRegistrationType('authors')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${registrationType === 'authors'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Authors Only
                        </button>
                        <button
                            onClick={() => setRegistrationType('listeners')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${registrationType === 'listeners'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Listeners Only
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Payment Status:</p>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('verified')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'verified'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Verified
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Rejected
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search registrations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as 'email' | 'paperId' | 'all')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="all">Search All Fields</option>
                            <option value="email">Email Only</option>
                            <option value="paperId">Paper ID Only</option>
                        </select>
                    </div>
                    {searchTerm && (
                        <div className="mt-3 text-sm text-gray-600">
                            Found <strong>{filteredRegistrations.length}</strong> result{filteredRegistrations.length !== 1 ? 's' : ''}
                            {searchType !== 'all' && ` in ${searchType === 'email' ? 'email' : 'paper ID'}`}
                        </div>
                    )}
                </div>

                {/* Registrations List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin h-12 w-12 text-blue-500" />
                    </div>
                ) : filteredRegistrations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">
                            {searchTerm ? 'No registrations found matching your search' : 'No registrations found'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            // Group registrations by email
                            const groups = filteredRegistrations.reduce((acc: any, reg) => {
                                const email = isAuthorRegistration(reg) ? reg.authorEmail : (reg as ListenerRegistration).email;
                                if (!acc[email]) {
                                    acc[email] = {
                                        email,
                                        name: isAuthorRegistration(reg) ? reg.authorName : (reg as ListenerRegistration).name,
                                        registrations: [],
                                        regType: isAuthorRegistration(reg) ? 'Author' : 'Listener'
                                    };
                                }
                                acc[email].registrations.push(reg);
                                return acc;
                            }, {});

                            return Object.values(groups).map((group: any) => (
                                <div key={group.email} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                                    {/* Author Header Card */}
                                    <div 
                                        onClick={() => setExpandedEmail(expandedEmail === group.email ? null : group.email)}
                                        className={`p-6 cursor-pointer flex items-center justify-between transition-colors ${
                                            expandedEmail === group.email ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-indigo-100 p-3 rounded-full">
                                                <Award className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                                                <p className="text-sm text-gray-500 font-medium">{group.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <div className="flex items-center gap-2 mb-1 justify-end">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase ${
                                                        group.regType === 'Author' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {group.regType}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">
                                                    {group.registrations.length} {group.registrations.length === 1 ? 'Registration' : 'Registrations'}
                                                </p>
                                            </div>
                                            
                                            <div className={`transform transition-transform duration-300 ${expandedEmail === group.email ? 'rotate-180' : ''}`}>
                                                <Search className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedEmail === group.email && (
                                        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-6">
                                            {group.registrations.map((reg: any, idx: number) => {
                                                const isAuthor = isAuthorRegistration(reg);
                                                const createdDate = isAuthor ? reg.registrationDate : (reg.createdAt || new Date());
                                                
                                                return (
                                                    <div key={reg._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                                            {/* Left Column - Details */}
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="bg-gray-100 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                                                            REGISTRATION #{idx + 1}
                                                                        </span>
                                                                         {isAuthor && (reg.papers && reg.papers.length > 0 ? (
                                                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                                                                {reg.papers.length} {reg.papers.length === 1 ? 'PAPER' : 'PAPERS'}
                                                                            </span>
                                                                        ) : reg.submissionId && (
                                                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                                                                {reg.submissionId}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                                        reg.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        reg.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                                                            'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {reg.paymentStatus}
                                                                    </span>
                                                                </div>

                                                                {isAuthor && (reg.papers && reg.papers.length > 0 ? (
                                                                    <div className="mb-4 space-y-2">
                                                                        {reg.papers.map((p: any) => (
                                                                            <div key={p.submissionId} className="flex flex-wrap items-start justify-between gap-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                                                                                <div className="flex items-start gap-2 min-w-0">
                                                                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5">{p.submissionId}</span>
                                                                                <span className="text-xs font-bold text-gray-800 leading-tight">{p.paperTitle}</span>
                                                                                </div>
                                                                                {typeof p.amountPaid === 'number' && reg.paymentStatus === 'verified' && (
                                                                                    <span className="text-[10px] font-black text-green-700 whitespace-nowrap">Verified ₹{Number(p.amountPaid).toLocaleString()}</span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="mb-4">
                                                                        <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">{reg.paperTitle}</h4>
                                                                        <p className="text-xs text-gray-500 italic">Author Paper Submission</p>
                                                                    </div>
                                                                ))}

                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                    <div>
                                                                        <p className="text-gray-400 font-bold uppercase mb-1">Category</p>
                                                                        <p className="text-gray-900 font-medium">{reg.registrationCategory}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-400 font-bold uppercase mb-1">Method</p>
                                                                        <p className="text-gray-900 font-medium">{reg.paymentMethod}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-400 font-bold uppercase mb-1">Date</p>
                                                                        <p className="text-gray-900 font-medium">{new Date(createdDate).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-400 font-bold uppercase mb-1">Transaction ID</p>
                                                                        <p className="text-gray-900 font-mono text-[10px] break-all">{reg.transactionId || 'N/A'}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                                                                    {isAuthor ? (
                                                                        <>
                                                                            <div>
                                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Author declared</p>
                                                                                <p className="text-xl font-black text-gray-800">₹{reg.amount.toLocaleString()}</p>
                                                                            </div>
                                                                            {reg.paymentStatus === 'verified' && typeof reg.verifiedAmount === 'number' && (
                                                                                <div className="pt-2 border-t border-gray-200">
                                                                                    <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Verified total (admin)</p>
                                                                                    <p className="text-2xl font-black text-green-800">₹{Number(reg.verifiedAmount).toLocaleString()}</p>
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount Paid</p>
                                                                            <p className="text-2xl font-black text-gray-900">
                                                                                {(reg as ListenerRegistration).currency === 'IDR' ? 'Rp ' : '$'}
                                                                                {reg.amount.toLocaleString()}
                                                                            </p>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {reg.rejectionReason && (
                                                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs">
                                                                        <p className="text-red-700 font-bold mb-1">Rejection Reason:</p>
                                                                        <p className="text-red-600">{reg.rejectionReason}</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Right Column - Screenshot & Actions */}
                                                            <div className="space-y-4">
                                                                {reg.paymentScreenshot ? (
                                                                    <div className="group relative">
                                                                        <img
                                                                            src={reg.paymentScreenshot || undefined}
                                                                            alt="Payment Screenshot"
                                                                            className="w-full h-48 object-contain bg-gray-50 rounded-xl cursor-pointer border border-gray-200 transition-all group-hover:bg-gray-100"
                                                                            onClick={() => viewScreenshot(reg.paymentScreenshot)}
                                                                        />
                                                                        <button
                                                                            onClick={() => viewScreenshot(reg.paymentScreenshot)}
                                                                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <Eye className="h-4 w-4 text-gray-700" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                                                                        <p className="text-xs text-gray-400 font-bold">NO SCREENSHOT PROVIDED</p>
                                                                    </div>
                                                                )}

                                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                                        <button
                                                                            onClick={() => reg.paymentStatus === 'pending' && handleVerify(reg._id, reg)}
                                                                            disabled={reg.paymentStatus !== 'pending'}
                                                                            className={`${reg.paymentStatus === 'verified' ? 'bg-green-700 opacity-60 cursor-not-allowed' : reg.paymentStatus === 'pending' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center transition-all shadow-sm hover:shadow-md uppercase tracking-wider`}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            {reg.paymentStatus === 'verified' ? 'VERIFIED' : 'VERIFY'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => reg.paymentStatus === 'pending' && handleReject(reg._id, reg)}
                                                                            disabled={reg.paymentStatus !== 'pending'}
                                                                            className={`${reg.paymentStatus === 'rejected' ? 'bg-red-700 opacity-60 cursor-not-allowed' : reg.paymentStatus === 'pending' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center transition-all shadow-sm hover:shadow-md uppercase tracking-wider`}
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            {reg.paymentStatus === 'rejected' ? 'REJECTED' : 'REJECT'}
                                                                        </button>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="max-w-4xl max-h-full">
                        <img
                            src={selectedImage}
                            alt="Payment Screenshot Full View"
                            className="max-w-full max-h-screen object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentVerification;
