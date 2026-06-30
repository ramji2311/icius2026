import { useState, useEffect } from 'react';
import api from '../config/api';
import PageTransition from './PageTransition';
import {
    CheckCircle,
    FileText,
    MessageCircle,
    Send,
    ExternalLink,
    Search,
    ArrowLeft,
    History,
    Loader2,
    CreditCard,
    Bell,
    Info,
    History as HistoryIcon
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';

interface Message {
    sender: 'Author' | 'Admin';
    message: string;
    timestamp: string;
}

interface CopyrightData {
    _id: string;
    paperId: string;
    submissionId: string;
    authorEmail: string;
    authorName: string;
    paperTitle: string;
    copyrightFormUrl: string | null;
    cameraReadyUrl?: string | null;
    status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Declined';
    paymentStatus?: 'pending' | 'verified' | 'rejected';
    messages: Message[];
}

const AdminCopyrightManagement: React.FC = () => {
    const [copyrights, setCopyrights] = useState<CopyrightData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCopyright, setSelectedCopyright] = useState<CopyrightData | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');
    const [history, setHistory] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);



    useEffect(() => {
        fetchAllCopyrights();
    }, []);

    const fetchPaperHistory = async (submissionId: string) => {
        setLoadingHistory(true);
        try {
            const response = await api.get(`/api/admin/papers/${submissionId}/history`);
            if (response.data.success) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (selectedCopyright && activeTab === 'history') {
            fetchPaperHistory(selectedCopyright.submissionId);
        }
    }, [selectedCopyright, activeTab]);

    const fetchAllCopyrights = async () => {
        try {
            const response = await api.get(`/api/copyright/admin/list`);

            if (response.data.success) {
                setCopyrights(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching copyright list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedCopyright) return;

        try {
            const response = await api.post(`/api/copyright/message`, {
                copyrightId: selectedCopyright._id,
                message: messageInput
            });

            if (response.data.success) {
                const updatedMessages = response.data.data;
                const updatedCopyright = { ...selectedCopyright, messages: updatedMessages };
                setSelectedCopyright(updatedCopyright);
                setCopyrights(copyrights.map(c => c._id === selectedCopyright._id ? updatedCopyright : c));
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleReview = async (status: 'Approved' | 'Rejected' | 'Declined') => {
        if (!selectedCopyright) return;

        try {
            const response = await api.post(`/api/copyright/admin/review`, {
                copyrightId: selectedCopyright._id,
                status,
                adminComment: adminComment || `Form ${status.toLowerCase()} by Admin.`
            });

            if (response.data.success) {
                const updatedCopyright = response.data.data;
                setSelectedCopyright(updatedCopyright);
                setCopyrights(copyrights.map(c => c._id === selectedCopyright._id ? updatedCopyright : c));
                setAdminComment('');
                
                // Send email notification when approved or declined
                if (status === 'Approved') {
                    try {
                        await api.post(`/api/copyright/admin/send-camera-ready-email`, {
                            copyrightId: selectedCopyright._id,
                            authorEmail: selectedCopyright.authorEmail,
                            authorName: selectedCopyright.authorName,
                            paperTitle: selectedCopyright.paperTitle,
                            submissionId: selectedCopyright.submissionId
                        });
                        alert('Copyright form approved successfully! Email notification sent to author for camera-ready paper upload.');
                    } catch (emailError) {
                        console.error('Error sending approval email:', emailError);
                        alert('Copyright form approved successfully! (Email notification failed to send)');
                    }
                } else if (status === 'Declined') {
                    alert('Paper marked as Declined and notification email sent to author.');
                } else {
                    alert(`Copyright form ${status.toLowerCase()} successfully!`);
                }
            }
        } catch (error) {
            console.error('Error reviewing copyright:', error);
            alert('Failed to update status');
        }
    };

    const handleManualPaymentUpdate = async (status: string) => {
        if (!selectedCopyright) return;
        try {
            const response = await api.post(`/api/copyright/admin/update-payment-status-manual`, {
                authorEmail: selectedCopyright.authorEmail,
                submissionId: selectedCopyright.submissionId,
                status
            });

            if (response.data.success) {
                alert(`Payment status updated to ${status}!`);
                // Update local state
                const updated = { ...selectedCopyright, paymentStatus: status as any };
                setSelectedCopyright(updated);
                setCopyrights(copyrights.map(c => c._id === selectedCopyright._id ? updated : c));
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to update payment status');
        }
    };

    const handleNotify = async (copyright: CopyrightData) => {
        try {
            const message = `For this paper, payment is not done. Please pay or your paper will not be considered.`;
            const response = await api.post(`/api/copyright/message`, {
                copyrightId: copyright._id,
                message
            });

            // Also send dedicated email notification
            await api.post(`/api/copyright/admin/send-camera-ready-email`, {
                copyrightId: copyright._id,
                authorEmail: copyright.authorEmail,
                authorName: copyright.authorName,
                paperTitle: copyright.paperTitle,
                submissionId: copyright.submissionId,
                isUnpaid: true
            });

            if (response.data.success) {
                alert(`Notification sent to ${copyright.authorEmail}`);
                // Update local state if needed
                const updated = {
                    ...copyright,
                    messages: [...(copyright.messages || []), { sender: 'Admin', message, timestamp: new Date().toISOString() }]
                } as any;
                if (selectedCopyright?._id === copyright._id) setSelectedCopyright(updated);
                setCopyrights(copyrights.map(c => c._id === copyright._id ? updated : c));
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification');
        }
    };

    const filteredCopyrights = copyrights.filter(c => {
        const titleMatch = c.paperTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const authorMatch = c.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const idMatch = c.submissionId?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesSearch = titleMatch || authorMatch || idMatch;
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesPayment = paymentFilter === 'all' || c.paymentStatus === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="flex min-h-screen bg-gray-50 min-w-0">
                {/* Static Sidebar */}
                <AdminSidebar activeTab="copyrights" />

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-screen overflow-hidden pt-14 lg:pt-0">
                    <div className="bg-white shadow-sm border-b px-4 pl-14 sm:pl-6 lg:pl-6 py-4 flex items-center justify-between z-20">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-gray-900">Copyright Management</h1>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                    <div className="w-full md:w-1/3 shrink-0 border-b md:border-b-0 md:border-r bg-white flex flex-col min-h-0 h-[40vh] sm:h-[42vh] md:h-full">
                        <div className="p-4 border-b space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by author, title, ID..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {['all', 'Pending', 'Submitted', 'Approved', 'Rejected', 'Declined'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition ${statusFilter === status ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <span className="text-[10px] font-bold text-gray-400 mr-1">Payment:</span>
                                {['all', 'verified', 'pending'].map(pStatus => (
                                    <button
                                        key={pStatus}
                                        onClick={() => setPaymentFilter(pStatus)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition ${paymentFilter === pStatus ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {pStatus === 'all' ? 'All Payments' : pStatus === 'verified' ? 'Paid' : 'Unpaid'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y">
                            {(() => {
                                // Group by author email
                                const grouped = filteredCopyrights.reduce((acc: { [key: string]: CopyrightData[] }, c) => {
                                    if (!acc[c.authorEmail]) acc[c.authorEmail] = [];
                                    acc[c.authorEmail].push(c);
                                    return acc;
                                }, {});

                                return Object.keys(grouped).map(email => {
                                    const authorPapers = grouped[email];
                                    const firstPaper = authorPapers[0];
                                    const isSelectedGroup = authorPapers.some(p => p._id === selectedCopyright?._id);

                                    return (
                                        <div key={email} className={`border-b transition-all ${isSelectedGroup ? 'bg-blue-50/30' : ''}`}>
                                            <div className="p-4 bg-gray-50/50 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/10 p-1.5 rounded-lg">
                                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-gray-900">{firstPaper.authorName}</h3>
                                                        <p className="text-[10px] text-gray-500">{email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                                    {authorPapers.length} {authorPapers.length === 1 ? 'PAPER' : 'PAPERS'}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {authorPapers.map(c => (
                                                    <div
                                                        key={c._id}
                                                        onClick={() => setSelectedCopyright(c)}
                                                        className={`p-4 cursor-pointer hover:bg-blue-50 transition border-l-4 ${selectedCopyright?._id === c._id ? 'bg-blue-50 border-primary' : 'border-transparent'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">{c.submissionId}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.paymentStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {c.paymentStatus === 'verified' ? 'PAID' : 'PAY PENDING'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'Approved' ? 'bg-green-100 text-green-700' : c.status === 'Declined' ? 'bg-red-50 text-red-500' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-2">
                                                            <p className="text-[11px] text-gray-600 line-clamp-2 flex-1">{c.paperTitle}</p>
                                                            {c.paymentStatus !== 'verified' && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleNotify(c);
                                                                    }}
                                                                    className="ml-2 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold border border-red-100 items-center gap-1 inline-flex hover:bg-red-100 transition shadow-sm"
                                                                >
                                                                    <Bell className="w-2.5 h-2.5" /> NOTIFY
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 bg-white flex flex-col relative min-h-[50vh] md:min-h-0">
                        {selectedCopyright ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="absolute top-4 right-4 flex bg-gray-100 p-1 rounded-lg z-10">
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'review' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Review
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        History
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
                                    <div className="flex-1">
                                        {activeTab === 'review' ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Details</h2>
                                                    {(() => {
                                                        const authorPapers = copyrights.filter(c => c.authorEmail === selectedCopyright.authorEmail);
                                                        if (authorPapers.length > 1) {
                                                            return (
                                                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Switch:</span>
                                                                    <select 
                                                                        value={selectedCopyright._id}
                                                                        onChange={(e) => {
                                                                            const found = copyrights.find(c => c._id === e.target.value);
                                                                            if (found) setSelectedCopyright(found);
                                                                        }}
                                                                        className="bg-transparent border-none text-[11px] font-bold text-blue-900 focus:outline-none cursor-pointer"
                                                                    >
                                                                        {authorPapers.map(p => (
                                                                            <option key={p._id} value={p._id}>[{p.submissionId}] {p.paperTitle.length > 20 ? p.paperTitle.substring(0, 20) + '...' : p.paperTitle}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-5 border space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="col-span-2">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Paper Title</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold">{selectedCopyright.paperTitle}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedCopyright.paymentStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    Payment: {selectedCopyright.paymentStatus === 'verified' ? 'Done' : 'Unpaid'}
                                                                </span>
                                                                {selectedCopyright.paymentStatus !== 'verified' && (
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => handleManualPaymentUpdate('verified')}
                                                                            className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700 transition flex items-center gap-1"
                                                                        >
                                                                            <CreditCard className="w-2.5 h-2.5" /> MARK AS PAID
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleNotify(selectedCopyright)}
                                                                            className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 transition flex items-center gap-1"
                                                                        >
                                                                            <Bell className="w-2.5 h-2.5" /> NOTIFY UNPAID
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Author</p>
                                                        <p className="text-sm font-medium">{selectedCopyright.authorName}</p>
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${selectedCopyright.status === 'Approved' ? 'text-green-600' : selectedCopyright.status === 'Declined' ? 'text-red-500' : 'text-primary'}`}>{selectedCopyright.status}</p>
                                                    </div>
                                                </div>
                                                    {selectedCopyright.copyrightFormUrl && (
                                                        <a href={selectedCopyright.copyrightFormUrl} target="_blank" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                                            <ExternalLink className="w-4 h-4" /> View Copyright Form
                                                        </a>
                                                    )}
                                                    {selectedCopyright.cameraReadyUrl && (
                                                        <a href={selectedCopyright.cameraReadyUrl} target="_blank" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                                            <ExternalLink className="w-4 h-4" /> View Camera-Ready Paper
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Decision</h3>
                                                    <textarea
                                                        className="w-full border rounded-xl p-4 text-sm"
                                                        rows={3}
                                                        placeholder="Comments..."
                                                        value={adminComment}
                                                        onChange={(e) => setAdminComment(e.target.value)}
                                                    />
                                                    <div className="flex gap-4">
                                                        <button 
                                                            onClick={() => handleReview('Approved')} 
                                                            className={`flex-1 transition-all flex items-center justify-center h-11 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm ${selectedCopyright.status === 'Approved' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'}`}
                                                        >
                                                            {selectedCopyright.status === 'Declined' ? 'Undecline & Approve' : 'Approve'}
                                                        </button>
                                                        
                                                        {selectedCopyright.status !== 'Declined' ? (
                                                            <div className="flex-1 flex gap-2">
                                                                <button 
                                                                    onClick={() => handleReview('Rejected')} 
                                                                    className={`flex-1 transition-all h-11 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 ${selectedCopyright.status === 'Rejected' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'border-red-600 text-red-600 hover:bg-red-50'}`}
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleReview('Declined')} 
                                                                    className="flex-1 transition-all h-11 text-[10px] font-black uppercase tracking-wider rounded-xl bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleReview('Rejected')} 
                                                                className="flex-1 transition-all h-11 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 border-red-600 text-red-600 hover:bg-red-50"
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><History className="w-6 h-6" /> Timeline</h2>
                                                {loadingHistory ? <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div> : history?.timeline?.map((event: any, i: number) => (
                                                    <div key={i} className="flex gap-4 border-l-2 border-gray-100 pl-4 py-2 relative">
                                                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-primary"></div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-bold">{new Date(event.date).toLocaleString()}</p>
                                                            <p className="font-bold text-sm">{event.title}</p>
                                                            <p className="text-xs text-gray-600">{event.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full lg:w-80 flex flex-col gap-4">
                                        {/* Chat Panel */}
                                        <div className="flex flex-col border rounded-xl overflow-hidden bg-gray-50 h-[300px]">
                                            <div className="p-3 bg-white border-b font-bold flex items-center gap-2 text-sm"><MessageCircle className="w-4 h-4" /> Chat</div>
                                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                                {selectedCopyright?.messages?.map((msg, i) => (
                                                    <div key={i} className={`flex ${msg.sender === 'Admin' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] p-2 rounded-lg text-xs ${msg.sender === 'Admin' ? 'bg-primary text-white' : 'bg-white border'}`}>
                                                            <p>{msg.message}</p>
                                                        </div>
                                                    </div>
                                                )) || <div className="text-center text-xs text-gray-400 py-4">No messages</div>}
                                            </div>
                                            <div className="p-2 bg-white border-t flex gap-2">
                                                <input
                                                    className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
                                                    placeholder="Message..."
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                />
                                                <button onClick={handleSendMessage} className="bg-primary text-white p-1.5 rounded-lg"><Send className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400"><FileText className="w-12 h-12 opacity-20" /></div>
                        )}
                    </div>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
};

export default AdminCopyrightManagement;
