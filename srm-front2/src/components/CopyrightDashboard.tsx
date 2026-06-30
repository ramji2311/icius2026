import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import api from '../config/api';
import PageTransition from './PageTransition';
import {
    CheckCircle,
    FileText,
    MessageCircle,
    Send,
    Upload,
    AlertTriangle,
    Clock,
    User,
    Download,
    Loader2
} from 'lucide-react';
import AuthorSupportChat from './AuthorSupportChat';
import { useSocket } from '../context/SocketContext';

interface Message {
    sender: 'Author' | 'Admin';
    message: string;
    timestamp: string;
}

const NotificationBadge: React.FC<{ count: number; type?: 'danger' | 'warning' | 'info' }> = ({ count, type = 'danger' }) => {
    if (count <= 0) return null;
    const colors = {
        danger: 'bg-red-500 text-white',
        warning: 'bg-amber-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    return (
        <span className={`inline-flex items-center justify-center min-w-[20px] h-[20px] text-[10px] font-bold rounded-full ${colors[type]} px-1.5 shadow-sm animate-pulse`}>
            {count}
        </span>
    );
};


const CopyrightDashboard: React.FC = React.memo(() => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [eligible, setEligible] = useState(false);
    // Remove unused dashboardData state
    const [hasPaper, setHasPaper] = useState<boolean | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [allPapers, setAllPapers] = useState<any[]>([]);
    const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);
    const [notifications, setNotifications] = useState<any>(null);

    // Final Selection & Document Upload states
    const [isFinalSelected, setIsFinalSelected] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState<any>(null);
    const [isUploadingFinal, setIsUploadingFinal] = useState(false);
    const [finalDocFile, setFinalDocFile] = useState<File | null>(null);

    // Camera Ready Paper Upload states
    const [cameraReadyFile, setCameraReadyFile] = useState<File | null>(null);
    const [uploadingCameraReady, setUploadingCameraReady] = useState(false);



    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (allPapers.length > 0) {
            checkSelectionStatus();
            const paper = allPapers[selectedPaperIndex];
            if (paper?.unreadCount > 0) {
                markMessagesAsRead(paper.copyright?._id);
            }
        }
    }, [selectedPaperIndex, allPapers]);

    const { socket } = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('copyright:message', (data: any) => {
                console.log('📬 New Copyright Message:', data);
                setAllPapers(prev => prev.map(p => {
                    if (p.submissionId === data.submissionId) {
                        return {
                            ...p,
                            unreadCount: data.unreadCount,
                            copyright: {
                                ...p.copyright,
                                messages: [...(p.copyright?.messages || []), data.message]
                            }
                        };
                    }
                    return p;
                }));
            });

            socket.on('copyright:update', (data: any) => {
                console.log('🔄 Copyright Update:', data);
                setAllPapers(prev => prev.map(p => {
                    if (p.submissionId === data.submissionId) {
                        return { ...p, ...data, copyright: { ...(p.copyright || {}), ...data } };
                    }
                    return p;
                }));
                // Re-fetch dashboard summary data (like notifications)
                fetchDashboardData();
            });

            socket.on('paper:status_changed', (data: any) => {
                console.log('📜 Paper Status Changed:', data);
                // When a paper is accepted, we should refresh the whole dashboard to get the new copyright records
                fetchDashboardData();
            });

            return () => {
                socket.off('copyright:message');
                socket.off('copyright:update');
                socket.off('paper:status_changed');
            };
        }
    }, [socket]);

    const markMessagesAsRead = async (copyrightId: string) => {
        if (!copyrightId) return;
        try {
            await api.post('/api/copyright/mark-read', { copyrightId });
            // Update local state to remove unread badge
            const updatedPapers = [...allPapers];
            if (updatedPapers[selectedPaperIndex]) {
                updatedPapers[selectedPaperIndex].unreadCount = 0;
                setAllPapers(updatedPapers);
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/api/copyright/author/dashboard');

            if (response.data.success) {
                setHasPaper(response.data.hasPaper);
                const papers = response.data.data?.allPapers || (response.data.data?.paper ? [response.data.data.paper] : []);
                setAllPapers(papers);
                setNotifications(response.data.notifications);
                setEligible(true);
                // NOTE: Don't call checkSelectionStatus() here — allPapers state is stale.
                // The useEffect watching [selectedPaperIndex, allPapers] will trigger it.
            }
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            if (error.response?.status === 403) {
                setEligible(false);
            } else {
                // Network or server errors should not block the UI forever.
                // Set eligible true so user sees a helpful message instead of "Access Denied".
                setEligible(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        const paper = allPapers[selectedPaperIndex];
        const copyright = paper?.copyright;

        if (!messageInput.trim() || !copyright) return;

        try {
            const response = await api.post('/api/copyright/message', {
                copyrightId: copyright._id,
                message: messageInput
            });

            if (response.data.success) {
                const updatedCopyright = {
                    ...copyright,
                    messages: response.data.data
                };

                const updatedPapers = [...allPapers];
                updatedPapers[selectedPaperIndex] = {
                    ...updatedPapers[selectedPaperIndex],
                    copyright: updatedCopyright
                };
                setAllPapers(updatedPapers);
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleFileUpload = async () => {
        const paper = allPapers[selectedPaperIndex];
        if (!file || !paper) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('submissionId', paper.submissionId);

            // 2. Update backend (Backend now handles the Cloudinary upload securely)
            const response = await api.post('/api/copyright/author/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                const updatedCopyright = response.data.data;
                const updatedPapers = [...allPapers];
                updatedPapers[selectedPaperIndex] = {
                    ...updatedPapers[selectedPaperIndex],
                    copyright: updatedCopyright
                };
                setAllPapers(updatedPapers);

                setFile(null);
                alert('Copyright form uploaded successfully!');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };
    const checkSelectionStatus = async () => {
        try {
            const response = await api.get('/api/papers/check-selection');

            if (response.data.success && response.data.isSelected) {
                const selectedUsers = response.data.selectedUsers || [response.data.selectedUser];
                const currentPaper = allPapers[selectedPaperIndex];

                // Find matching selection record for current paper
                const matchingSelection = selectedUsers.find((s: any) =>
                    s.submissionId?.toLowerCase() === currentPaper?.submissionId?.toLowerCase()
                );

                if (matchingSelection) {
                    setIsFinalSelected(true);
                    setSelectedUserData(matchingSelection);
                } else {
                    setIsFinalSelected(false);
                    setSelectedUserData(null);
                }
            }
        } catch (error) {
            console.error('Error checking selection status:', error);
        }
    };

    // Handle Camera Ready Paper Upload
    const handleCameraReadyUpload = async () => {
        const paper = allPapers[selectedPaperIndex];
        if (!cameraReadyFile || !paper) return;

        setUploadingCameraReady(true);
        try {
            const formData = new FormData();
            formData.append('cameraReadyPdf', cameraReadyFile);
            formData.append('submissionId', paper.submissionId);

            const response = await api.post('/api/copyright/author/upload-camera-ready', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                const updatedPapers = [...allPapers];
                updatedPapers[selectedPaperIndex] = {
                    ...paper,
                    cameraReadyUrl: response.data.cameraReadyUrl
                };
                setAllPapers(updatedPapers);
                setCameraReadyFile(null);
                alert('Camera-ready paper uploaded successfully!');
            }
        } catch (error) {
            console.error('Error uploading camera-ready paper:', error);
            alert('Failed to upload camera-ready paper. Please try again.');
        } finally {
            setUploadingCameraReady(false);
        }
    };

    const handleFinalDocUpload = async () => {
        const paper = allPapers[selectedPaperIndex];
        console.log('handleFinalDocUpload called');
        console.log('finalDocFile:', finalDocFile);
        console.log('Target paper:', paper);

        if (!finalDocFile || !paper?.submissionId) {
            alert('Please select a document first or submission info missing.');
            return;
        }

        const allowedTypes = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf'
        ];

        const fileName = finalDocFile.name.toLowerCase();
        const isWordDoc = allowedTypes.includes(finalDocFile.type) ||
            fileName.endsWith('.doc') ||
            fileName.endsWith('.docx');

        console.log('Validating file:', fileName, 'Type:', finalDocFile.type);

        if (!isWordDoc) {
            alert('Please upload a Microsoft Word (.doc, .docx) file.');
            return;
        }

        console.log('Validation passed, starting upload...');
        setIsUploadingFinal(true);
        try {
            const formData = new FormData();
            formData.append('finalDoc', finalDocFile);

            const response = await api.post(
                `/api/papers/upload-final-doc/${paper.submissionId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Upload response status:', response.status);
            console.log('Upload response data:', response.data);

            if (response.data.success) {
                console.log('Upload successful, updating state...');
                // Use the returned user object or update manually
                if (response.data.selectedUser) {
                    setSelectedUserData(response.data.selectedUser);
                } else {
                    setSelectedUserData((prev: any) => ({
                        ...prev,
                        finalDocUrl: response.data.finalDocUrl,
                        status: 'Final Version Submitted'
                    }));
                }
                setFinalDocFile(null);
                alert('Final document uploaded successfully! You can see it in your dashboard.');
            }
        } catch (error: any) {
            console.error('--- UPLOAD FAILED ---');
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                alert(`Upload failed: ${error.response.data.message || 'Server error'}`);
            } else if (error.request) {
                console.error('No response received from server');
                alert('No response from server. Check if backend is running.');
            } else {
                console.error('Error setting up request:', error.message);
                alert(`Error: ${error.message}`);
            }
        } finally {
            setIsUploadingFinal(false);
            console.log('--- UPLOAD PROCESS ENDED ---');
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-gray-500 font-medium tracking-wide">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!eligible && hasPaper !== false) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-red-500">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-6">
                            There was an error accessing your dashboard. Please try again later.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
                        >
                            Return to Main Dashboard
                        </button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // 1. Case: No paper submitted
    if (hasPaper === false) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 md:p-10 border-t-8 border-primary">
                            <FileText className="w-20 h-20 text-blue-200 mx-auto mb-6" />
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">No Paper Submission Found</h1>
                            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                                You haven't submitted any research papers yet. To access the copyright dashboard and other features, please submit your paper first.
                            </p>
                            <button
                                onClick={() => navigate('/paper-submission')}
                                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg transform hover:-translate-y-1"
                            >
                                <Upload className="w-5 h-5" /> Submit Research Paper
                            </button>

                            <div className="mt-12 text-left">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Need Help?</h3>
                                <p className="text-gray-500 text-sm mb-6">Contact the administration team if you have issues with submission or registration.</p>
                                <AuthorSupportChat />
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    const paper = allPapers[selectedPaperIndex];
    const copyright = paper?.copyright;

    // Helper: check if a paper is in an accepted stage
    const isAcceptedStatus = (status?: string) =>
        status === 'Accepted' || status === 'Published' || status === 'Certificate Generated';

    // 2. Case: Paper submitted but not accepted (Only 'Accepted', 'Published', 'Certificate Generated' papers see the full dashboard)
    if (paper && !isAcceptedStatus(paper.status)) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-blue-900 to-primary p-8 text-white relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold mb-2">Submission Status</h1>
                                        <p className="opacity-80 mb-4">Track your research paper evaluation progress.</p>

                                        {/* Integrated Switcher for status view */}
                                        {allPapers.length > 1 && (
                                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                                                <div className="bg-white/10 p-1 rounded-lg">
                                                    <FileText className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={selectedPaperIndex}
                                                        onChange={(e) => setSelectedPaperIndex(parseInt(e.target.value))}
                                                        className="appearance-none bg-transparent border-none pr-8 text-xs font-bold text-white focus:outline-none cursor-pointer"
                                                    >
                                                        {allPapers.map((p, idx) => (
                                                            <option key={p.submissionId || idx} value={idx} className="text-gray-900">
                                                                [{p.status}] {p.submissionId} - {p.paperTitle.length > 30 ? p.paperTitle.substring(0, 30) + '...' : p.paperTitle}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-white/60">
                                                        <svg className="fill-current h-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate('/paper-submission')}
                                        className="bg-white text-primary px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center gap-2"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Upload Another Paper
                                    </button>
                                </div>
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block opacity-20">
                                    <Clock className="w-24 h-24" />
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex flex-col md:flex-row items-center gap-6 mb-10 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="bg-white p-4 rounded-full shadow-sm">
                                        <Clock className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-1">Current Status</p>
                                        <h2 className={`text-2xl font-black ${paper.status === 'Rejected' ? 'text-red-600' : 'text-primary'
                                            }`}>
                                            {paper.status}
                                        </h2>
                                    </div>
                                    <div className="md:ml-auto">
                                        <button
                                            onClick={() => navigate('/paper-submission')}
                                            className="text-primary hover:underline font-bold"
                                        >
                                            View Submission Details
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="p-6 bg-gray-50 rounded-xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Paper Title</p>
                                        <p className="text-lg font-bold text-gray-800">{paper.paperTitle}</p>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Submission ID</p>
                                        <p className="text-lg font-mono font-bold text-gray-800">{paper.submissionId}</p>
                                    </div>
                                </div>

                                <div className={`p-6 rounded-r-xl border-l-4 shadow-sm ${paper.status === 'Revision Required' ? 'bg-amber-50 border-amber-400' :
                                    paper.status === 'Revised Submitted' ? 'bg-blue-50 border-blue-400' :
                                        paper.status === 'Rejected' ? 'bg-red-50 border-red-400' :
                                            paper.status === 'Conditionally Accept' ? 'bg-emerald-50 border-emerald-400' :
                                                'bg-yellow-50 border-yellow-400'
                                    }`}>
                                    <div className="flex gap-4">
                                        {paper.status === 'Revision Required' ? (
                                            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                        ) : paper.status === 'Revised Submitted' ? (
                                            <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                        ) : paper.status === 'Rejected' ? (
                                            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                        ) : paper.status === 'Conditionally Accept' ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                                        ) : (
                                            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                                        )}
                                        <div>
                                            {paper.status === 'Revision Required' ? (
                                                <>
                                                    <p className="text-amber-900 font-bold mb-1">Revision Required</p>
                                                    <p className="text-amber-800 text-sm mb-4 leading-relaxed">
                                                        The editorial board has requested revisions for this manuscript. Please review the comments and submit your revised version.
                                                    </p>
                                                    <button
                                                        onClick={() => navigate('/author-revisions')}
                                                        className="bg-amber-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition shadow-sm active:scale-95 flex items-center gap-2"
                                                    >
                                                        <FileText className="w-4 h-4" /> Go to Revisions
                                                    </button>
                                                </>
                                            ) : paper.status === 'Revised Submitted' ? (
                                                <>
                                                    <p className="text-blue-900 font-bold mb-1">Revision Submitted</p>
                                                    <p className="text-blue-800 text-sm">
                                                        Your revised manuscript is currently being evaluated. We will notify you once a decision has been reached.
                                                    </p>
                                                </>
                                            ) : paper.status === 'Rejected' ? (
                                                <>
                                                    <p className="text-red-900 font-bold mb-1">Paper Rejected</p>
                                                    <p className="text-red-800 text-sm">
                                                        Unfortunately, this manuscript has not been accepted for further processing. You can switch to your other submissions using the dropdown above.
                                                    </p>
                                                </>
                                            ) : paper.status === 'Conditionally Accept' ? (
                                                <>
                                                    <p className="text-emerald-900 font-bold mb-1">Conditionally Accepted</p>
                                                    <p className="text-emerald-800 text-sm">
                                                        Your paper has been conditionally accepted. Please fulfill the final requirements to proceed to the copyright stage.
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-yellow-800">
                                                    <strong>Copyright submission is not yet available.</strong> Your paper is currently in the <strong>{paper.status}</strong> stage. Once it is officially accepted, you will be able to complete the copyright formalities here.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <AuthorSupportChat />
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }


    if (!paper || !copyright) return null;

    return (
        <PageTransition>
            <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border-l-4 border-primary">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Author Dashboard</h1>
                            <p className="text-gray-600 mt-1 mb-4">Manage your copyright submission and communicate with admins.</p>

                            {/* Integrated Paper Switcher */}
                            {allPapers.length > 1 && (
                                <div className="flex items-center gap-3 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50 w-fit">
                                    <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={selectedPaperIndex}
                                            onChange={(e) => setSelectedPaperIndex(parseInt(e.target.value))}
                                            className="appearance-none bg-transparent border-none pr-8 text-sm font-bold text-gray-800 focus:outline-none cursor-pointer"
                                        >
                                            {allPapers.map((p, idx) => (
                                                <option key={p.submissionId || idx} value={idx}>
                                                    {p.unreadCount > 0 ? `📩 (${p.unreadCount}) ` : ''}
                                                    {p.needsCopyright || p.needsCameraReady ? '⚠️ ACTION NEEDED: ' : ''}
                                                    [{p.status}] {p.submissionId} - {p.paperTitle.length > 40 ? p.paperTitle.substring(0, 40) + '...' : p.paperTitle}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-primary">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {allPapers[selectedPaperIndex]?.unreadCount > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <NotificationBadge count={allPapers[selectedPaperIndex].unreadCount} />
                                            <span className="text-[10px] font-bold text-red-500 uppercase">New Messages</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${copyright.status === 'Approved' ? 'bg-green-500 text-white' :
                                    copyright.status === 'Rejected' ? 'bg-red-500 text-white' :
                                        copyright.status === 'Submitted' ? 'bg-blue-500 text-white' :
                                            'bg-amber-500 text-white'
                                    }`}>
                                    {copyright.status.toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/paper-submission')}
                                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-blue-100 flex items-center gap-2 text-sm active:scale-95"
                            >
                                <Upload className="w-4 h-4" />
                                Submit Another
                            </button>
                        </div>
                    </div>


                    {/* Notification Summary Bar */}
                    {notifications && notifications.totalTasks > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-xl shadow-sm animate-in slide-in-from-left duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-amber-100 p-2 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-900">Action Required: {notifications.totalTasks} tasks pending</h3>
                                        <p className="text-sm text-amber-700">
                                            {notifications.pendingCopyrights > 0 && `• ${notifications.pendingCopyrights} Copyright forms missing `}
                                            {notifications.pendingCameraReady > 0 && `• ${notifications.pendingCameraReady} Camera-ready papers needed `}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex gap-2">
                                    {allPapers.filter(p => p.needsCopyright || p.needsCameraReady).map((p, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedPaperIndex(allPapers.indexOf(p))}
                                            className="text-[10px] bg-white border border-amber-200 px-3 py-1.5 rounded-lg font-bold text-amber-700 hover:bg-amber-100 transition shadow-sm"
                                        >
                                            FIX {p.submissionId}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Upload & Info */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Paper Info Card */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-900 to-primary p-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Paper Information
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Paper Title</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.paperTitle}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Submission ID</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.submissionId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Author Name</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.authorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Contact Email</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.authorEmail}</p>
                                    </div>
                                    {paper?.pdfUrl && (
                                        <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-500">Submitted Manuscript</p>
                                            <a
                                                href={paper.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-primary font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg transition"
                                            >
                                                <FileText className="w-4 h-4" /> View Paper
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Upload Section */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-900 to-primary p-4 text-white font-semibold flex items-center gap-2">
                                    <Upload className="w-5 h-5" /> Copyright Form Submission
                                </div>
                                <div className="p-6 text-center">
                                    {copyright.status === 'Approved' ? (
                                        <div className="py-12 flex flex-col items-center">
                                            <div className="bg-green-100 p-6 rounded-full mb-6 animate-bounce">
                                                <CheckCircle className="w-16 h-16 text-green-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Copyright Process Done</h3>
                                            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed px-4">
                                                Soon we will inform you for the presentation, venue and time on conference.
                                                <br />
                                                <span className="font-bold text-primary italic mt-4 block">All the best!</span>
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-4 mt-8">
                                                {copyright.copyrightFormUrl && (
                                                    <a
                                                        href={copyright.copyrightFormUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg hover:scale-105 active:scale-95"
                                                    >
                                                        <Download className="w-5 h-5" /> View Final Form
                                                    </a>
                                                )}
                                                {paper?.pdfUrl && (
                                                    <a
                                                        href={paper.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:scale-105 active:scale-95"
                                                    >
                                                        <FileText className="w-5 h-5" /> View Final Paper
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {copyright.copyrightFormUrl ? (
                                                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg inline-flex items-center gap-3">
                                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                                    <div className="text-left">
                                                        <p className="text-green-800 font-bold">Form Already Submitted</p>
                                                        <a
                                                            href={copyright.copyrightFormUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline text-sm flex items-center gap-1 font-medium"
                                                        >
                                                            <Download className="w-4 h-4" /> View Submitted Form
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg inline-flex items-center gap-3">
                                                    <Clock className="w-6 h-6 text-yellow-500" />
                                                    <div className="text-left">
                                                        <p className="text-yellow-800 font-bold">Pending Submission</p>
                                                        <p className="text-sm text-yellow-700">Please sign the copyright form and upload it here.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 max-w-lg mx-auto border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary transition cursor-pointer group relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                    accept=".pdf,.doc,.docx"
                                                />
                                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-primary transition" />
                                                <p className="text-gray-700 font-semibold">{file ? file.name : 'Click or Drag form here to upload'}</p>
                                                <p className="text-gray-500 text-xs mt-2">Accepted formats: PDF, DOCX (Max 10MB)</p>
                                            </div>

                                            {/* Camera Ready Paper Upload */}
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Camera-Ready Paper</h4>
                                                {paper?.cameraReadyUrl ? (
                                                    <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                                                        <p className="text-green-800 font-medium text-sm">Camera-ready paper uploaded</p>
                                                        <a
                                                            href={paper.cameraReadyUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline text-xs flex items-center gap-1 mt-1"
                                                        >
                                                            <Download className="w-3 h-3" /> View Camera-Ready Paper
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="max-w-lg mx-auto border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition cursor-pointer group relative bg-blue-50/50">
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            onChange={(e) => setCameraReadyFile(e.target.files?.[0] || null)}
                                                            accept=".pdf"
                                                        />
                                                        <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:text-blue-600 transition" />
                                                        <p className="text-gray-600 text-sm font-medium">{cameraReadyFile ? cameraReadyFile.name : 'Upload Camera-Ready Paper (PDF)'}</p>
                                                        <p className="text-gray-400 text-xs mt-1">Optional: Upload your final formatted paper</p>
                                                    </div>
                                                )}
                                                {cameraReadyFile && !paper?.cameraReadyUrl && (
                                                    <button
                                                        onClick={handleCameraReadyUpload}
                                                        disabled={uploadingCameraReady}
                                                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow flex items-center gap-2 mx-auto text-sm"
                                                    >
                                                        {uploadingCameraReady ? (
                                                            <>
                                                                <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4" /> Upload Camera-Ready Paper
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {file && (
                                                <button
                                                    onClick={handleFileUpload}
                                                    disabled={uploading}
                                                    className="mt-6 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg flex items-center gap-2 mx-auto"
                                                >
                                                    {uploading ? (
                                                        <>
                                                            <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-5 h-5" /> Submit Copyright Form
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {copyright.status === 'Rejected' && (
                                                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                                                    <p className="text-red-700 font-bold flex items-center justify-center gap-2">
                                                        <AlertTriangle className="w-5 h-5" /> Re-upload required due to mistakes.
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Communication */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[700px]">
                            <div className="bg-gradient-to-r from-blue-900 to-primary p-4 text-white font-semibold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" /> Communication View
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {copyright.messages.length === 0 ? (
                                    <div className="text-center py-20 opacity-40">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                                        <p>No messages yet.<br />Start communication with admin.</p>
                                    </div>
                                ) : (
                                    copyright.messages.map((msg: Message, idx: number) => (
                                        <div key={idx} className={`flex ${msg.sender === 'Author' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.sender === 'Author'
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }`}>
                                                <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                                    <User className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{msg.sender}</span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                <p className={`text-[9px] mt-1.5 text-right font-medium opacity-60`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t bg-white">
                                <div className="flex gap-2">
                                    <textarea
                                        placeholder="Type your message here..."
                                        rows={2}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        className="flex-1 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                        className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50 h-fit self-end shadow-md"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
});

export default CopyrightDashboard;
