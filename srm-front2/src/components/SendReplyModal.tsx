import React, { useState } from 'react';
import api from '../config/api';
import { Send, X, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { emailTemplates, replaceTemplateVariables } from '../services/emailTemplates';



interface SendReplyProps {
    submissionId: string;
    reviewId: string;
    recipientType: 'reviewer' | 'author';
    recipientName: string;
    recipientEmail: string;
    paperTitle: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const SendReplyModal: React.FC<SendReplyProps> = ({
    submissionId,
    reviewId,
    recipientType,
    recipientName,
    recipientEmail,
    paperTitle,
    onClose,
    onSuccess
}) => {
    const [templateType, setTemplateType] = useState<'default' | 'custom'>('default');
    const [messageText, setMessageText] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const templates = {
        replyToReviewer: emailTemplates.replyToReviewer.defaultTemplate,
        replyToAuthor: emailTemplates.replyToAuthor.defaultTemplate,
    };

    const getDefaultTemplate = () => {
        if (recipientType === 'reviewer') {
            return templates.replyToReviewer;
        } else {
            return templates.replyToAuthor;
        }
    };

    const handleSendWithTemplate = async () => {
        if (!messageText.trim()) {
            Swal.fire('Warning', 'Please enter your message', 'warning');
            return;
        }

        setSendingEmail(true);
        try {
            // Replace template variables
            const emailContent = replaceTemplateVariables(getDefaultTemplate(), {
                '{reviewerName}': recipientName,
                '{authorName}': recipientName,
                '{submissionId}': submissionId,
                '{paperTitle}': paperTitle,
                '{userMessage}': messageText,
                '{editorName}': localStorage.getItem('userName') || 'Editor',
            });

            // Send email via backend
            await api.post(
                '/api/editor/send-message',
                {
                    submissionId,
                    reviewId,
                    recipientType,
                    recipientEmail,
                    subject: `Reply to ${recipientType === 'reviewer' ? 'Reviewer' : 'Author'}`,
                    message: emailContent,
                    isEmail: true
                }
            );

            Swal.fire('Success', `Email sent to ${recipientName}`, 'success');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Error sending email:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to send email', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Send Reply to {recipientType === 'reviewer' ? 'Reviewer' : 'Author'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Recipient Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600">
                            <strong>To:</strong> {recipientName} ({recipientEmail})
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            <strong>Paper:</strong> {paperTitle}
                        </p>
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message Format
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="template"
                                    value="default"
                                    checked={templateType === 'default'}
                                    onChange={() => setTemplateType('default')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700">Use Template</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="template"
                                    value="custom"
                                    checked={templateType === 'custom'}
                                    onChange={() => setTemplateType('custom')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700">Custom Message</span>
                            </label>
                        </div>
                    </div>

                    {/* Template Preview (if using default) */}
                    {templateType === 'default' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Template Preview
                            </label>
                            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                {getDefaultTemplate()}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Your message will be inserted where it shows {'{userMessage}'}
                            </p>
                        </div>
                    )}

                    {/* Message Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {templateType === 'default' ? 'Your Message' : 'Custom Message'}
                        </label>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder={
                                templateType === 'default'
                                    ? 'Enter your message to be included in the template...'
                                    : 'Enter your complete message here...'
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={5}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendWithTemplate}
                        disabled={sendingEmail || !messageText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {sendingEmail ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendReplyModal;
