import { useState, useEffect } from 'react';
import api from '../config/api';
import { MessageSquare, Send, User, Clock, Loader2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface Message {
    sender: 'Author' | 'Admin';
    senderName: string;
    message: string;
    timestamp: string;
}

interface SupportThread {
    _id: string;
    messages: Message[];
    status: string;
    unreadCount?: number;
}

const AuthorSupportChat = () => {
    const [thread, setThread] = useState<SupportThread | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    

    useEffect(() => {
        fetchMessages();
    }, []);

    const { socket } = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('support:message', (data: any) => {
                console.log('💬 New Support Message:', data);
                setThread(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: [...prev.messages, data.message],
                        unreadCount: data.unreadCount
                    };
                });
            });

            return () => {
                socket.off('support:message');
            };
        }
    }, [socket]);

    const fetchMessages = async () => {
        try {
            const response = await api.get('/api/support-messages/my-messages');

            if (response.data.success) {
                setThread({
                    ...response.data.data,
                    unreadCount: response.data.unreadCount
                });
            }
        } catch (error) {
            console.error('Error fetching support messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        setSending(true);
        try {
            const response = await api.post('/api/support-messages/send', {
                message: messageInput
            });

            if (response.data.success) {
                setThread(response.data.data);
                setMessageInput('');

                // Scroll to bottom
                const chatContainer = document.getElementById('support-chat-messages');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Error sending support message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[min(70vh,600px)] min-h-[320px] sm:h-[600px] border border-gray-100 mt-8">
            <div className="bg-gradient-to-r from-blue-900 to-primary p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold">Admin Support Chat</h3>
                        <p className="text-[10px] opacity-70">Typically replies within 24 hours</p>
                    </div>
                </div>
                {(thread?.status === 'Replied' || (thread?.unreadCount ?? 0) > 0) && (
                    <div className="flex items-center gap-2">
                        {thread?.unreadCount ? (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                {thread.unreadCount} NEW
                            </span>
                        ) : (
                            <span className="bg-green-500 text-white text-[10px] px-2 py-1 rounded-full animate-pulse font-bold">NEW REPLY</span>
                        )}
                    </div>
                )}
            </div>

            <div
                id="support-chat-messages"
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
            >
                {thread?.messages.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-medium">No messages yet.</p>
                        <p className="text-xs opacity-60 mt-1">Ask the committee anything about your submission or registration.</p>
                    </div>
                ) : (
                    thread?.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'Author' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.sender === 'Author'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70">
                                    <User className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{msg.sender}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                <div className="text-[9px] mt-2 text-right opacity-60 flex items-center justify-end gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-white border-t">
                <div className="flex gap-3">
                    <textarea
                        className="flex-1 bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none resize-none"
                        placeholder="Type your message to the Admin..."
                        rows={2}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !messageInput.trim()}
                        className="bg-primary text-white p-4 rounded-xl hover:bg-primary/90 transition shadow-lg disabled:opacity-50 self-end"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthorSupportChat;
