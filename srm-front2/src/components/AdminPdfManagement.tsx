import { useState, useEffect } from 'react';
import { FileText, Trash2, ExternalLink, Calendar, HardDrive, AlertCircle } from 'react-feather';
import api from '../config/api';
import Swal from 'sweetalert2';

interface CloudinaryPdf {
    publicId: string;
    fileName: string;
    size: number;
    uploadedAt: string;
    version: number;
    url: string;
}

const AdminPdfManagement = () => {
    const [pdfs, setPdfs] = useState<CloudinaryPdf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingPdf, setDeletingPdf] = useState<string | null>(null);

    useEffect(() => {
        fetchPdfs();
    }, []);

    const fetchPdfs = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/admin/pdfs');

            if (response.data.success) {
                setPdfs(response.data.pdfs);
            }
        } catch (error) {
            console.error('Error fetching PDFs:', error);
            Swal.fire({
                icon: 'info',
                title: 'Error',
                text: 'Failed to load PDFs from Cloudinary'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePdf = async (publicId: string, fileName: string) => {
        const result = await Swal.fire({
            title: 'Delete PDF?',
            html: `Are you sure you want to delete <strong>${fileName}</strong>?<br><br>This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                setDeletingPdf(publicId);

                const response = await api.delete('/api/admin/pdfs', {
                    data: { publicId }
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'PDF has been deleted successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Remove from local state
                    setPdfs(pdfs.filter(pdf => pdf.publicId !== publicId));
                }
            } catch (error) {
                console.error('Error deleting PDF:', error);
                Swal.fire({
                    icon: 'info',
                    title: 'Error',
                    text: (error as any).response?.data?.message || 'Failed to delete PDF'
                });
            } finally {
                setDeletingPdf(null);
            }
        }
    };

    const filteredPdfs = pdfs.filter(pdf =>
        pdf.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.publicId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date: string | number | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">PDF Management</h2>
                <p className="text-gray-600 mb-4">
                    Manage all PDFs stored in Cloudinary. You can view and delete PDFs as needed.
                </p>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by filename or public ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F5A051] focus:ring-4 focus:ring-[#F5A051]/10"
                    />
                    <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">
                        Total PDFs: <span className="text-[#F5A051]">{pdfs.length}</span>
                    </span>
                    {searchTerm && (
                        <span className="text-gray-600">
                            Filtered: <span className="font-semibold">{filteredPdfs.length}</span>
                        </span>
                    )}
                    <span className="text-gray-600">
                        Total Size: <span className="font-semibold">
                            {formatFileSize(pdfs.reduce((acc, pdf) => acc + pdf.size, 0))}
                        </span>
                    </span>
                </div>
            </div>

            {/* PDFs List */}
            {isLoading ? (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-10 md:p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDFs...</p>
                </div>
            ) : filteredPdfs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-10 md:p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                        {searchTerm ? 'No PDFs found matching your search' : 'No PDFs found in Cloudinary'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPdfs.map((pdf) => (
                        <div
                            key={pdf.publicId}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* PDF Info */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 break-words">
                                                {pdf.fileName}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-mono break-all mt-1">
                                                {pdf.publicId}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="w-4 h-4" />
                                            <span>{formatFileSize(pdf.size)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(pdf.uploadedAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Version:</span>
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                {pdf.version}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <a
                                        href={pdf.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm whitespace-nowrap"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View PDF
                                    </a>
                                    <button
                                        onClick={() => handleDeletePdf(pdf.publicId, pdf.fileName)}
                                        disabled={deletingPdf === pdf.publicId}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 text-sm whitespace-nowrap"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {deletingPdf === pdf.publicId ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Warning Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
                        <p className="text-sm text-yellow-700">
                            Deleting a PDF from Cloudinary is permanent and cannot be undone. Make sure you have backups before deleting any files.
                            This action will not remove references from the database - only the file from cloud storage.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPdfManagement;
