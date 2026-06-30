import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import Swal from 'sweetalert2';
import { 
  FiFileText, 
  FiUpload, 
  FiX, 
  FiCheckCircle, 
  FiAlertCircle,
  FiSave,
  FiArrowLeft
} from 'react-icons/fi';
import PageTransition from './PageTransition';

interface SubmissionData {
  submissionId: string;
  bookingId: string;
  paperTitle: string;
  authorName: string;
  category: string;
  topic: string;
  abstractFileUrl: string;
  status: string;
}

const categories = [
  'Engineering and Technology',
  'Medical and Health Sciences',
  'Business and Economics',
  'Social Sciences and Humanities',
  'Natural Sciences',
  'Computer Science and IT'
];

const EditSubmission: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Form state - adding authorName to match backend API
  const [paperTitle, setPaperTitle] = useState('');
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [authorName, setAuthorName] = useState(''); // Added to match backend API
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const formatFileName = (fileName: string) => {
    // Check if the filename is a base64 string and truncate it
    if (fileName && (fileName.includes('==') || fileName.length > 50)) {
      return "Original file" + (fileName.endsWith('.pdf') ? '.pdf' : fileName.endsWith('.docx') ? '.docx' : fileName.endsWith('.doc') ? '.doc' : '');
    }
    return fileName;
  };

  useEffect(() => {
    console.log("EditSubmission component mounted with ID:", submissionId);
    
    // Fetch the submission details
    const fetchSubmission = async () => {
      try {
        console.log("Fetching submission data...");
        const response = await api.get('/user-submission');
        
        if (response.data.hasSubmission && response.data.submission.submissionId === submissionId) {
          console.log("Found matching submission:", response.data.submission);
          const submissionData = response.data.submission;
          setSubmission(submissionData);
          
          // Initialize form state with all fields from the backend
          setPaperTitle(submissionData.paperTitle);
          setCategory(submissionData.category);
          setTopic(submissionData.topic || '');
          setAuthorName(submissionData.authorName); // Initialize author name
          
          // Extract just the filename from the path and format it properly
          if (submissionData.abstractFileUrl) {
            const rawFileName = submissionData.abstractFileUrl.split('/').pop() || '';
            setCurrentFileName(formatFileName(rawFileName));
          }
        } else {
          console.error("Submission not found or mismatch:", {
            hasSubmission: response.data.hasSubmission,
            requestedId: submissionId,
            returnedId: response.data.submission?.submissionId
          });
          setErrorMsg('Submission not found or you do not have permission to edit it.');
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
        setErrorMsg('Failed to load submission data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [submissionId, navigate]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'info',
          title: 'Invalid File Type',
          text: 'Please upload a PDF or Word document (.doc, .docx)',
        });
        return;
      }
      
      // Check file size (3MB limit)
      if (file.size > 3 * 1024 * 1024) {
        Swal.fire({
          icon: 'info',
          title: 'File Too Large',
          text: 'File size should not exceed 3MB',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submission) return;
    
    if (!paperTitle.trim()) {
      Swal.fire({
        icon: 'info',
        title: 'Missing Title',
        text: 'Please enter a paper title',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Include all fields required by backend API
      formData.append('paperTitle', paperTitle);
      formData.append('category', category);
      formData.append('authorName', authorName); // Add author name to match backend API
      
      if (topic) {
        formData.append('topic', topic);
      }
      
      if (selectedFile) {
        formData.append('abstract', selectedFile);
      }
      
      console.log("Submitting update with data:", {
        paperTitle,
        category,
        topic,
        authorName,
        hasFile: !!selectedFile
      });
      
      const response = await api.put(
        `/edit-submission/${submissionId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      
      if (response.data.success) {
        console.log("Update successful:", response.data);
        Swal.fire({
          icon: 'success',
          title: 'Changes Saved',
          text: 'Your submission has been updated successfully',
        }).then(() => {
          // Use navigate with state to trigger loading
          navigate('/dashboard', { replace: true });
        });
      } else {
        throw new Error(response.data.message || 'Failed to update submission');
      }
    } catch (error: any) {
      console.error('Error updating submission:', error);
      Swal.fire({
        icon: 'info',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update submission. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5A051]"></div>
        </div>
      </PageTransition>
    );
  }
  
  if (errorMsg || !submission) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow">
            <div className="flex items-center text-red-500 mb-6">
              <FiAlertCircle className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-bold">Error</h2>
            </div>
            <p className="text-gray-700">{errorMsg || 'Submission not found'}</p>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="mt-6 bg-[#F5A051] text-white px-4 py-2 rounded hover:bg-[#e08c3e]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-6 px-3 sm:py-8 sm:px-4 max-w-[100vw] min-w-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard', { replace: true })}
              className="mr-4 text-gray-600 hover:text-gray-800 flex items-center"
            >
              <FiArrowLeft className="mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Submission</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
            <div className="mb-6 bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Submission ID:</span> {submission.submissionId}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">Booking ID:</span> {submission.bookingId}
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  placeholder="Enter your paper title"
                  required
                />
              </div>
              
              {/* Add Author Name field to match backend API */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  placeholder="Enter author name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic (Optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  placeholder="Specific topic or research area"
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abstract/Paper File
                </label>
                
                {currentFileName && !selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                      <FiFileText className="text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        Current file: {currentFileName}
                      </span>
                    </div>
                  </div>
                )}
                
                {selectedFile && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                      <FiCheckCircle className="text-green-500 mr-2" />
                      <span className="text-sm text-green-700">New file selected: {selectedFile.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={clearSelectedFile}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                <div className="mt-2">
                  <label 
                    htmlFor="file-upload"
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <FiUpload className="mr-2" />
                    {selectedFile ? 'Replace File' : 'Upload New File'}
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Accepted formats: PDF, DOC, DOCX. Maximum size: 3MB.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:space-x-4 sm:gap-0">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F5A051] ${
                    submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#e08c3e]'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default EditSubmission;