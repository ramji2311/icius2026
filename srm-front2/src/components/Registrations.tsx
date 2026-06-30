import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  CreditCard,
  FileText,
  Building,
  Globe,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../config/api';
import { Link } from 'react-router-dom';
import RegistrationCountdown from './RegistrationCountdown';
import EnhancedUniversalRegistrationForm from './EnhancedUniversalRegistrationForm';
import EnhancedFeeTable from './EnhancedFeeTable';

const MemoizedRegistrationCountdown = React.memo(RegistrationCountdown);





const LoadingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      <p className="mt-4 text-gray-600">Verifying acceptance status...</p>
    </div>
  </div>
);

const Registrations: React.FC = () => {
  // Define ALL state hooks FIRST
  const [activeTab, setActiveTab] = useState<'fee' | 'form'>('fee');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [listenerRegistration, setListenerRegistration] = useState<any>(null);

  const bankDetailsRef = useRef<HTMLDivElement>(null);

  // Define ALL callback hooks SECOND
  const copyAllBankDetails = useCallback(() => {
    if (bankDetailsRef.current) {
      const allDetails = bankDetailsRef.current.innerText;
      navigator.clipboard.writeText(allDetails);
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleDownload = useCallback((url: string, filename: string) => {
    Swal.fire({
      title: 'Downloading...',
      text: `Preparing ${filename} for download`,
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      showConfirmButton: false
    });

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download file (Status: ${response.status})`);
        }
        return response.blob();
      })
      .then(blob => {
        Swal.close();

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        Swal.fire({
          icon: 'success',
          title: 'Download Started',
          text: `${filename} is being downloaded`,
          timer: 2000,
          showConfirmButton: false
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        Swal.close();

        Swal.fire({
          icon: 'info',
          title: 'Download Failed',
          text: `${error.message}. Please try again later or contact support.`,
          confirmButtonColor: '#3085d6'
        });
      });
  }, []);



  // Define effect hook THIRD
  useEffect(() => {
    const checkAcceptanceStatus = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/check-acceptance-status');

        console.log('Acceptance check response:', response.data);
        setIsAccepted(response.data.isAccepted || false);
      } catch (error) {
        console.error('Error checking acceptance status:', error);
        setIsAccepted(false);
      } finally {
        setLoading(false);
      }
    };

    const checkMembershipStatus = async () => {
      try {
        setLoadingMembership(true);
        const response = await api.get('/api/membership/check-membership');

        console.log('Membership check response:', response.data);
        setMembershipStatus(response.data);
      } catch (error) {
        console.error('Error checking membership status:', error);
        setMembershipStatus({ isMember: false });
      } finally {
        setLoadingMembership(false);
      }
    };

    const checkListenerRegistrationStatus = async () => {
      try {
        const response = await api.get('/api/listener/my-listener-registration');

        console.log('Listener registration check response:', response.data);
        if (response.data && response.data.registration) {
          setListenerRegistration(response.data.registration);
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error checking listener registration:', error);
        }
      }
    };

    checkAcceptanceStatus();
    checkMembershipStatus();
    checkListenerRegistrationStatus();
  }, []);

  // Check if user is logged in - using state for more robustness
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isAuthenticated') === 'true');

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.data.success && response.data.user) {
          setIsLoggedIn(true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem('isAuthenticated');
        }
      } catch (error) {
        // If it was already true in localStorage, keep it for now but handle failure
        console.error('Auth verification failed:', error);
      }
    };

    verifyAuth();
  }, []);

  // NOW render based on state - all hooks have been called
  if (loading) {
    return <LoadingPage />;
  }

  // Handler for register button click
  const handleRegisterClick = () => {
    if (!isLoggedIn) {
      // Save current URL to return after login
      localStorage.setItem('returnUrl', '/registrations');
      // Redirect to login
      window.location.href = '/login';
    } else {
      // User is logged in, switch to form tab
      setActiveTab('form');
      // Scroll to form section
      setTimeout(() => {
        const formSection = document.getElementById('registration-form-section');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Main component JSX - Show for everyone (logged in or not)
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 max-w-[100vw] min-w-0 overflow-x-hidden">
      {/* Rest of your component remains the same */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-12 sm:py-16 md:py-24 overflow-hidden">
        {/* Header content */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 md:w-40 md:h-40 border-4 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 border-4 border-white transform -translate-y-1/2"></div>
        </div>

        <div className="absolute inset-0 bg-black opacity-30"></div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-block mb-6">
            <div className="w-16 h-1 bg-[#F5A051] mx-auto mb-2"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Registration</h1>
            <div className="w-16 h-1 bg-[#F5A051] mx-auto mt-2"></div>
          </div>
          <p className="text-lg md:text-xl max-w-3xl mx-auto font-light">
            International Conference on Intelligent Unmanned Systems (ICIUS 2026)
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="mb-12">
          <MemoizedRegistrationCountdown />
        </div>

        {/* SCIS Membership Status Banner */}
        {!loadingMembership && membershipStatus && (
          <div className={`mb-6 border-l-4 p-4 rounded ${membershipStatus.isMember
            ? 'bg-green-50 border-green-500'
            : 'bg-yellow-50 border-yellow-500'
            }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {membershipStatus.isMember ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="ml-3">
                {membershipStatus.isMember ? (
                  <>
                    <p className="text-sm font-bold text-green-800">
                      SCIS Member - Discount Applied!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Membership ID: <span className="font-mono font-semibold">{membershipStatus.membershipId}</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You are eligible for SCIS member discounted registration fees. Your discount will be automatically applied during registration.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-yellow-800">
                      Not a SCIS Member
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You will be charged non-member registration fees. Consider becoming a SCIS member to enjoy discounted rates!
                    </p>
                    <div className="mt-3">
                      <a
                        href="https://societycis.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all shadow-md text-sm"
                      >
                        Become SCIS Member →
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-blue-50/50 backdrop-blur-sm border-l-4 border-blue-500 p-4 shadow-sm rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Important:</span> Registration deadline is <span className="line-through text-red-500 mr-1">15 February 2026</span> <span className="font-bold text-green-700 underline">30 August 2026</span>. Complete your registration before the deadline!
              </p>
            </div>
          </div>
        </div>

        {/* Prominent Register Button - Show for everyone EXCEPT verified listeners */}
        {!listenerRegistration || listenerRegistration.paymentStatus !== 'verified' ? (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">Ready to Register?</h2>
            <p className="text-blue-100 mb-6 text-lg">
              {isLoggedIn && isAccepted
                ? "Your paper has been accepted! Register as an author to present at the conference."
                : "Register as a listener/attendee to participate in the conference."}
            </p>
            <button
              onClick={handleRegisterClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center mx-auto"
            >
              <ArrowRight className="mr-2" size={24} />
              {isLoggedIn
                ? (isAccepted ? "Register as Author" : "Register as Listener")
                : "Register as Author"}
            </button>
            <p className="text-blue-100 text-sm mt-4">
              {isLoggedIn
                ? (isAccepted
                  ? "Complete your author registration to present your accepted paper at the conference"
                  : "Register as a listener to attend the conference")
                : "Please login or create an account to complete your registration"}
            </p>
          </div>
        ) : (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-3 text-center flex items-center justify-center">
              <Check className="mr-3 p-1 bg-white/20 rounded-full" size={32} />
              Registration Confirmed
            </h2>
            <p className="text-green-100 mb-4 text-lg">
              Your listener registration has been verified and confirmed!
            </p>
            <p className="text-green-100 text-sm">
              Registration Number: <span className="font-mono font-bold">{listenerRegistration.registrationNumber}</span>
            </p>
          </div>
        )}

        {/* Login Required Section - Show when not logged in */}
        {!isLoggedIn && (
          <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-xl p-8 text-center">
            <div className="mb-4">
              <AlertCircle className="mx-auto mb-3 text-amber-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-amber-900 mb-3">Login Required</h3>
            <p className="text-amber-800 mb-6 text-lg">
              You need to log in to access the full registration details and submit your registration.
            </p>
            <Link
              to="/login"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Login / Register Account
            </Link>
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('fee')}
            className={`pb-4 px-4 text-base sm:text-lg font-medium ${activeTab === 'fee'
              ? 'text-blue-800 border-b-2 border-blue-800'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            type="button"
          >
            Conference Fee & Payment Details
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-4 px-4 text-base sm:text-lg font-medium ${activeTab === 'form'
              ? 'text-blue-800 border-b-2 border-blue-800'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            type="button"
          >
            Registration Form
          </button>
        </div>

        {/* Fee Information Tab - renders conditionally */}
        {activeTab === 'fee' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Fee section content */}
            <div className="p-6 sm:p-8 md:p-10 border-b border-gray-100">
              {/* ... fee section content ... */}
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 flex items-start">
                <CreditCard className="text-blue-800 mr-3 mt-1" size={28} />
                Conference Fee
                <span className="text-sm text-gray-500 font-normal ml-3 mt-3">(Excluding Publication Fee)</span>
              </h2>

              <p className="text-gray-600 mb-8">
                Participants are requested to register the Conference. The Conference fee must be paid either through Demand Draft (DD) or online payment with the following bank A/c details.
              </p>

              {/* Enhanced Fee Table with country highlighting */}
              <EnhancedFeeTable membershipStatus={membershipStatus} isAccepted={isAccepted || false} />

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-8 border border-gray-100 mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Conference fee includes:</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Conference kit</li>
                  <li>Certificate</li>
                  <li>Proceedings</li>
                  <li>Non-Scopus Journal</li>
                  <li>Lunch with refreshments</li>
                </ul>
                <p className="mt-3 text-sm text-gray-500 italic">These fees do not include accommodation.</p>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FileText className="mr-2 text-blue-800" />
                  Required Forms
                </h3>
                <p className="text-gray-600 mb-4">
                  After making your payment, download the Registration form and Copyright form, fill it out and
                  email it to <span className="font-medium text-blue-800">icius2026@isius.org</span> along with your payment information.
                  The payee is accountable for all bank charges.
                </p>

                {/* Updated download buttons */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <button
                    onClick={() => handleDownload('/documents/e.pdf', 'ICIUS_Copyright_Form.pdf')}
                    className="flex items-center text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg"
                    type="button"
                  >
                    <Download size={18} className="mr-2" />
                    <span>Download Copyright Form</span>
                  </button>

                  <button
                    onClick={() => handleDownload('/documents/r.pdf', 'ICIUS_Registration_Form.pdf')}
                    className="flex items-center text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg"
                    type="button"
                  >
                    <Download size={18} className="mr-2" />
                    <span>Download Registration Form</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="p-6 sm:p-8 md:p-10 bg-gray-50">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 flex items-center">
                <Building className="text-blue-800 mr-3" size={28} />
                Bank Details
              </h2>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" ref={bankDetailsRef}>
                <div className="space-y-4">
                  {/* Bank details content */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Bank A/C Name:</p>
                    <p className="font-medium text-gray-900">MELANGE PUBLICATIONS</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Bank A/C No:</p>
                    <p className="font-medium text-gray-900">736805000791</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Bank Name:</p>
                    <p className="font-medium text-gray-900">ICICI BANK</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Branch:</p>
                    <p className="font-medium text-gray-900">VILLIANUR, PUDUCHERRY</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">IFSC Code:</p>
                    <p className="font-medium text-gray-900">ICIC0007368</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">SWIFT Code:</p>
                    <p className="font-medium text-gray-900">ICICINBBCTS</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={copyAllBankDetails}
                  className="flex items-center bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                  type="button"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check size={20} className="mr-2" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={20} className="mr-2" />
                      Copy Bank Details
                    </>
                  )}
                </button>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setActiveTab('form')}
                  className="flex items-center bg-gradient-to-r from-blue-800 to-[#F5A051] text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                  type="button"
                >
                  <span>Proceed to Registration Form</span>
                  <ArrowRight size={20} className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form Tab - renders conditionally (only if logged in) */}
        {activeTab === 'form' && isLoggedIn && (
          <div id="registration-form-section">
            <EnhancedUniversalRegistrationForm />
          </div>
        )}

        {/* Login Required for Form - Show when not logged in and form tab is selected */}
        {activeTab === 'form' && !isLoggedIn && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-amber-600" size={40} />
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Login Required</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Please log in to your account to access the registration form and complete your registration.
            </p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Go to Login Page
            </Link>
          </div>
        )}

        {/* More Information */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Need Help?</h3>
          <p className="text-gray-600">
            For any queries regarding registration or payment, please contact us at
            <a
              href="mailto:icius2026@isius.org"
              className="text-blue-800 hover:underline ml-1"
            >
              icius2026@isius.org
            </a>
          </p>

          <div className="flex justify-center mt-6 space-x-4">
            <a
              href="#"
              className="text-gray-600 hover:text-blue-800 flex items-center"
            >
              <FileText size={16} className="mr-1" />
              Conference Brochure
              <ExternalLink size={14} className="ml-1" />
            </a>

            <a
              href="#"
              className="text-gray-600 hover:text-blue-800 flex items-center"
            >
              <Globe size={16} className="mr-1" />
              Conference Website
              <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </div>
      </div >
    </div >
  );
};

// Export with React.memo to prevent unnecessary re-renders
export default Registrations;