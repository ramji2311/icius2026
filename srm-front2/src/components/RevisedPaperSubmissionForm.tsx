import { useState, useEffect, useRef } from "react";
import { FaTimes, FaUpload, FaCheckCircle, FaEdit } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from '../config/api';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Categories data
const categories = [
  {
    name: "Engineering and Technology",
    topics: [
      "Aeronautical", "AI", "Architecture", "Artificial Intelligence",
      "Aviation Technology", "Big Data", "Bioinformatics", "Biomedical Engineering",
      "Bionuclear Engineering", "Biotechnology", "Civil Engineering", "Computer Science",
      "Computing", "Control Automation", "Cybersecurity", "Design", "Electrical",
      "Electronics", "Energy", "Engineering", "Image Processing", "Industrial Engineering",
      "Information Technology", "IOT", "Manufacturing", "Marine Engineering", "Material Science"
    ]
  },
  {
    name: "Medical And Health Science",
    topics: ["Cardiology", "Dentistry", "Dermatology", "Healthcare", "Medicine", "Nursing", "Pharmacy"]
  },
  {
    name: "Business and Economics",
    topics: ["Accounting", "Banking", "Economics", "Finance", "Management", "Marketing"]
  },
  {
    name: "Education",
    topics: ["Curriculum", "E-Learning", "Educational Technology", "Pedagogy", "Teaching Methods"]
  },
  {
    name: "Social Sciences and Humanities",
    topics: ["Anthropology", "History", "Linguistics", "Philosophy", "Psychology", "Sociology"]
  },
  {
    name: "Sports Science",
    topics: ["Exercise Physiology", "Sports Medicine", "Sports Psychology", "Training"]
  },
  {
    name: "Physical and life sciences",
    topics: ["Biology", "Chemistry", "Physics", "Zoology"]
  },
  {
    name: "Agriculture",
    topics: ["Agricultural Engineering", "Agronomy", "Forestry", "Horticulture"]
  },
  {
    name: "Mathematics and statistics",
    topics: ["Algebra", "Calculus", "Data Analysis", "Probability", "Statistics"]
  },
  {
    name: "Law",
    topics: ["Constitutional Law", "Criminal Law", "International Law", "Legal Studies"]
  },
  {
    name: "Interdisciplinary",
    topics: ["Environmental Studies", "Gender Studies", "Sustainability"]
  }
];

interface PaperData {
  _id: string;
  submissionId: string;
  paperTitle: string;
  authorName: string;
  email: string;
  category: string;
  topic?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  paperTitle: string;
  authorName: string;
  email: string;
  category: string;
  topic?: string;
  revisionNotes: string;
}

const RevisedPaperSubmissionForm = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();

  // Loading and submission states
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Original paper data
  const [originalPaper, setOriginalPaper] = useState<PaperData | null>(null);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    paperTitle: "",
    authorName: "",
    email: "",
    category: "",
    topic: "",
    revisionNotes: ""
  });

  // File state
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionFileName, setRevisionFileName] = useState("Click to browse files");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch original paper data
  useEffect(() => {
    const fetchPaperData = async () => {
      try {

        
        // Fetch the paper data by submission ID
        const response = await api.get(`/api/papers/${submissionId}`);

        if (response.data.success && response.data.paper) {
          const paper = response.data.paper;
          setOriginalPaper(paper);

          // Pre-fill form with existing data
          setFormData({
            paperTitle: paper.paperTitle || "",
            authorName: paper.authorName || "",
            email: paper.email || "",
            category: paper.category || "",
            topic: paper.topic || "",
            revisionNotes: ""
          });
        } else {
          toast.error("Paper not found");
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Error fetching paper data:', error);
        toast.error(error.response?.data?.message || "Failed to load paper details");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchPaperData();
    }
  }, [submissionId, navigate]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file size (10MB for revised papers)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }

      setRevisionFile(file);
      setRevisionFileName(file.name);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setRevisionFile(null);
    setRevisionFileName("Click to browse files");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!revisionFile) {
      toast.error('Please upload a revised PDF file');
      return;
    }

    if (!formData.revisionNotes.trim()) {
      toast.error('Please provide revision notes explaining the changes made');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitFormData = new FormData();
      submitFormData.append('submissionId', submissionId || '');
      submitFormData.append('paperTitle', formData.paperTitle);
      submitFormData.append('authorName', formData.authorName);
      submitFormData.append('email', formData.email);
      submitFormData.append('category', formData.category);
      submitFormData.append('topic', formData.topic || '');
      submitFormData.append('revisionNotes', formData.revisionNotes);
      submitFormData.append('pdf', revisionFile);

      const response = await api.post(
        '/api/papers/submit-revision',
        submitFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Revised paper submitted successfully!');
        
        // Reset form
        setRevisionFile(null);
        setRevisionFileName("Click to browse files");
        setFormData({
          paperTitle: "",
          authorName: "",
          email: "",
          category: "",
          topic: "",
          revisionNotes: ""
        });

        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(response.data.message || "Submission failed");
      }
    } catch (error: any) {
      console.error('Error submitting revision:', error);
      const errorMessage = error.response?.data?.message || "Error submitting revised paper";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if data has changed
  const hasDataChanged = () => {
    if (!originalPaper) return false;
    return (
      formData.paperTitle !== originalPaper.paperTitle ||
      formData.authorName !== originalPaper.authorName ||
      formData.category !== originalPaper.category ||
      formData.topic !== (originalPaper.topic || "")
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5A051]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[#F5A051] hover:text-[#e08c3e] mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Submit Revised Paper</h1>
          <p className="text-gray-600 mt-2">Update your paper details and submit the revised version</p>
        </div>

        {/* Original Submission Summary Card */}
        {originalPaper && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-blue-600" /> Your Paper Submission
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Submission ID */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <label className="text-xs font-semibold text-blue-700 block mb-1">Submission ID</label>
                <p className="text-sm font-mono font-bold text-gray-800">{originalPaper.submissionId}</p>
              </div>

              {/* Paper Title */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <label className="text-xs font-semibold text-blue-700 block mb-1">Paper Title</label>
                <p className="text-sm font-medium text-gray-800 truncate" title={originalPaper.paperTitle}>
                  {originalPaper.paperTitle}
                </p>
              </div>

              {/* Author Name */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <label className="text-xs font-semibold text-blue-700 block mb-1">Author Name</label>
                <p className="text-sm font-medium text-gray-800">{originalPaper.authorName}</p>
              </div>

              {/* Category */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <label className="text-xs font-semibold text-blue-700 block mb-1">Category</label>
                <p className="text-sm font-medium text-gray-800 truncate">{originalPaper.category}</p>
              </div>

              {/* Status */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <label className="text-xs font-semibold text-blue-700 block mb-1">Status</label>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  originalPaper.status === 'Revision Required' 
                    ? 'bg-orange-100 text-orange-800'
                    : originalPaper.status === 'Accepted'
                    ? 'bg-green-100 text-green-800'
                    : originalPaper.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {originalPaper.status}
                </span>
              </div>

              {/* Submission Date */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <label className="text-xs font-semibold text-blue-700 block mb-1">Submission Date</label>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(originalPaper.createdAt || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#F5A051] text-white p-6">
            <div className="flex items-center gap-3">
              <FaEdit className="text-2xl" />
              <div>
                <h2 className="text-xl font-bold">Revision Submission</h2>
                {originalPaper && (
                  <p className="text-orange-100">Submission ID: {originalPaper.submissionId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Original Paper Info Alert */}
              {originalPaper && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <FaCheckCircle className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Original Paper Information</h3>
                      <p className="text-sm text-blue-800">
                        You can edit all fields below to reflect any changes to your paper details. Update the PDF file with your revised paper.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Paper Details Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#F5A051] text-white rounded-full flex items-center justify-center text-sm">1</span>
                  Paper Details
                </h3>

                {/* Paper Title */}
                <div>
                  <label htmlFor="paperTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Title *
                  </label>
                  <input
                    type="text"
                    id="paperTitle"
                    name="paperTitle"
                    required
                    value={formData.paperTitle}
                    onChange={handleChange}
                    placeholder="Enter paper title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                  />
                  {originalPaper && formData.paperTitle !== originalPaper.paperTitle && (
                    <p className="text-xs text-orange-600 mt-1">
                      Original: {originalPaper.paperTitle}
                    </p>
                  )}
                </div>

                {/* Author Name */}
                <div>
                  <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-2">
                    Author Name *
                  </label>
                  <input
                    type="text"
                    id="authorName"
                    name="authorName"
                    required
                    value={formData.authorName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                  />
                  {originalPaper && formData.authorName !== originalPaper.authorName && (
                    <p className="text-xs text-orange-600 mt-1">
                      Original: {originalPaper.authorName}
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    readOnly
                    value={formData.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email is read-only and linked to your account</p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                  >
                    <option value="">- Select Category -</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {originalPaper && formData.category !== originalPaper.category && (
                    <p className="text-xs text-orange-600 mt-1">
                      Original: {originalPaper.category}
                    </p>
                  )}
                </div>

                {/* Topic */}
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    id="topic"
                    name="topic"
                    value={formData.topic || ""}
                    onChange={handleChange}
                    placeholder="Specific topic or research area"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Revision Details Section */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#F5A051] text-white rounded-full flex items-center justify-center text-sm">2</span>
                  Revised Paper
                </h3>

                {/* Revision Notes */}
                <div>
                  <label htmlFor="revisionNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Revision Notes * <span className="text-gray-500 text-xs">(Explain the changes you made)</span>
                  </label>
                  <textarea
                    id="revisionNotes"
                    name="revisionNotes"
                    required
                    value={formData.revisionNotes}
                    onChange={handleChange}
                    placeholder="Describe the changes and improvements you made to address the reviewer comments..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-transparent resize-vertical"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.revisionNotes.length} characters
                  </p>
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Revised PDF * <span className="text-gray-500 text-xs">(Max 10MB)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-blue-50 hover:border-blue-400 transition cursor-pointer relative">
                    <input
                      type="file"
                      id="revisionFile"
                      accept=".pdf"
                      required
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <label htmlFor="revisionFile" className="cursor-pointer flex flex-col items-center">
                      <FaUpload className="text-[#F5A051] text-4xl mb-3" />
                      <span className="text-gray-700 font-medium">{revisionFileName}</span>
                      <span className="text-xs text-gray-500 mt-2">Click to browse or drag and drop</span>
                    </label>
                  </div>

                  {revisionFile && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{revisionFile.name}</p>
                          <p className="text-xs text-green-700">
                            {(revisionFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FaTimes size={20} />
                      </button>
                    </div>
                  )}

                  {originalPaper?.pdfFileName && (
                    <p className="text-xs text-gray-500 mt-2">
                      Original file: {originalPaper.pdfFileName}
                    </p>
                  )}
                </div>
              </div>

              {/* Summary of Changes */}
              {hasDataChanged() && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note:</span> You've made changes to the paper details above. These changes will be saved along with your revision.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 border-t pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 bg-[#F5A051] text-white rounded-lg hover:bg-[#e08c3e] transition font-medium flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaUpload /> Submit Revision
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default RevisedPaperSubmissionForm;
