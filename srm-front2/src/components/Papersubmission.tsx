import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../config/api';
import Swal from "sweetalert2";
import {

  FaFilePdf,

  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,

  FaEnvelope,


  FaQuoteRight,
  FaPaperPlane,
  FaEdit,
  FaEye
} from "react-icons/fa";
import SubmitPaperForm from "./SubmitPaperForm";
import RevisionForm from "./RevisionForm";
import PageTransition from "./PageTransition";
import ReuploadPaperModal from './ReuploadPaperModal';
import PaperHistoryTimeline from './PaperHistoryTimeline';
import { FaUpload, FaHistory } from "react-icons/fa";
import { useSocket } from "../context/SocketContext";

interface Submission {
  _id: string;
  submissionId: string;
  bookingId: string;
  paperTitle: string;
  authorName: string;
  email: string;
  category: string;
  topic: string;
  abstractFileUrl: string | null;
  status: string;
  submissionDate: string;
  isPaid?: boolean;
}

const PaperSubmission = () => {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [allRevisions, setAllRevisions] = useState<any[]>([]);
  const [hasRevision, setHasRevision] = useState(false);
  const [showRevisionUpload, setShowRevisionUpload] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);
  const [showSubmitAnother, setShowSubmitAnother] = useState(false);
  const navigate = useNavigate();

  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('paper:status_changed', (data: any) => {
        console.log('📜 Paper Status Changed Event:', data);
        checkUserSubmission();
      });

      return () => {
        socket.off('paper:status_changed');
      };
    }
  }, [socket]);

  const checkUserSubmission = async () => {
    try {
      // Check for existing submission
      const response = await api.get('/user-submission');

      if (response.data.hasSubmission) {
        setHasExistingSubmission(true);
        setExistingSubmission(response.data.submission);
        setAllSubmissions(response.data.submissions || [response.data.submission]);
      }

      // Check for revision status
      const revisionResponse = await api.get('/revision-status');

      if (revisionResponse.data.hasRevision) {
        setHasRevision(true);
        setAllRevisions(revisionResponse.data.revisions || []);
      }
    } catch (error) {
      console.error("Error fetching user submission:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check for authentication and existing submission when component mounts
  useEffect(() => {
    checkUserSubmission();
  }, []);


  // Handler for submission success
  const handleSubmissionSuccess = () => {
    setSubmitSuccess(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get current paper revision if any - use _id for exact match to handle multiple papers
  const currentPaperRevision = allRevisions.find(
    (rev: any) => rev.paperId === existingSubmission?._id
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Header Banner with decorative elements */}
        <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-12 sm:py-16 md:py-24 overflow-hidden">
          {/* Decorative elements - Hide some on mobile */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 border-4 border-white rounded-full hidden sm:block"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 md:w-40 md:h-40 border-4 border-white rounded-full hidden sm:block"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 border-4 border-white transform -translate-y-1/2 hidden md:block"></div>
          </div>

          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="inline-block mb-4 sm:mb-6">
              <div className="w-12 md:w-16 h-1 bg-[#F5A051] mx-auto mb-2"></div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Paper Submission</h1>
              <div className="w-12 md:w-16 h-1 bg-[#F5A051] mx-auto mt-2"></div>
            </div>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto font-light px-2">
              International Conference on Intelligent Unmanned Systems
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 relative">
          {/* Decorative side elements */}
          <div className="hidden lg:block absolute top-20 left-0 w-32 border-t border-gray-200"></div>
          <div className="hidden lg:block absolute top-20 right-0 w-32 border-t border-gray-200"></div>

          <div className="max-w-4xl mx-auto">
            {/* Success message displayed if submission successful */}
            {submitSuccess && (
              <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:shadow-xl border-t-4 border-green-500 mb-8 sm:mb-12 md:mb-16">
                <div className="text-center py-6 sm:py-8 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                    <FaCheckCircle className="text-green-500 text-3xl sm:text-4xl" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Submission Successful!</h3>
                  <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-10 max-w-lg mx-auto">
                    Thank you for your submission. We have received your paper and will review it shortly.
                    You will receive a confirmation email with further details.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-[#F5A051] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md hover:bg-[#e08c3e] transition-all duration-300 hover:shadow-lg text-base sm:text-lg font-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5A051]"></div>
              </div>
            )}

            {/* Introduction Section */}
            {!loading && !submitSuccess && (
              <section className="mb-8 sm:mb-12 md:mb-16 bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:shadow-xl border-t-4 border-[#F5A051] transform transition-all hover:shadow-2xl">
                <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="bg-[#F5A051] w-10 h-10 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
                    <FaQuoteRight className="text-white text-lg" />
                  </div>
                  <span className="mt-1">Submit Your Research</span>
                </h2>

                <p className="text-gray-700 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
                  We invite scholars, researchers, and professionals to contribute to the multidisciplinary discourse
                  by submitting their insightful papers and abstracts. Join us in building a platform that celebrates
                  diverse perspectives and fosters collaboration across a spectrum of research domains.
                </p>

                <div className="mt-6 sm:mt-8 bg-gray-50 p-4 sm:p-6 md:p-8 rounded-lg border-l-4 border-blue-800">
                  <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">Instructions To Authors:</h3>
                  <ol className="list-decimal pl-4 sm:pl-5 space-y-3 sm:space-y-4 text-gray-700 text-sm sm:text-base">
                    <li className="transition-all hover:translate-x-1">The length of the manuscript is restricted to <strong>12 pages</strong>. The text should be in double-column format.</li>
                    <li className="transition-all hover:translate-x-1">ICIUS 2026 organizers regard plagiarism as a serious professional misconduct.</li>
                    <li className="transition-all hover:translate-x-1">All manuscript will be peer reviewed and evaluated based on originality, technical and research content.</li>
                    <li className="transition-all hover:translate-x-1">Acceptance of manuscript will be communicated to authors by e-mail.</li>
                    <li className="transition-all hover:translate-x-1">Accepted and registered manuscript will be included in the conference proceedings.</li>
                  </ol>
                </div>
              </section>
            )}

            {/* Existing Submission Section */}
            {!loading && hasExistingSubmission && existingSubmission && !submitSuccess && (
              <section className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:shadow-xl border-t-4 border-blue-800 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-3 sm:mb-0">
                    <FaExclamationTriangle className="text-blue-600 mr-3 flex-shrink-0" />
                    <p className="text-blue-700 font-bold">
                      You have {allSubmissions.length} submitted {allSubmissions.length === 1 ? 'paper' : 'papers'}.
                    </p>
                  </div>
                  {allSubmissions.length > 1 && (
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={selectedPaperIndex}
                        onChange={(e) => {
                          const index = parseInt(e.target.value);
                          setSelectedPaperIndex(index);
                          setExistingSubmission(allSubmissions[index]);
                        }}
                        className="appearance-none bg-white border-2 border-blue-200 rounded-lg px-4 py-1.5 pr-8 text-sm font-bold text-blue-800 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer w-full transition-all hover:border-blue-300"
                      >
                        {allSubmissions.map((sub, idx) => (
                          <option key={sub.submissionId} value={idx}>
                            {sub.submissionId} - {sub.paperTitle.length > 25 ? sub.paperTitle.substring(0, 25) + '...' : sub.paperTitle}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaFileAlt className="text-blue-800 mr-3" />
                  Your Paper Submission
                </h2>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Submission ID</p>
                      <p className="text-gray-800 font-medium">{existingSubmission.submissionId}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Booking ID</p>
                      <p className="text-gray-800 font-medium">{existingSubmission.bookingId}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Paper Title</p>
                      <p className="text-gray-800 font-medium">{existingSubmission.paperTitle}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Author Name</p>
                      <p className="text-gray-800 font-medium">{existingSubmission.authorName}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Category</p>
                      <p className="text-gray-800 font-medium">{existingSubmission.category}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Status</p>
                      <p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${existingSubmission.status === 'Submitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : existingSubmission.status === 'Under Review'
                            ? 'bg-blue-100 text-blue-800'
                            : existingSubmission.status === 'Accepted'
                              ? 'bg-green-100 text-green-800'
                              : existingSubmission.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                          {existingSubmission.status}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Submission Date</p>
                      <p className="text-gray-800 font-medium">{formatDate(existingSubmission.submissionDate)}</p>
                    </div>

                    {existingSubmission.topic && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Topic</p>
                        <p className="text-gray-800 font-medium">{existingSubmission.topic}</p>
                      </div>
                    )}
                  </div>

                  {existingSubmission.abstractFileUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-500 text-sm mb-2">Submitted File</p>
                      <div className="flex items-center">
                        <FaFilePdf className="text-red-500 mr-2" />
                        <span className="text-gray-800">Abstract/Paper File</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-800 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg w-full sm:w-auto"
                  >
                    <FaEye className="mr-2" />
                    View in Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setShowReuploadModal(false);
                    }}
                    className={`px-6 py-3 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg w-full sm:w-auto ${showHistory ? 'bg-gray-800 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                  >
                    <FaHistory className="mr-2" />
                    {showHistory ? 'Hide History' : 'View History'}
                  </button>

                  {existingSubmission.status !== 'Accepted' && existingSubmission.status !== 'Rejected' && (
                    <button
                      onClick={() => {
                        setShowReuploadModal(!showReuploadModal);
                        setShowHistory(false);
                      }}
                      className={`px-6 py-3 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg w-full sm:w-auto ${showReuploadModal ? 'bg-purple-800 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                    >
                      <FaUpload className="mr-2" />
                      {showReuploadModal ? 'Cancel Re-upload' : 'Re-upload Paper'}
                    </button>
                  )}

                  {existingSubmission.status === 'Accepted' && (
                    <button
                      onClick={() => navigate('/author-dashboard')}
                      className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg w-full sm:w-auto"
                    >
                      <FaCheckCircle className="mr-2" />
                      Proceed to Copyright Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowSubmitAnother(!showSubmitAnother);
                      setShowHistory(false);
                      setShowReuploadModal(false);
                    }}
                    className={`px-6 py-3 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg w-full sm:w-auto ${showSubmitAnother ? 'bg-orange-800 text-white' : 'bg-[#F5A051] text-white hover:bg-[#e08c3e]'
                      }`}
                  >
                    <FaUpload className="mr-2" />
                    {showSubmitAnother ? 'Cancel New Submission' : 'Submit Another Paper'}
                  </button>
                </div>

                {/* Submit Another Paper Form */}
                {showSubmitAnother && (
                  <div className="mt-8 p-6 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUpload className="text-orange-600" />
                        Submit Another Research Paper
                      </h3>
                    </div>
                    <SubmitPaperForm
                      isOpen={true}
                      onClose={() => setShowSubmitAnother(false)}
                      embedded={true}
                      onSubmissionSuccess={() => {
                        setShowSubmitAnother(false);
                        handleSubmissionSuccess();
                      }}
                      hasExistingSubmission={true}
                    />
                  </div>
                )}


                {/* Inline History Timeline */}
                {showHistory && (
                  <div className="mt-8 p-0 bg-transparent animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-6 px-4">
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FaHistory className="text-gray-800" />
                        </div>
                        Trace Your Paper
                      </h3>
                      <button
                        onClick={() => setShowHistory(false)}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition flex items-center gap-2 text-xs font-bold uppercase"
                      >
                        Hide <FaEye className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/50">
                      <PaperHistoryTimeline submissionId={existingSubmission.submissionId} />
                    </div>
                  </div>
                )}

                {/* Inline Re-upload Form */}
                {showReuploadModal && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-purple-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUpload className="text-purple-600" />
                        Re-upload New Manuscript
                      </h3>
                    </div>
                    <ReuploadPaperModal
                      submissionId={existingSubmission.submissionId}
                      onSuccess={() => {
                        window.location.reload();
                      }}
                      onClose={() => setShowReuploadModal(false)}
                      embedded={true}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Revision Section - Show ONLY if selected paper needs revision */}
            {!loading && currentPaperRevision && existingSubmission?.status === 'Revision Required' && !submitSuccess && (
              <section className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:shadow-xl border-t-4 border-red-600 mb-8">
                <div className="bg-red-50 p-4 rounded-md mb-6">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-600 mr-3 flex-shrink-0" />
                    <p className="text-red-700">
                      <strong>Your paper requires revision.</strong> Please review the comments below and resubmit your revised paper before the deadline.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaFileAlt className="text-red-600 mr-3" />
                  Revision Required
                </h2>

                {/* Revision Deadline */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
                  <p className="text-yellow-800">
                    <strong>Revision Deadline:</strong> {formatDate(currentPaperRevision.revisionDeadline)}
                  </p>
                </div>

                {/* Editor's Message */}
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-md">
                  <h3 className="font-bold text-blue-900 mb-2">Editor's Message:</h3>
                  <p className="text-blue-800 whitespace-pre-wrap">{currentPaperRevision.revisionMessage}</p>
                </div>

                {/* Reviewer Comments */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Comments from Reviewers:</h3>
                  <div className="space-y-4">
                    {currentPaperRevision.reviewerComments && currentPaperRevision.reviewerComments.map((comment: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 border-l-4 border-orange-400 rounded-md">
                        <h4 className="font-bold text-orange-700 mb-3">Reviewer {index + 1}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="font-semibold text-gray-600">Recommendation:</span>
                            <p className="text-gray-800">{comment.recommendation || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">Overall Rating:</span>
                            <p className="text-gray-800">{comment.overallRating || 'N/A'} / 5</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="font-semibold text-gray-600">Strengths:</span>
                          <p className="text-gray-800 whitespace-pre-wrap mt-1">{comment.strengths || 'N/A'}</p>
                        </div>

                        <div className="mb-3">
                          <span className="font-semibold text-gray-600">Weaknesses:</span>
                          <p className="text-gray-800 whitespace-pre-wrap mt-1">{comment.weaknesses || 'N/A'}</p>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-600">Comments:</span>
                          <p className="text-gray-800 whitespace-pre-wrap mt-1">{comment.comments || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Show Revision Upload Form or Button */}
                {currentPaperRevision.revisionStatus === 'Pending' || currentPaperRevision.revisionStatus === 'Submitted' ? (
                  <>
                    {!showRevisionUpload ? (
                      <button
                        onClick={() => setShowRevisionUpload(true)}
                        className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-all duration-300 flex items-center"
                      >
                        <FaEdit className="mr-2" />
                        Upload Revised Paper
                      </button>
                    ) : (
                      <div className="mt-6">
                        <RevisionForm
                          paperId={existingSubmission?._id || ''}
                          submissionId={currentPaperRevision.submissionId}
                          authorEmail={currentPaperRevision.authorEmail}
                          paperTitle={currentPaperRevision.paperTitle || existingSubmission?.paperTitle || ''}
                          authorName={currentPaperRevision.authorName}
                          revisionData={currentPaperRevision}
                          onSubmissionSuccess={handleSubmissionSuccess}
                          onClose={() => setShowRevisionUpload(false)}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-md">
                    <p className="text-green-800">
                      <strong>Revised Paper Received:</strong> Your revised paper was received on {formatDate(currentPaperRevision.revisedPaperSubmittedAt || new Date())}.
                      Our editorial team will review it and provide further updates.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Paper Submission Form Section - Only show if no existing submission and no revision */}
            {!loading && !hasExistingSubmission && !hasRevision && !submitSuccess && (
              <>
                {/* Important Note before Form */}
                <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <span className="font-medium">Important:</span> To submit your paper, please fill out the form below. Make sure to include all required information and attach your paper in PDF or Word format.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-bold">Important:</span> Extended Abstract submission deadline is <span className="line-through text-red-500 mx-1">30 June 2026</span> <span className="font-bold text-green-700 underline">25 July 2026 (Extended)</span>. Submit your paper before the deadline!
                      </p>
                    </div>
                  </div>
                </div>

                <section className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:shadow-xl border-t-4 border-blue-800">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="bg-blue-800 w-10 h-10 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
                      <FaPaperPlane className="text-white text-lg" />
                    </div>
                    <span className="mt-1">Submit Your Paper</span>
                  </h2>

                  {/* Embedded SubmitPaperForm component */}
                  <SubmitPaperForm
                    isOpen={true}
                    onClose={() => { }}
                    embedded={true}
                    onSubmissionSuccess={handleSubmissionSuccess}
                  />
                </section>
              </>
            )}

            {/* Additional information */}
            <div className="mt-12 bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-blue-800">Contact for Submission Assistance</h3>
              <p className="mb-2">If you encounter any issues with the submission form, please contact:</p>
              <div className="flex items-center mt-3">
                <FaEnvelope className="text-blue-800 mr-2" />
                <a href="mailto:icius2026@isius.org" className="text-blue-800 hover:underline">
                  icius2026@isius.org
                </a>
              </div>
            </div>

            {/* Footer section with quote */}
            <div className="mt-8 sm:mt-12 md:mt-16 text-center px-4">
              <blockquote className="italic text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                "Research is formalized curiosity. It is poking and prying with a purpose."
                <footer className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">— Zora Neale Hurston</footer>
              </blockquote>
            </div>
          </div>
        </div>

      </div>
    </PageTransition >
  );
};

export default PaperSubmission;
