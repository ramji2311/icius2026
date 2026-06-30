import React, { useState } from 'react';
import api from '../config/api';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface ReuploadPaperModalProps {
    submissionId: string;
    onSuccess: () => void;
    onClose: () => void;
    embedded?: boolean;
}

const ReuploadPaperModal: React.FC<ReuploadPaperModalProps> = ({ submissionId, onSuccess, onClose, embedded = false }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                setError('Only PDF files are allowed');
                setFile(null);
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size exceeds 10MB limit');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('pdf', file);

            const response = await api.post(`/api/papers/reupload/${submissionId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: response.data.message || 'Paper reuploaded successfully',
                    confirmButtonColor: '#3B82F6'
                });
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Error reuploading paper:', err);
            setError(err.response?.data?.message || 'Failed to reupload paper');
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className={`${embedded ? '' : 'bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden'}`}>
            {!embedded && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Re-upload Paper Manuscript
                    </h3>
                    <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className={`${embedded ? 'p-0' : 'p-6'} space-y-6`}>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700">
                    <p className="font-medium mb-1">Upload New Version</p>
                    <p>Use this to upload a corrected or updated version of your paper. The previous version will be kept in history as v1, v2, etc.</p>
                </div>

                <div className="space-y-4">
                    <label className="block">
                        <span className="text-gray-700 font-medium mb-2 block">Select PDF File (Max 10MB)</span>
                        <div className={`mt-1 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                id="reupload-input"
                                accept=".pdf"
                            />
                            <label htmlFor="reupload-input" className="cursor-pointer flex flex-col items-center">
                                {file ? (
                                    <>
                                        <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                        <span className="text-xs text-gray-500 mt-1">Click to change file</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                        <span className="text-sm font-medium text-gray-600">Click to browse or drag and drop</span>
                                        <span className="text-xs text-gray-400 mt-1">Only PDF format accepted</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </label>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !file}
                        className={`flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 ${(loading || !file) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload v{(loading) ? '...' : 'Next'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            {content}
        </div>
    );
};

export default ReuploadPaperModal;
