import { useState, useEffect } from "react";
import { FaTimes, FaUpload } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import api from '../config/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add the categories data
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

interface SubmitPaperFormProps {
  isOpen: boolean;
  onClose: () => void;
  embedded: boolean;
  onSubmissionSuccess: () => void;
  isRevision?: boolean;
  revisionData?: any;
  hasExistingSubmission?: boolean;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  submissionId?: string;
  paperDetails?: {
    title: string;
    category: string;
    status: string;
  };
}

const SubmitPaperForm: React.FC<SubmitPaperFormProps> = ({ isOpen, onClose, embedded = false, onSubmissionSuccess, isRevision = false, revisionData = null, hasExistingSubmission = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isStandalone, setIsStandalone] = useState(false);
  // Add loading state for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if this is being used as a standalone page
  useEffect(() => {
    setIsStandalone(location.pathname === '/submit-paper');
  }, [location]);

  const [formData, setFormData] = useState({
    paperTitle: "",
    authorName: "",
    email: "",
    category: "",
    abstract: "",
    institution: ""
  });

  // Extract and pre-fill email from backend using cookie-based auth
  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.data?.success && response.data?.user?.email) {
          setFormData(prev => ({
            ...prev,
            email: response.data.user.email
          }));
        }
      } catch (error) {
        console.error('Error fetching user email for submission form:', error);
      }
    };

    loadUserEmail();
  }, []);

  // File state handlers
  const [abstractFile, setAbstractFile] = useState<File | null>(null);

  // File name display state
  const [abstractFileName, setAbstractFileName] = useState("Click to browse files");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Set loading state to true when submission starts
    setIsSubmitting(true);

    // For revision, require PDF file and other details
    if (isRevision && revisionData) {
      // Validate that a PDF file was uploaded
      if (!abstractFile) {
        toast.error('Please upload the revised PDF file');
        setIsSubmitting(false);
        return;
      }

      // Get the submissionId from revisionData
      const submissionId = revisionData.submissionId;
      if (!submissionId) {
        toast.error('Error: Submission ID not found. Please refresh and try again.');
        setIsSubmitting(false);
        return;
      }

      try {
        console.log('📤 Sending revision with submissionId:', submissionId);
        console.log('📤 File:', abstractFile?.name);

        // Create FormData for file upload
        const revisionFormData = new FormData();
        revisionFormData.append('submissionId', submissionId);
        revisionFormData.append('paperTitle', formData.paperTitle);
        revisionFormData.append('authorName', formData.authorName);
        revisionFormData.append('email', formData.email);
        revisionFormData.append('category', formData.category);
        revisionFormData.append('abstract', formData.abstract);
        revisionFormData.append('topic', '');
        revisionFormData.append('revisionNotes', formData.paperTitle || 'Revision submitted'); // Using paperTitle as notes
        revisionFormData.append('pdf', abstractFile);

        const response = await api.post<SubmissionResponse>(
          '/api/papers/submit-revision',
          revisionFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          toast.success('Revised paper submitted successfully!');

          console.log(' Revision submitted:', response.data);

          // Reset form
          setFormData({
            paperTitle: "",
            authorName: "",
            email: "",
            category: "",
            abstract: "",
            institution: ""
          });
          setAbstractFile(null);
          setAbstractFileName("Click to browse files");

          // Call success callback or refresh page
          if (onSubmissionSuccess) {
            onSubmissionSuccess();
          } else {
            // For revision, just refresh the page
            window.location.reload();
          }
        } else {
          toast.error(response.data.message || "Revision submission failed");
        }

      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.message || "Error submitting revised paper";
          toast.error(errorMessage);
          console.error('❌ Submission error:', error.response?.data);
        } else {
          toast.error("An unexpected error occurred");
          console.error('❌ Submission error:', error);
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Create FormData object for regular file upload
    const submissionFormData = new FormData();

    // For regular submission, append all required fields
    submissionFormData.append('paperTitle', formData.paperTitle);
    submissionFormData.append('authorName', formData.authorName);
    submissionFormData.append('email', formData.email);
    submissionFormData.append('category', formData.category);
    submissionFormData.append('abstract', formData.abstract);
    submissionFormData.append('institution', formData.institution);

    // Append PDF file
    if (abstractFile) {
      submissionFormData.append('pdf', abstractFile);
    }

    try {
      // Use different endpoint if user already has a submission
      const endpoint = hasExistingSubmission ? '/api/papers/submit-multiple' : '/api/papers/submit';

      const response = await api.post<SubmissionResponse>(
        endpoint,
        submissionFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const successMessage = hasExistingSubmission
          ? `Additional paper submitted successfully! Submission ID: ${response.data.submissionId}`
          : `Paper submitted successfully! Submission ID: ${response.data.submissionId}`;

        toast.success(successMessage);

        // Store submission ID in localStorage for future reference
        if (response.data.submissionId) {
          localStorage.setItem('lastSubmissionId', response.data.submissionId);
        }


        setFormData({
          paperTitle: "",
          authorName: "",
          email: "",
          category: "",
          abstract: "",
          institution: ""
        });
        setAbstractFile(null);
        setAbstractFileName("Click to browse files");

        if (onSubmissionSuccess) {
          onSubmissionSuccess();
        } else {
          navigate('/submission-success', {
            state: {
              submissionId: response.data.submissionId,
              paperDetails: response.data.paperDetails
            }
          });
        }
      } else {
        toast.error(response.data.message || "Submission failed");
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Error submitting paper";
        toast.error(errorMessage);
        console.error('Submission error:', error.response?.data);
      } else {
        toast.error("An unexpected error occurred");
        console.error('Submission error:', error);
      }
    } finally {
      // Set loading state to false when submission completes
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'abstract' | 'photo') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file size
      if (file.size > 3 * 1024 * 1024) {
        toast.error('File size must be less than 3MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }

      if (fileType === 'abstract') {
        setAbstractFile(file);
        setAbstractFileName(file.name);
      }
    }
  };

  // Handle the back button
  const handleBack = () => {
    if (isStandalone) {
      navigate('/call-for-papers');
    } else if (onClose) {
      onClose();
    } else {
      navigate(-1); // fallback to browser history
    }
  };

  // Don't render if not open and not standalone and not embedded
  if (!isOpen && !isStandalone && !embedded) return null;

  // Category Selector Component - Integrated into the form
  const CategorySelectorSection = () => {
    return (
      <div className="form-group">
        <label htmlFor="category" className="block mb-2 font-medium text-gray-700">
          Category *
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="">- Select Category -</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>
    );
  };

  // If embedded mode, just render the form content without modal/container
  if (embedded) {
    return (
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="mb-4 text-gray-600">Fields marked with an * are required</p>

          {/* Paper Title */}
          <div className="form-group">
            <label htmlFor="paperTitle" className="block mb-2 font-medium text-gray-700">
              Paper Title *
            </label>
            <input
              type="text"
              id="paperTitle"
              name="paperTitle"
              required
              placeholder="Enter paper title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
              value={formData.paperTitle}
              onChange={handleChange}
            />
          </div>

          {/* Author Name */}
          <div className="form-group">
            <label htmlFor="authorName" className="block mb-2 font-medium text-gray-700">
              Author Name *
            </label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              required
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
              value={formData.authorName}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
              Email * {formData.email && <span className="text-xs text-gray-500">(Read-only - from your account)</span>}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Enter your email"
              readOnly={!!formData.email}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] ${formData.email ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Category */}
          <CategorySelectorSection />

          {/* Institution */}
          <div className="form-group">
            <label htmlFor="institution" className="block mb-2 font-medium text-gray-700">
              College / Institution *
            </label>
            <input
              type="text"
              id="institution"
              name="institution"
              required
              placeholder="Enter your college/institution name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
              value={formData.institution}
              onChange={handleChange}
            />
          </div>

          {/* Abstract */}
          <div className="form-group">
            <label htmlFor="abstract" className="block mb-2 font-medium text-gray-700">
              Abstract *
            </label>
            <textarea
              id="abstract"
              name="abstract"
              required
              placeholder="Enter a brief abstract of your paper (200-500 words recommended)"
              maxLength={2000}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] resize-none"
              value={formData.abstract}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.abstract.length}/2000 characters</p>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="block mb-2 font-medium text-gray-700">
              Upload PDF *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50">
              <input
                type="file"
                id="abstractFile"
                accept=".pdf"
                required
                className="hidden"
                onChange={(e) => handleFileChange(e, 'abstract')}
              />
              <label htmlFor="abstractFile" className="cursor-pointer flex flex-col items-center">
                <FaUpload className="text-[#F5A051] text-3xl mb-2" />
                <span className="text-gray-500">{abstractFileName}</span>
                <span className="text-xs text-gray-400 mt-1">(Max 3MB)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-group">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#F5A051] text-white py-3 px-4 rounded-md hover:bg-[#e08c3e] transition-colors duration-300 font-medium ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                "Submit Paper"
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Standard modal/standalone render
  return (
    <div className={`${isStandalone ? 'min-h-screen bg-gray-100 pt-8 pb-16' : 'fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto'}`}>
      <div className={`container mx-auto px-4 ${!isStandalone && 'py-8'}`}>
        <div className={`bg-white rounded-lg shadow-xl ${isStandalone ? 'max-w-3xl w-full mx-auto px-3 sm:px-0' : 'max-w-3xl w-full mx-auto max-h-[90vh] overflow-y-auto px-3 sm:px-0'}`}>
          <div className="bg-[#F5A051] text-white p-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-bold">Submit Abstract</h2>
            <button
              onClick={handleBack}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="p-6">
            <p className="mb-4 text-gray-600">Fields marked with an * are required</p>

            {/* Form content - Using the same form elements as in embedded mode */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Paper Title */}
              <div className="form-group">
                <label htmlFor="paperTitle" className="block mb-2 font-medium text-gray-700">
                  Title of the Paper / Abstract *
                </label>
                <input
                  type="text"
                  id="paperTitle"
                  name="paperTitle"
                  required
                  placeholder="Enter paper title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  value={formData.paperTitle}
                  onChange={handleChange}
                />
              </div>

              {/* Author Name */}
              <div className="form-group">
                <label htmlFor="authorName" className="block mb-2 font-medium text-gray-700">
                  Author Name *
                </label>
                <input
                  type="text"
                  id="authorName"
                  name="authorName"
                  required
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  value={formData.authorName}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
                  Email * {formData.email && <span className="text-xs text-gray-500">(Read-only - from your account)</span>}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                  readOnly={!!formData.email}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] ${formData.email ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* ENHANCED CATEGORY SELECTOR in modal/standalone version */}
              <CategorySelectorSection />

              {/* Institution */}
              <div className="form-group">
                <label htmlFor="institution" className="block mb-2 font-medium text-gray-700">
                  College / Institution *
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  required
                  placeholder="Enter your college/institution name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                  value={formData.institution}
                  onChange={handleChange}
                />
              </div>

              {/* File Upload */}
              <div className="form-group">
                <label className="block mb-2 font-medium text-gray-700">
                  Upload PDF *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50">
                  <input
                    type="file"
                    id="abstractFile"
                    accept=".pdf"
                    required
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'abstract')}
                  />
                  <label htmlFor="abstractFile" className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-[#F5A051] text-3xl mb-2" />
                    <span className="text-gray-500">{abstractFileName}</span>
                    <span className="text-xs text-gray-400 mt-1">(Max 3MB)</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-group">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#F5A051] text-white py-3 px-4 rounded-md hover:bg-[#e08c3e] transition-colors duration-300 font-medium ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Abstract"
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

export default SubmitPaperForm;
