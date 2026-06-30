import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { Upload, FileText, Clock, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { useWebSocket } from '../context/WebSocketContext';

interface RevisionPaper {
    _id: string;
    submissionId: string;
    paperTitle: string;
    originalDecision: 'majorRevision' | 'minorRevision';
    deadline: string;
    revisionStatus: 'pending' | 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'revise-again';
    authorNotes?: string;
    editorComments?: string;
    revisionFiles?: Array<{
        _id: string;
        fileName: string;
        uploadedAt: string;
        version: number;
    }>;
    daysRemaining?: number;
}

const AuthorRevisionDashboard: React.FC = () => {
    const [revisions, setRevisions] = useState<RevisionPaper[]>([]);
    const [selectedRevision, setSelectedRevision] = useState<RevisionPaper | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [authorNotes, setAuthorNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewPdf, setViewPdf] = useState<string | null>(null);

    useEffect(() => {
        fetchRevisions();
    }, []);

    const { socket } = useWebSocket();

    useEffect(() => {
        if (socket) {
            socket.on('paper:status_changed', (data: any) => {
                console.log('📜 Revision update in Dashboard:', data);
                fetchRevisions();
            });

            return () => {
                socket.off('paper:status_changed');
            };
        }
    }, [socket]);

    const fetchRevisions = async () => {
        try {
            const response = await api.get(
                `/api/author/revision-requests`
            );
            setRevisions(response.data.revisions);
        } catch (error) {
            console.error('Error fetching revisions:', error);
            Swal.fire('Error', 'Failed to load revision requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                Swal.fire('Error', 'Please select a PDF file', 'error');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire('Error', 'File size must be less than 10MB', 'error');
                return;
            }
            setUploadFile(file);
        }
    };

    const handleSubmitRevision = async () => {
        if (!selectedRevision || !uploadFile) {
            Swal.fire('Warning', 'Please select a PDF file to upload', 'warning');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target?.result as string;

                await api.post(
                    `/api/author/submit-revision`,
                    {
                        submissionId: selectedRevision.submissionId,
                        file: base64,
                        notes: authorNotes
                    }
                );

                Swal.fire('Success', 'Revision submitted successfully!', 'success');
                setUploadFile(null);
                setAuthorNotes('');
                setSelectedRevision(null);
                fetchRevisions();
            };
            reader.readAsDataURL(uploadFile);
        } catch (error: any) {
            console.error('Error submitting revision:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to submit revision', 'error');
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'submitted':
                return 'bg-blue-100 text-blue-800';
            case 'under-review':
                return 'bg-orange-100 text-orange-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'revise-again':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'pending':
                return 'Awaiting Submission';
            case 'submitted':
                return 'Submitted';
            case 'under-review':
                return 'Under Review';
            case 'accepted':
                return 'Accepted';
            case 'rejected':
                return 'Rejected';
            case 'revise-again':
                return 'Revise Again Required';
            default:
                return 'Unknown';
        }
    };

    const getDecisionLabel = (decision: string): string => {
        return decision === 'majorRevision' ? 'Major Revision Required' : 'Minor Revision Required';
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Revision Submissions</h1>
                    <p className="text-gray-600">Respond to editor feedback and resubmit your revised papers</p>
                </div>

                {revisions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-10 md:p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No revision requests at this time</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revisions List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4">
                                    <h2 className="text-lg font-semibold">Revision Requests ({revisions.length})</h2>
                                </div>
                                <div className="divide-y max-h-96 overflow-y-auto">
                                    {revisions.map((revision) => (
                                        <button
                                            key={revision._id}
                                            onClick={() => setSelectedRevision(revision)}
                                            className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition border-l-4 ${
                                                selectedRevision?._id === revision._id
                                                    ? 'bg-blue-50 border-blue-600'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <p className="font-medium text-gray-800 truncate">
                                                {revision.submissionId}
                                            </p>
                                            <p className="text-sm text-gray-600 truncate">{revision.paperTitle}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(revision.revisionStatus)}`}>
                                                    {getStatusLabel(revision.revisionStatus)}
                                                </span>
                                                {revision.daysRemaining !== undefined && (
                                                    <span className={`text-xs font-medium ${
                                                        revision.daysRemaining < 0 ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {revision.daysRemaining < 0
                                                            ? 'Overdue'
                                                            : `${revision.daysRemaining}d left`}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Details & Upload */}
                        {selectedRevision && (
                            <div className="lg:col-span-2 space-y-6">
                                {/* Revision Details */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Revision Details</h3>

                                    {/* Decision Info */}
                                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-amber-900">
                                                    {getDecisionLabel(selectedRevision.originalDecision)}
                                                </p>
                                                <p className="text-sm text-amber-800 mt-1">
                                                    {selectedRevision.originalDecision === 'majorRevision'
                                                        ? 'Your paper requires significant revisions. Please address all reviewer comments carefully.'
                                                        : 'Your paper requires minor revisions. Please address the reviewer comments.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Deadline</p>
                                            <p className="text-lg font-semibold text-gray-800">
                                                {new Date(selectedRevision.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Status</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRevision.revisionStatus)}`}>
                                                {getStatusLabel(selectedRevision.revisionStatus)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Editor Comments */}
                                    {selectedRevision.editorComments && (
                                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                            <p className="text-sm text-gray-600 font-medium mb-2">Editor Comments</p>
                                            <p className="text-gray-700 whitespace-pre-wrap">{selectedRevision.editorComments}</p>
                                        </div>
                                    )}

                                    {/* Previous Revisions */}
                                    {selectedRevision.revisionFiles && selectedRevision.revisionFiles.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 font-medium mb-3">Previous Submissions</p>
                                            <div className="space-y-2">
                                                {selectedRevision.revisionFiles.map((file) => (
                                                    <div key={file._id} className="flex items-center justify-between bg-white p-3 rounded border">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-red-600" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{file.fileName}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    v{file.version} • {new Date(file.uploadedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setViewPdf(file._id)}
                                                            className="p-1 hover:bg-gray-100 rounded transition"
                                                        >
                                                            <Download className="w-4 h-4 text-blue-600" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Section */}
                                {selectedRevision.revisionStatus === 'pending' || selectedRevision.revisionStatus === 'revise-again' ? (
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Upload className="w-5 h-5" />
                                            Upload Revised Paper
                                        </h3>

                                        {/* File Upload */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select PDF File
                                            </label>
                                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-50 transition cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={handleFileSelect}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                                                <p className="text-gray-700 font-medium">
                                                    {uploadFile ? uploadFile.name : 'Click to select PDF file'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">Maximum file size: 10MB</p>
                                            </div>
                                        </div>

                                        {/* Author Notes */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Revision Notes (Optional)
                                            </label>
                                            <textarea
                                                value={authorNotes}
                                                onChange={(e) => setAuthorNotes(e.target.value)}
                                                placeholder="Describe the changes you made to address the reviewer comments..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                rows={4}
                                            />
                                            <p className="text-sm text-gray-500 mt-1">{authorNotes.length} characters</p>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setUploadFile(null);
                                                    setAuthorNotes('');
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={handleSubmitRevision}
                                                disabled={uploading || !uploadFile}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Submit Revision'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`rounded-lg shadow-md p-6 text-center ${
                                        selectedRevision.revisionStatus === 'accepted'
                                            ? 'bg-green-50 border-l-4 border-green-500'
                                            : 'bg-gray-50'
                                    }`}>
                                        {selectedRevision.revisionStatus === 'accepted' && (
                                            <>
                                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                                <p className="text-lg font-semibold text-green-800">Paper Accepted! 🎉</p>
                                                <p className="text-green-700 mt-2">Your revised paper has been accepted for publication.</p>
                                            </>
                                        )}
                                        {selectedRevision.revisionStatus === 'rejected' && (
                                            <>
                                                <X className="w-12 h-12 text-red-600 mx-auto mb-2" />
                                                <p className="text-lg font-semibold text-red-800">Paper Rejected</p>
                                                <p className="text-red-700 mt-2">Unfortunately, your paper was not accepted after revision review.</p>
                                            </>
                                        )}
                                        {selectedRevision.revisionStatus === 'submitted' && (
                                            <>
                                                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                                                <p className="text-lg font-semibold text-blue-800">Under Review</p>
                                                <p className="text-blue-700 mt-2">Your revision is being reviewed by the editorial team.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* PDF Viewer Modal */}
                {viewPdf && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-auto">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">PDF Preview</h3>
                                <button
                                    onClick={() => setViewPdf(null)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            {/* PDF viewer component would go here */}
                            <div className="p-4">PDF viewer integration needed</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthorRevisionDashboard;
