import React, { useState } from 'react';
import api from '../config/api';
import { Send, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { emailTemplates, replaceTemplateVariables } from '../services/emailTemplates';



interface FinalDecisionModalProps {
    submissionId: string;
    paperId: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    category: string;
    reviewerComments: string;
    onClose: () => void;
    onSuccess?: () => void;
}

type DecisionType = 'accept' | 'reject' | 'majorRevision' | 'minorRevision';

const FinalDecisionModal: React.FC<FinalDecisionModalProps> = ({
    submissionId,
    paperId,
    authorName,
    authorEmail,
    paperTitle,
    category,
    reviewerComments,
    onClose,
    onSuccess
}) => {
    const [decision, setDecision] = useState<DecisionType>('accept');
    const [customMessage, setCustomMessage] = useState('');
    const [useTemplate, setUseTemplate] = useState(true);
    const [sending, setSending] = useState(false);

    const getDecisionTemplate = (decisionType: DecisionType): string => {
        switch (decisionType) {
            case 'accept':
                return emailTemplates.paperAccepted.defaultTemplate;
            case 'reject':
                return emailTemplates.paperRejected.defaultTemplate;
            case 'majorRevision':
                return emailTemplates.majorRevision.defaultTemplate;
            case 'minorRevision':
                return emailTemplates.minorRevision.defaultTemplate;
        }
    };

    const getDecisionLabel = (decisionType: DecisionType): string => {
        switch (decisionType) {
            case 'accept':
                return '✓ Accept';
            case 'reject':
                return '✗ Reject';
            case 'majorRevision':
                return '! Major Revision';
            case 'minorRevision':
                return '~ Minor Revision';
        }
    };

    const getDecisionColor = (decisionType: DecisionType): string => {
        switch (decisionType) {
            case 'accept':
                return 'bg-green-100 border-green-300 text-green-800';
            case 'reject':
                return 'bg-red-100 border-red-300 text-red-800';
            case 'majorRevision':
                return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            case 'minorRevision':
                return 'bg-orange-100 border-orange-300 text-orange-800';
        }
    };

    const handleSendDecision = async () => {
        if (useTemplate && !customMessage.trim()) {
            Swal.fire('Warning', 'Please add your custom notes', 'warning');
            return;
        }

        setSending(true);
        try {
            let emailContent = '';
            if (useTemplate) {
                emailContent = replaceTemplateVariables(getDecisionTemplate(decision), {
                    '{submissionId}': submissionId,
                    '{paperTitle}': paperTitle,
                    '{authorName}': authorName,
                    '{category}': category,
                    '{reviewerComments}': reviewerComments,
                    '{editorName}': localStorage.getItem('userName') || 'Editor',
                    '{deadline}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    '{revisedDeadline}': '30',
                });
                // Append custom message to template
                emailContent += '\n\n--- Additional Notes from Editor ---\n' + customMessage;
            } else {
                emailContent = customMessage;
            }

            // Send decision email via backend
            await api.post(
                `/api/editor/papers/${paperId}/final-decision`,
                {
                    submissionId,
                    decision,
                    authorEmail,
                    authorName,
                    paperTitle,
                    emailContent,
                    reviewerComments
                }
            );

            Swal.fire(
                'Success',
                `Decision email sent to ${authorName}. Paper marked as ${getDecisionLabel(decision)}`,
                'success'
            );
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Error sending decision:', error);
            Swal.fire(
                'Error',
                error.response?.data?.message || 'Failed to send decision email',
                'error'
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800">Final Decision</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Paper Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700">
                            <strong>Paper:</strong> {paperTitle}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                            <strong>Submission ID:</strong> {submissionId}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                            <strong>Author:</strong> {authorName} ({authorEmail})
                        </p>
                    </div>

                    {/* Decision Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Decision
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(['accept', 'reject', 'majorRevision', 'minorRevision'] as DecisionType[]).map(
                                (option) => (
                                    <button
                                        key={option}
                                        onClick={() => setDecision(option)}
                                        className={`px-3 py-3 rounded-lg border-2 transition text-sm font-medium ${
                                            decision === option
                                                ? `${getDecisionColor(option)} border-current`
                                                : `${getDecisionColor(option)} opacity-50 hover:opacity-75`
                                        }`}
                                    >
                                        {getDecisionLabel(option)}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Template Option */}
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useTemplate}
                                onChange={(e) => setUseTemplate(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Use Email Template
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            If unchecked, only your custom message will be sent
                        </p>
                    </div>

                    {/* Template Preview */}
                    {useTemplate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Template Preview
                            </label>
                            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                                {getDecisionTemplate(decision).split('\n').slice(0, 10).join('\n')}
                                {getDecisionTemplate(decision).split('\n').length > 10 && '\n... (truncated)'}
                            </div>
                        </div>
                    )}

                    {/* Custom Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {useTemplate ? 'Additional Notes (Optional)' : 'Your Message'}
                        </label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder={
                                useTemplate
                                    ? 'Add any additional notes or comments...'
                                    : 'Enter your complete message here...'
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {customMessage.length} characters
                        </p>
                    </div>

                    {/* Reviewer Comments Reference */}
                    {reviewerComments && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reviewer Feedback (Reference)
                            </label>
                            <div className="bg-amber-50 p-4 rounded border border-amber-200 text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {reviewerComments}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendDecision}
                        disabled={sending || (!useTemplate && !customMessage.trim())}
                        className={`px-4 py-2 text-white rounded-lg transition flex items-center gap-2 ${
                            decision === 'accept'
                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                                : decision === 'reject'
                                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                                : 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        {sending ? 'Sending...' : `Send ${getDecisionLabel(decision).split(' ')[0]} Decision`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalDecisionModal;
