import React, { useState, useEffect } from 'react';
import { Trash2, Download, FileText, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../config/api';
import { toast } from 'react-toastify';

interface Pdf {
  publicId: string;
  fileName: string;
  url: string;
  size: number;
  uploadedAt: string;
  version: number;
}

const PDFManagement: React.FC = () => {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});


  // Fetch all PDFs from Cloudinary
  const fetchPdfs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/editor/pdfs');

      if (response.data.success) {
        setPdfs(response.data.pdfs || []);
      }
    } catch (err) {
      console.error('Error fetching PDFs:', err);
      setError('Failed to fetch PDFs from Cloudinary');
      toast.error('Error fetching PDFs');
    } finally {
      setLoading(false);
    }
  };

  // Delete PDF from Cloudinary
  const handleDeletePdf = async (publicId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [publicId]: true }));
    try {
      const response = await api.delete('/api/editor/pdfs', {
        data: { publicId }
      });

      if (response.data.success) {
        setPdfs(prev => prev.filter(pdf => pdf.publicId !== publicId));
        toast.success(`Deleted: ${fileName}`);
      }
    } catch (err) {
      console.error('Error deleting PDF:', err);
      toast.error('Failed to delete PDF');
    } finally {
      setDeleting(prev => ({ ...prev, [publicId]: false }));
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Load PDFs on mount
  useEffect(() => {
    fetchPdfs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading PDFs from Cloudinary...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">PDF Management</h2>
            <p className="text-sm text-gray-600">Manage all uploaded PDFs in Cloudinary</p>
          </div>
        </div>
        <button
          onClick={fetchPdfs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-blue-700">{pdfs.length}</div>
              <div className="text-sm text-gray-600">Total PDFs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">
                {formatFileSize(pdfs.reduce((sum, pdf) => sum + (pdf.size || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* PDFs List */}
      <div className="flex-1 overflow-y-auto">
        {pdfs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 sm:p-10 md:p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No PDFs found</p>
            <p className="text-gray-400 text-sm mt-2">PDFs will appear here after paper submissions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pdfs.map((pdf) => (
              <div key={pdf.publicId} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-800 truncate text-lg">
                        {pdf.fileName}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Size:</span> {formatFileSize(pdf.size)}
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span> {formatDate(pdf.uploadedAt)}
                      </div>
                      <div>
                        <span className="font-medium">Public ID:</span>
                        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                          {pdf.publicId}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Version:</span> {pdf.version}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Open PDF"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDeletePdf(pdf.publicId, pdf.fileName)}
                      disabled={deleting[pdf.publicId]}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Delete PDF"
                    >
                      {deleting[pdf.publicId] ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFManagement;
