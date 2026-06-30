import { useState, useEffect } from 'react';
import { FileText, Calendar, Mail, User, ExternalLink, Download, ChevronDown, ChevronUp, MessageCircle } from 'react-feather';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

interface SelectedUser {
    _id: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    submissionId: string;
    registrationNumber?: string;
    selectionDate: string;
    status: string;
    paperUrl: string;
    copyrightUrl: string;
    finalDocUrl?: string;
    finalDocSubmittedAt?: string;
}

const AdminSelectedUsers = () => {
    const { user } = useAuth();
    const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedAuthors, setExpandedAuthors] = useState<string[]>([]);

    useEffect(() => {
        fetchSelectedUsers();
    }, []);

    const fetchSelectedUsers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/admin/selected-users`);

            if (response.data.success) {
                setSelectedUsers(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching selected users:', error);
            Swal.fire({
                icon: 'info',
                title: 'Error',
                text: 'Failed to load conference selected users'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendSelectionEmail = async (submissionId: string) => {
        try {
            const result = await Swal.fire({
                title: 'Send Selection Email?',
                text: 'This will notify the author and request final document upload (.doc format).',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#F5A051',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Send Email'
            });

            if (result.isConfirmed) {
                const emailEndpoint = user?.role === 'Admin'
                    ? `/api/admin/selected-users/send-email`
                    : `/api/editor/selected-users/send-email`;

                const response = await api.post(
                    emailEndpoint,
                    { submissionId }
                );

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sent!',
                        text: 'Selection email has been sent successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
        } catch (error: any) {
            console.error('Error sending selection email:', error);
            Swal.fire({
                icon: 'info',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to send email'
            });
        }
    };

    const filteredUsers = selectedUsers.filter((user: SelectedUser) =>
        user.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.authorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.submissionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date: string | number | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const toggleAuthor = (email: string) => {
        setExpandedAuthors((prev: string[]) => 
            prev.includes(email) ? prev.filter((e: string) => e !== email) : [...prev, email]
        );
    };

    // Grouping logic
    const groupedUsers = filteredUsers.reduce((acc: { [key: string]: SelectedUser[] }, user: SelectedUser) => {
        const key = user.authorEmail;
        if (!acc[key]) acc[key] = [];
        acc[key].push(user);
        return acc;
    }, {});

    const authorEmails = Object.keys(groupedUsers);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Conference Selected Users</h2>
                <p className="text-gray-600 mb-4">
                    Users who have completed the full conference process (paper submission, review, copyright, and payment)
                </p>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, email, paper title, or submission ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F5A051] focus:ring-4 focus:ring-[#F5A051]/10"
                    />
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">
                        Total Selected: <span className="text-[#F5A051]">{selectedUsers.length}</span>
                    </span>
                    {searchTerm && (
                        <span className="text-gray-600">
                            Filtered: <span className="font-semibold">{filteredUsers.length}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-10 md:p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading selected users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-10 md:p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                        {searchTerm ? 'No users found matching your search' : 'No selected users yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {authorEmails.map((email) => {
                        const papers = groupedUsers[email];
                        const authorInfo = papers[0];
                        const isExpanded = expandedAuthors.includes(email);

                        return (
                            <div key={email} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                                {/* Author Header Card */}
                                <div 
                                    onClick={() => toggleAuthor(email)}
                                    className={`p-5 cursor-pointer flex items-center justify-between transition-colors ${isExpanded ? 'bg-orange-50/30' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl border-2 border-orange-200">
                                            {authorInfo.authorName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{authorInfo.authorName}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                {email}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Impact</p>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-black">
                                                    {papers.length} {papers.length === 1 ? 'PAPER' : 'PAPERS'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-full ${isExpanded ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Papers List (Accordion Content) */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/30 p-4 space-y-4 animate-fadeIn">
                                        {papers.map((user: SelectedUser) => (
                                            <div
                                                key={user._id}
                                                className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-orange-500 hover:border-orange-600 transition-all"
                                            >
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Left Column */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-black uppercase">
                                                                    Selected Paper
                                                                </span>
                                                                <span className="text-[11px] font-mono text-gray-400">ID: {user.submissionId}</span>
                                                            </div>
                                                            <p className="text-gray-900 font-bold text-base leading-snug">{user.paperTitle}</p>
                                                        </div>

                                                        {user.registrationNumber && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="text-gray-500 font-medium">Registration:</span>
                                                                <span className="font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-100">
                                                                    {user.registrationNumber}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {!user.registrationNumber || user.registrationNumber === 'N/A' ? (
                                                            <div className="flex items-center gap-4">
                                                                <button 
                                                                    onClick={() => handleSendSelectionEmail(user.submissionId)}
                                                                    className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-2 rounded-lg transition"
                                                                >
                                                                    <Mail className="w-3.5 h-3.5" /> RE-SEND NOTIFICATION
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                                                <span className="font-bold">✓ Registration Complete</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right Column */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-gray-500">Confirmed on</span>
                                                                <span className="font-bold text-gray-700">{formatDate(user.selectionDate)}</span>
                                                            </div>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-tighter">
                                                                ✓ {user.status}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Artifacts</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                <a
                                                                    href={user.paperUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition shadow-sm text-xs font-bold border border-blue-100"
                                                                >
                                                                    <FileText className="w-4 h-4" /> PAPER
                                                                </a>
                                                                <a
                                                                    href={user.copyrightUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition shadow-sm text-xs font-bold border border-purple-100"
                                                                >
                                                                    <Download className="w-4 h-4" /> COPYRIGHT
                                                                </a>
                                                                {user.finalDocUrl && (
                                                                    <a
                                                                        href={user.finalDocUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition shadow-sm text-xs font-bold border border-green-100"
                                                                    >
                                                                        <FileText className="w-4 h-4" /> CAMERA-READY
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
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
            )}
        </div>
    );
};

export default AdminSelectedUsers;
