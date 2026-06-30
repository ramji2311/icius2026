import { useState } from 'react';
import api from '../config/api';
import { FaFilePdf, FaUpload, FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface RevisionFormProps {
  paperId: string; // Add paperId for precise targeting
  submissionId: string;
  authorEmail: string;
  paperTitle: string;
  authorName: string;
  revisionData: any;
  onSubmissionSuccess: () => void;
  onClose: () => void;
}

const RevisionForm = ({
  paperId,
  submissionId,
  authorEmail,
  paperTitle,
  authorName,
  revisionData,
  onSubmissionSuccess,
  onClose
}: RevisionFormProps) => {
  const [cleanPdf, setCleanPdf] = useState<File | null>(null);
  const [highlightedPdf, setHighlightedPdf] = useState<File | null>(null);
  const [responsePdf, setResponsePdf] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');



  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, pdfType: 'clean' | 'highlighted' | 'response') => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (pdfType === 'clean') {
        setCleanPdf(file);
      } else if (pdfType === 'highlighted') {
        setHighlightedPdf(file);
      } else if (pdfType === 'response') {
        setResponsePdf(file);
      }
      setError('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all files are selected
    if (!cleanPdf || !highlightedPdf || !responsePdf) {
      setError('Please upload all three PDF files (Clean, Highlighted, and Response)');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('paperId', paperId);
      formData.append('submissionId', submissionId);
      formData.append('authorEmail', authorEmail);

      // Append all three PDFs with proper field names for multer
      formData.append('cleanPdf', cleanPdf);
      formData.append('highlightedPdf', highlightedPdf);
      formData.append('responsePdf', responsePdf);

      const response = await api.post(
        '/api/papers/submit-revision',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setUploadSuccess(true);
        setTimeout(() => {
          onSubmissionSuccess();
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to submit revision');
      }
    } catch (err: any) {
      console.error('Error submitting revision:', err);
      setError(err.response?.data?.message || 'Error uploading revision files');
    } finally {
      setUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center">
        <FaCheckCircle className="text-green-600 text-4xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-800 mb-2">✓ Revision Submitted Successfully!</h3>
        <p className="text-green-700">
          Your revised paper with all three PDFs has been submitted. The editor will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border-2 border-gray-300 rounded-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Revised Paper</h3>

      {/* Auto-filled Paper Details */}
      <div className="bg-gray-50 p-4 rounded-md mb-6 border-l-4 border-blue-500">
        <h4 className="font-bold text-gray-700 mb-3">Paper Details (Auto-filled)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="font-semibold text-gray-600">Submission ID:</label>
            <p className="text-gray-800 bg-white p-2 rounded border border-gray-300 mt-1">{submissionId}</p>
          </div>
          <div>
            <label className="font-semibold text-gray-600">Author Name:</label>
            <p className="text-gray-800 bg-white p-2 rounded border border-gray-300 mt-1">{authorName}</p>
          </div>
          <div className="md:col-span-2">
            <label className="font-semibold text-gray-600">Paper Title:</label>
            <p className="text-gray-800 bg-white p-2 rounded border border-gray-300 mt-1">{paperTitle}</p>
          </div>
          <div className="md:col-span-2">
            <label className="font-semibold text-gray-600">Revision Deadline:</label>
            <p className="text-gray-800 bg-white p-2 rounded border border-gray-300 mt-1">
              {new Date(revisionData.revisionDeadline).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* PDF Upload Instructions */}
      <div className="bg-blue-50 p-4 rounded-md mb-6 border-l-4 border-blue-500">
        <h4 className="font-bold text-blue-900 mb-2">Required PDF Files:</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ <strong>Clean PDF:</strong> Your final corrected paper (not visible to reviewers)</li>
          <li>✓ <strong>Highlighted PDF:</strong> Shows all corrections made (visible to reviewers)</li>
          <li>✓ <strong>Response Document:</strong> Explains what corrections were made</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* File Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clean PDF Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <FaFilePdf className="inline mr-2 text-red-600" />
            Clean PDF (Final Corrected Paper) *
          </label>
          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, 'clean')}
              className="hidden"
              id="cleanPdf"
              disabled={uploading}
            />
            <label
              htmlFor="cleanPdf"
              className={`flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${cleanPdf
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
            >
              <div className="text-center">
                <FaUpload className={`text-2xl mx-auto mb-2 ${cleanPdf ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-700">
                  {cleanPdf ? cleanPdf.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PDF only</p>
              </div>
            </label>
          </div>
        </div>

        {/* Highlighted PDF Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <FaFilePdf className="inline mr-2 text-orange-600" />
            Highlighted PDF (Shows Corrections) *
          </label>
          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, 'highlighted')}
              className="hidden"
              id="highlightedPdf"
              disabled={uploading}
            />
            <label
              htmlFor="highlightedPdf"
              className={`flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${highlightedPdf
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
            >
              <div className="text-center">
                <FaUpload className={`text-2xl mx-auto mb-2 ${highlightedPdf ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-700">
                  {highlightedPdf ? highlightedPdf.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PDF only</p>
              </div>
            </label>
          </div>
        </div>

        {/* Response PDF Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <FaFilePdf className="inline mr-2 text-blue-600" />
            Response Document (Explains Corrections) *
          </label>
          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, 'response')}
              className="hidden"
              id="responsePdf"
              disabled={uploading}
            />
            <label
              htmlFor="responsePdf"
              className={`flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${responsePdf
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
            >
              <div className="text-center">
                <FaUpload className={`text-2xl mx-auto mb-2 ${responsePdf ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-700">
                  {responsePdf ? responsePdf.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PDF only</p>
              </div>
            </label>
          </div>
        </div>

        {/* Progress Indicator */}
        {cleanPdf || highlightedPdf || responsePdf ? (
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm font-semibold text-blue-900 mb-2">Files Selected:</p>
            <div className="space-y-1 text-sm text-blue-800">
              {cleanPdf && <p>✓ Clean PDF: {cleanPdf.name}</p>}
              {highlightedPdf && <p>✓ Highlighted PDF: {highlightedPdf.name}</p>}
              {responsePdf && <p>✓ Response PDF: {responsePdf.name}</p>}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {cleanPdf && highlightedPdf && responsePdf
                ? '✓ All files ready for upload'
                : `${3 - [cleanPdf, highlightedPdf, responsePdf].filter(Boolean).length} file(s) remaining`}
            </p>
          </div>
        ) : null}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={uploading || !cleanPdf || !highlightedPdf || !responsePdf}
            className={`flex-1 px-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${uploading || !cleanPdf || !highlightedPdf || !responsePdf
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Submit Revision
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-3 rounded-lg font-bold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          All files will be securely uploaded to Cloudinary. Maximum file size: 50MB each.
        </p>
      </form>
    </div>
  );
};

export default RevisionForm;
