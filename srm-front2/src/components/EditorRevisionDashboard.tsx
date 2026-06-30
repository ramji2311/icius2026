import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { FileText, CheckCircle, XCircle, RotateCw, Clock, Send, Download } from 'lucide-react';
import Swal from 'sweetalert2';



interface RevisionSubmission {
    _id: string;
    submissionId: string;
    paperTitle: string;
    authorName: string;
    originalDecision: 'majorRevision' | 'minorRevision';
    revisionStatus: 'submitted' | 'under-review';
    daysRemaining: number;
    authorNotes: string;
    revisionFiles: Array<{
        _id: string;
        fileName: string;
        uploadedAt: string;
        version: number;
    }>;
    deadline: string;
}

const EditorRevisionDashboard: React.FC = () => {
    const [revisions, setRevisions] = useState<RevisionSubmission[]>([]);
    const [selectedRevision, setSelectedRevision] = useState<RevisionSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [editorComments, setEditorComments] = useState('');
    const [finalDecision, setFinalDecision] = useState<'accept' | 'reject' | 'revise-again' | null>(null);

    useEffect(() => {
        fetchRevisions();
    }, []);

    const fetchRevisions = async () => {
        try {
            const response = await api.get('/api/editor/revision-submissions');
            setRevisions(response.data.revisions);
        } catch (error) {
            console.error('Error fetching revisions:', error);
            Swal.fire('Error', 'Failed to load revision submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalDecision = async () => {
        if (!selectedRevision || !finalDecision) {
            Swal.fire('Warning', 'Please select a decision', 'warning');
            return;
        }

        setReviewing(true);
        try {
            await api.post(
                '/api/editor/review-revision',
                {
                    revisionId: selectedRevision._id,
                    paperId: selectedRevision.submissionId,
                    decision: finalDecision,
                    editorComments,
                    authorEmail: selectedRevision.authorName
                }
            );

            const decisionLabel = finalDecision === 'accept' ? 'Accepted' : 
                                 finalDecision === 'reject' ? 'Rejected' : 'Requested Further Revision';

            Swal.fire('Success', `Revision ${decisionLabel}!`, 'success');
            setEditorComments('');
            setFinalDecision(null);
            setSelectedRevision(null);
            fetchRevisions();
        } catch (error: any) {
            console.error('Error reviewing revision:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to process decision', 'error');
        } finally {
            setReviewing(false);
        }
    };

    const getDecisionColor = (decision: string): string => {
        switch (decision) {
            case 'majorRevision':
                return 'bg-red-100 text-red-800';
            case 'minorRevision':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Review Revised Submissions</h1>
                    <p className="text-gray-600">Review author revisions and make final acceptance/rejection decisions</p>
                </div>

                {revisions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-10 md:p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No revision submissions yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revisions List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="bg-purple-600 text-white px-6 py-4">
                                    <h2 className="text-lg font-semibold">Submitted Revisions ({revisions.length})</h2>
                                </div>
                                <div className="divide-y max-h-96 overflow-y-auto">
                                    {revisions.map((revision) => (
                                        <button
                                            key={revision._id}
                                            onClick={() => setSelectedRevision(revision)}
                                            className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition border-l-4 ${
                                                selectedRevision?._id === revision._id
                                                    ? 'bg-blue-50 border-purple-600'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <p className="font-medium text-gray-800 truncate">
                                                {revision.submissionId}
                                            </p>
                                            <p className="text-sm text-gray-600 truncate">{revision.paperTitle}</p>
                                            <p className="text-xs text-gray-500 mt-1">{revision.authorName}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getDecisionColor(revision.originalDecision)}`}>
                                                    {revision.originalDecision === 'majorRevision' ? 'Major' : 'Minor'}
                                                </span>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {revision.daysRemaining < 0 ? '⚠️ Overdue' : `${revision.daysRemaining}d left`}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Review Details */}
                        {selectedRevision && (
                            <div className="lg:col-span-2 space-y-6">
                                {/* Paper Info */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Revision Details</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Submission ID</p>
                                            <p className="text-lg text-gray-800">{selectedRevision.submissionId}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Paper Title</p>
                                            <p className="text-lg text-gray-800">{selectedRevision.paperTitle}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium">Author</p>
                                                <p className="text-gray-800">{selectedRevision.authorName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium">Original Decision</p>
                                                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getDecisionColor(selectedRevision.originalDecision)}`}>
                                                    {selectedRevision.originalDecision === 'majorRevision' ? 'Major Revision' : 'Minor Revision'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Author Notes */}
                                        {selectedRevision.authorNotes && (
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 font-medium mb-2">Author's Revision Notes</p>
                                                <p className="text-gray-700">{selectedRevision.authorNotes}</p>
                                            </div>
                                        )}

                                        {/* Submitted Files */}
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium mb-3">Submitted Files</p>
                                            <div className="space-y-2">
                                                {selectedRevision.revisionFiles.map((file) => (
                                                    <div key={file._id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-red-600" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{file.fileName}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    v{file.version} • {new Date(file.uploadedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button className="p-1 hover:bg-gray-200 rounded transition">
                                                            <Download className="w-4 h-4 text-blue-600" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-orange-600" />
                                                <div>
                                                    <p className="font-semibold text-orange-900">Deadline</p>
                                                    <p className="text-sm text-orange-800">
                                                        {new Date(selectedRevision.deadline).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Review & Decision */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Review</h3>

                                    {/* Editor Comments */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Editor Comments
                                        </label>
                                        <textarea
                                            value={editorComments}
                                            onChange={(e) => setEditorComments(e.target.value)}
                                            placeholder="Provide feedback on the revisions..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                            rows={4}
                                        />
                                    </div>

                                    {/* Decision Buttons */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Final Decision
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <button
                                                onClick={() => setFinalDecision('accept')}
                                                className={`px-4 py-3 rounded-lg font-semibold transition border-2 flex items-center justify-center gap-2 ${
                                                    finalDecision === 'accept'
                                                        ? 'bg-green-100 border-green-600 text-green-800'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-green-500'
                                                }`}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Accept
                                            </button>

                                            <button
                                                onClick={() => setFinalDecision('revise-again')}
                                                className={`px-4 py-3 rounded-lg font-semibold transition border-2 flex items-center justify-center gap-2 ${
                                                    finalDecision === 'revise-again'
                                                        ? 'bg-yellow-100 border-yellow-600 text-yellow-800'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-500'
                                                }`}
                                            >
                                                <RotateCw className="w-4 h-4" />
                                                Revise Again
                                            </button>

                                            <button
                                                onClick={() => setFinalDecision('reject')}
                                                className={`px-4 py-3 rounded-lg font-semibold transition border-2 flex items-center justify-center gap-2 ${
                                                    finalDecision === 'reject'
                                                        ? 'bg-red-100 border-red-600 text-red-800'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-red-500'
                                                }`}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleFinalDecision}
                                        disabled={reviewing || !finalDecision}
                                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        {reviewing ? 'Sending Decision...' : 'Send Decision & Email'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorRevisionDashboard;
