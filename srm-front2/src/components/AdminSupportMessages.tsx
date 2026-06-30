import { useState, useEffect } from 'react';
import api from '../config/api';
import { MessageSquare, User, Send, Clock, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface Message {
    sender: 'Author' | 'Admin';
    senderName: string;
    message: string;
    timestamp: string;
}

interface SupportThread {
    _id: string;
    authorId: string;
    authorEmail: string;
    authorName: string;
    messages: Message[];
    lastMessageAt: string;
    status: 'Open' | 'Replied' | 'Closed';
}

const AdminSupportMessages = () => {
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
    const [replyInput, setReplyInput] = useState('');
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');



    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/support-messages/all-threads');

            if (response.data.success) {
                setThreads(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyInput.trim() || !selectedThread) return;

        setSending(true);
        try {
            const response = await api.post('/api/support-messages/send', {
                authorId: selectedThread.authorId,
                message: replyInput
            });

            if (response.data.success) {
                const updatedThread = response.data.data;
                setSelectedThread(updatedThread);
                setThreads(prev => prev.map(t => t._id === updatedThread._id ? updatedThread : t));
                setReplyInput('');
                Swal.fire({
                    icon: 'success',
                    title: 'Reply Sent',
                    text: 'The author will see your reply in their dashboard.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            Swal.fire('Error', 'Failed to send reply', 'error');
        } finally {
            setSending(false);
        }
    };

    const filteredThreads = threads.filter(t =>
        t.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.authorEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && threads.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col lg:flex-row h-[600px] lg:h-[700px]">
            {/* Thread List Sidebar */}
            <div className="w-full lg:w-1/3 border-r border-b lg:border-b-0 flex flex-col bg-gray-50">
                <div className="p-4 border-b bg-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" /> Support Tickets
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredThreads.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No support messages found.</div>
                    ) : (
                        filteredThreads.map(thread => (
                            <div
                                key={thread._id}
                                onClick={() => setSelectedThread(thread)}
                                className={`p-4 border-b cursor-pointer transition-colors ${selectedThread?._id === thread._id
                                    ? 'bg-blue-50 border-r-4 border-r-primary'
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800 text-sm truncate flex-1 mr-2">{thread.authorName}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${thread.status === 'Open' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {thread.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate mb-2">{thread.authorEmail}</p>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {new Date(thread.lastMessageAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedThread ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{selectedThread.authorName}</h3>
                                    <p className="text-xs text-gray-500">{selectedThread.authorEmail}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {selectedThread.messages.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No messages yet in this thread.</p>
                                </div>
                            ) : (
                                selectedThread.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'Admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.sender === 'Admin'
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1.5 opacity-70">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{msg.sender}</span>
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            <div className="text-[9px] mt-2 text-right opacity-60 font-medium">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Reply Input */}
                        <div className="p-4 border-t">
                            <div className="flex gap-3">
                                <textarea
                                    placeholder="Type your reply to author..."
                                    className="flex-1 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition"
                                    rows={3}
                                    value={replyInput}
                                    onChange={(e) => setReplyInput(e.target.value)}
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending || !replyInput.trim()}
                                    className="bg-primary text-white px-6 rounded-xl hover:bg-primary/90 transition shadow-lg flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                    <span className="text-[10px] font-bold">REPLY</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 sm:p-8 md:p-10 text-center">
                        <div className="bg-gray-50 p-6 sm:p-10 rounded-full mb-6">
                            <MessageSquare className="w-20 h-20 opacity-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-600">Select a support ticket</h3>
                        <p className="text-sm max-w-xs mt-2">Choose an author from the list on the left to view messages and reply to their inquiries.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportMessages;
