import React, { useState, useEffect, useRef } from 'react';
import api from '../config/api';
import { Send, MessageSquare, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';



interface Message {
    sender: 'editor' | 'reviewer' | 'author';
    senderId: string;
    senderName: string;
    senderEmail?: string;
    message: string;
    createdAt: string;
}

interface ReviewerChatProps {
    submissionId: string;
    reviewerId: string;
    reviewerName: string;
    role: 'editor' | 'reviewer';
    reviewId?: string | null;
    onClose: () => void;
}

const ReviewerChat: React.FC<ReviewerChatProps> = ({
    submissionId,
    reviewerId,
    reviewerName,
    role,
    reviewId,
    onClose
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();
        // Set up polling for new messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [submissionId, reviewerId, reviewId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            // Using query param for reviewerId if reviewId is missing
            const baseUrl = role === 'editor' ? 'editor' : 'reviewer';
            let url = `/api/${baseUrl}/messages/${submissionId}`;

            if (role === 'editor') {
                if (reviewId) {
                    url += `/${reviewId}`;
                } else {
                    url += `/null?reviewerId=${reviewerId}`;
                }
            }

            const response = await api.get(url);

            if (response.data.success && response.data.messageThread) {
                setMessages(response.data.messageThread.conversation || []);
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const baseUrl = role === 'editor' ? 'editor' : 'reviewer';
            const response = await api.post(
                `/api/${baseUrl}/send-message`,
                {
                    submissionId,
                    reviewId: role === 'editor' ? (reviewId || undefined) : undefined,
                    reviewerId: role === 'editor' ? reviewerId : undefined,
                    recipientType: role === 'editor' ? 'reviewer' : 'editor',
                    message: newMessage.trim()
                }
            );

            if (response.data.success) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-xl border border-blue-100 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-4 py-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-100" />
                    <div>
                        <h3 className="font-bold text-sm">Chat with {reviewerName}</h3>
                        <p className="text-[10px] text-blue-100 opacity-80 uppercase tracking-wider">Paper: {submissionId}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-blue-500 rounded-full transition text-blue-100 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-xs">Loading conversation...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                        <MessageSquare className="w-12 h-12 mb-2" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender === role;
                        return (
                            <div
                                key={index}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                    }`}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${isMe ? 'text-blue-100' : 'text-blue-600'}`}>
                                            {isMe ? `${role.charAt(0).toUpperCase() + role.slice(1)} (You)` : msg.senderName}
                                        </span>
                                        <span className={`text-[10px] opacity-60 ${isMe ? 'text-blue-50' : 'text-gray-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                <div className="relative flex items-center gap-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[44px] max-h-[120px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as any);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReviewerChat;
