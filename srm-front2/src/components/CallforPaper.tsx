import { FaCalendarAlt, FaFileAlt, FaExclamationTriangle, FaUserFriends, FaCheckCircle, FaCreditCard, FaUniversity, FaQrcode } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from '../config/api';
import qr from "./images/bali/qr.png"
const CallForPapers = () => {
  const navigate = useNavigate();

  const handleSubmissionClick = async () => {
    try {
      // Try to access protected route to check if user is authenticated
      // api instance already includes base URL and withCredentials
      await api.get(`/api/auth/me`);
      // If successful, navigate to paper submission
      navigate('/paper-submission');
    } catch (error: any) {
      // Not authenticated, show login prompt
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login before submitting a paper',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#F5A051',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Sign Up'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          navigate('/signin');
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-10 sm:py-20">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CALL FOR PAPERS</h1>
          <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
          <p className="text-lg md:text-xl max-w-3xl mx-auto">
            International Conference on Intelligent Unmanned Systems (ICIUS 2026)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-12">
        {/* Invitation Section */}
        <section className="mb-16">
          <p className="text-lg leading-relaxed mb-8 text-gray-700">
            We invite researchers, scholars, and practitioners to contribute to the ICIUS conference
            through paper submissions. Share your innovative research, insights, and perspectives across
            intelligent systems, robotics, and unmanned vehicles. Join us in building a platform
            that celebrates diverse perspectives and fosters collaboration across a spectrum of research
            domains.
          </p>

          <div className="mt-8 space-y-2">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Focus Areas:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Intelligent Systems and AI Applications</li>
              <li>Robotics and Automation</li>
              <li>Unmanned Aerial Vehicles (UAVs)</li>
              <li>Unmanned Ground and Underwater Vehicles</li>
              <li>NextGen Technologies and Smart Infrastructure</li>
              <li>Control Systems and Sensors</li>
            </ul>
          </div>
        </section>

        {/* Important Dates Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaCalendarAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5A051]">IMPORTANT DATES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DateCard
              title="Extended Abstract Submission"
              date={
                <span>
                  <span className="line-through text-red-500 mr-2">30 June 2026</span>
                  <span className="text-green-600 font-bold italic">25 July 2026 (Extended)</span>
                </span>
              }
              isHighlighted={true}
            />
            <DateCard
              title="Full Paper Submission"
              date="30 July 2026"
            />
            <DateCard
              title="Acceptance Notification"
              date="15 August 2026"
            />
            <DateCard
              title="Conference Dates"
              date="26–27 November 2026"
            />
          </div>
        </section>


        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaFileAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5A051]">PAPER SUBMISSION</h2>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
            <p className="text-lg leading-relaxed mb-4 text-gray-700">
              We invite scholars, researchers, and professionals to contribute to the intelligent unmanned
              systems discourse by submitting their insightful papers and abstracts. Join us in building a platform
              that celebrates innovation and fosters collaboration across the field. Submit your work and be a 
              part of the transformative dialogue at ICIUS 2026.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleSubmissionClick}
                className="inline-flex items-center bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors duration-300"
              >
                <Link to="/paper-submission" className="flex items-center">
                  <FaFileAlt className="mr-2" />
                  Paper  Submission
                </Link>
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaExclamationTriangle className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5A051]">INSTRUCTION TO AUTHORS</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <ol className="list-decimal pl-5 space-y-5">
              <li className="text-gray-700">
                The length of the manuscript is restricted to 12 pages. The text should be in double
                column format. The first page of your submission should include the paper title,
                author name(s), affiliations, e-mail address and Keywords.
              </li>
              <li className="text-gray-700">
                ICIUS 2026 organizers regard plagiarism as a serious professional misconduct. All
                submissions will be screened for plagiarism and when identified, the submission by
                the same author will be rejected.
              </li>
              <li className="text-gray-700">
                All manuscript that confirm to submission will be peer reviewed and evaluated based
                on originality, technical and / or research content/ depth, correctness, relevance to
                conference, contributions and readability.
              </li>
              <li className="text-gray-700">
                Acceptance of manuscript will be communicated to authors by e-mail.
              </li>
              <li className="text-gray-700">
                The authors of the accepted manuscripts will be allowed to make corrections in
                accordance with the suggestions of the reviewers and submit camera-ready paper
                within the stipulated deadline.
              </li>
              <li className="text-gray-700">
                Accepted and registered manuscript will be included in the conference proceedings.
              </li>
              <li className="text-gray-700">
                Authors must submit their manuscript to the Email- ID: <a href="mailto:icius2026@isius.org" className="text-[#F5A051] hover:underline">icius2026@isius.org</a>
              </li>
            </ol>
            <div className="mt-6 py-2 px-4 bg-blue-50 border-l-4 border-[#F5A051] text-gray-700">
              <p><strong>Extended Abstract Submission Deadline:</strong> <span className="line-through text-red-500 mr-2">30 June 2026</span> <span className="text-green-700 font-bold">25 July 2026 (Extended)</span></p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaCalendarAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5A051]">REGISTRATION FEE DETAILS</h2>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">Category</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">Participant Type</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold">Registration Fee</th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td rowSpan={2} className="border border-gray-300 px-4 py-3 text-gray-800 font-bold bg-gray-100">
                    🇮🇳 Indian Participant
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">Authors</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-700">$300</td>
                </tr>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">Listeners</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-700">$200</td>
                </tr>
                <tr className="bg-white hover:bg-gray-100 transition-colors">
                  <td rowSpan={2} className="border border-gray-300 px-4 py-3 text-gray-800 font-bold bg-gray-100">
                    🌍 Foreign Participant
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">Authors</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-700">$400</td>
                </tr>
                <tr className="bg-white hover:bg-gray-100 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">Listeners</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-700">$250</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-[#F5A051] text-gray-700 rounded">
            <p className="text-sm"><strong>Note:</strong> Registration fees include conference kit, certificate, proceedings, and refreshments (excluding accommodation and publication fees).</p>
            <p className="text-sm mt-2"><strong>Payment Options:</strong> Indian participants can pay via UPI/Bank Transfer. International participants can pay by credit card through PayPal.</p>
            <p className="text-sm mt-2"><strong>Early Bird Discount:</strong> Register early to enjoy discounted rates. Limited seats available.</p>
          </div>
        </section>

        {/* Listener Registration Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaFileAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5A051]">LISTENER REGISTRATION</h2>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-[#F5A051] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaUserFriends className="mr-3 text-[#F5A051]" />
              Not an Author? Register as a Listener!
            </h3>
            <p className="text-gray-700 mb-4">
              If you're interested in attending ICIUS 2026 as a listener without submitting a research paper, you can still register for the conference. Listeners get access to all conference sessions, materials, and networking opportunities.
            </p>
            <div className="bg-white p-4 rounded mb-4 border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <FaCheckCircle className="mr-2 text-green-500" />
                What's Included for Listeners:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Access to all conference sessions and presentations</li>
                <li>• Conference kit and materials</li>
                <li>• Certificate of participation</li>
                <li>• Networking opportunities with researchers and industry professionals</li>
                <li>• Refreshments during the conference</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/registrations')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-900 to-[#F5A051] text-white font-semibold rounded-lg hover:shadow-lg transition-all text-center"
              >
                Register as Listener
              </button>
              <button
                onClick={handleSubmissionClick}
                className="w-full sm:w-auto px-6 py-3 bg-white text-[#F5A051] font-semibold rounded-lg border-2 border-[#F5A051] hover:bg-orange-50 transition-all text-center"
              >
                Submit Paper as Author
              </button>
            </div>
          </div>
        </section>

        {/* Post-Payment Instructions Section */}
        <section className="mb-10 sm:mb-16">
          <div className="flex items-center mb-4 sm:mb-6">
            <FaExclamationTriangle className="text-[#F5A051] text-lg sm:text-2xl mr-2 sm:mr-4 shrink-0" />
            <h2 className="text-base sm:text-xl md:text-3xl font-bold text-[#F5A051]">POST-PAYMENT INSTRUCTIONS</h2>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-[#F5A051] rounded-lg shadow-xl p-4 sm:p-8">
            <div className="mb-4 sm:mb-6 text-center">
              <h3 className="text-base sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Complete These Steps After Payment</h3>
              <p className="text-xs sm:text-base text-gray-700">Follow these important steps to ensure your registration is successfully processed</p>
            </div>

            <div className="space-y-3 sm:space-y-6">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-md border-l-4 border-blue-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">📸 Take a Screenshot of Payment Confirmation</h4>
                    <p className="text-xs sm:text-base text-gray-700">
                      Once your payment is completed (via PayPal, Bank Transfer, or UPI), <strong>immediately take a screenshot</strong> of the payment confirmation page showing:
                    </p>
                    <ul className="list-disc ml-4 sm:ml-6 mt-1 sm:mt-2 text-xs sm:text-base text-gray-700 space-y-0.5 sm:space-y-1">
                      <li>Transaction ID / Reference Number</li>
                      <li>Payment amount</li>
                      <li>Payment date and time</li>
                      <li>Payment status (Success/Completed)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-md border-l-4 border-green-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">📋 Copy the Transaction ID</h4>
                    <p className="text-xs sm:text-base text-gray-700">
                      <strong>Copy the Transaction ID / Reference Number</strong> from your payment confirmation. This is a unique identifier for your payment and is required for registration verification.
                    </p>
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-xs sm:text-sm text-green-900">
                        <strong>💡 Tip:</strong> Keep this Transaction ID handy - you'll need to paste it in the registration form in the next step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-md border-l-4 border-purple-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">🔐 Login to the Website</h4>
                    <p className="text-xs sm:text-base text-gray-700 mb-2 sm:mb-3">
                      Go to the login page and <strong>sign in with your registered account</strong>. If you don't have an account yet, please sign up first.
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-md"
                    >
                      Go to Login Page →
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-md border-l-4 border-orange-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                    4
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">📝 Click on Registration</h4>
                    <p className="text-xs sm:text-base text-gray-700 mb-2 sm:mb-3">
                      After logging in, navigate to the <strong>Registration page</strong> from the menu or click the button below.
                    </p>
                    <button
                      onClick={() => navigate('/registrations')}
                      className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-md"
                    >
                      Go to Registration Page →
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-md border-l-4 border-red-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                    5
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">✍️ Paste Transaction ID in the Form</h4>
                    <p className="text-xs sm:text-base text-gray-700">
                      In the registration form, you'll find a field for <strong>"Transaction ID"</strong>. Paste the Transaction ID you copied in Step 2 into this field.
                    </p>
                    <ul className="list-disc ml-4 sm:ml-6 mt-1 sm:mt-2 text-xs sm:text-base text-gray-700 space-y-0.5 sm:space-y-1">
                      <li>Fill in all other required details in the form</li>
                      <li>Upload your payment screenshot (from Step 1)</li>
                      <li>Double-check all information before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-md border-l-4 border-indigo-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                    6
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">📸 Take Another Screenshot</h4>
                    <p className="text-xs sm:text-base text-gray-700">
                      After successfully submitting the registration form, <strong>take a screenshot of the confirmation page</strong> for your records. This will serve as proof of your registration submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-4 sm:mt-8 bg-red-100 border-2 border-red-500 rounded-lg p-3 sm:p-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 text-xl sm:text-3xl mr-2 sm:mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm sm:text-xl font-bold text-red-800 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-3">
                    <FaExclamationTriangle className="text-base sm:text-xl" />
                    CRITICAL: Complete All Steps
                  </h4>
                  <p className="text-xs sm:text-base text-red-900 font-medium">
                    Your payment will NOT be verified and your registration will NOT be processed until you complete ALL the above steps, including pasting the Transaction ID in the registration form. Please ensure you follow each step carefully.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-3 sm:mt-6 bg-blue-100 border border-blue-300 rounded-lg p-3 sm:p-4">
              <p className="text-blue-900 text-xs sm:text-sm">
                <strong>Need Help?</strong> If you face any issues during the registration process, please contact us at{' '}
                <a href="mailto:icius2026@isius.org" className="text-blue-700 underline font-semibold">
                  icius2026@isius.org
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaCreditCard className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5A051]">PAYMENT METHODS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PayPal / Credit Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500 hover:shadow-xl transition-all">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  �
                </div>
                <h3 className="text-xl font-bold text-gray-800">PayPal / Credit Card</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Secure international payment option. PayPal accepts all major credit cards (Visa, MasterCard, American Express) without requiring a PayPal account.
              </p>
              <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
                <p className="font-semibold text-blue-900">International Participants</p>
                <p className="text-blue-800">Credit cards accepted worldwide via PayPal</p>
              </div>
              <a
                href="https://www.paypal.com/ncp/payment/3Q9N4H9ZKX24A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all w-full justify-center"
              >
                Pay with Credit Card / PayPal
                <span className="ml-2">→</span>
              </a>
            </div>

            {/* Bank Transfer / UPI - Full Details */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500 hover:shadow-xl transition-all">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FaUniversity className="text-red-600 text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Bank Transfer / UPI</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Pay directly through bank transfer or UPI using the account details below or scan the QR code.
              </p>
              <div className="bg-red-50 p-4 rounded text-sm space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-red-200 pb-2 gap-1 sm:gap-4">
                  <p className="font-semibold text-red-900">Bank A/C Name:</p>
                  <p className="text-red-800 font-medium sm:text-right">MELANGE PUBLICATIONS</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-red-200 pb-2 gap-1 sm:gap-4">
                  <p className="font-semibold text-red-900">Account No:</p>
                  <p className="text-red-800 font-medium sm:text-right">736805000791</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-red-200 pb-2 gap-1 sm:gap-4">
                  <p className="font-semibold text-red-900">Bank Name:</p>
                  <p className="text-red-800 font-medium sm:text-right">ICICI BANK</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-red-200 pb-2 gap-1 sm:gap-4">
                  <p className="font-semibold text-red-900">Branch:</p>
                  <p className="text-red-800 font-medium sm:text-right">VILLIANUR, PUDUCHERRY</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-red-200 pb-2 gap-1 sm:gap-4">
                  <p className="font-semibold text-red-900">IFSC Code:</p>
                  <p className="text-red-800 font-medium sm:text-right">ICIC0007368</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <p className="font-semibold text-red-900">SWIFT Code:</p>
                  <p className="text-red-800 font-medium sm:text-right">ICICINBBCTS</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mt-8 flex justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-300">
              <h3 className="text-center font-bold text-gray-800 mb-4 flex items-center justify-center">
                <FaQrcode className="mr-3 text-orange-500" />
                Scan & Pay with UPI
              </h3>
              <img
                src={qr}
                alt="UPI QR Code for Payment"
                className="w-80 h-80 object-contain mx-auto rounded-lg border-2 border-orange-300"
              />
              <p className="text-center text-sm text-gray-600 mt-4">
                Scan this QR code with any UPI app to make payment instantly
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-sm text-yellow-900"><strong>⚠️ Important:</strong> After making your payment through any method, please complete your registration on our platform to confirm your participation.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

// DateCard Component
interface DateCardProps {
  title: string;
  date: React.ReactNode;
  isHighlighted?: boolean;
}

const DateCard: React.FC<DateCardProps> = ({ title, date, isHighlighted = false }) => {
  return (
    <div className={`rounded-lg overflow-hidden shadow-md transition-transform hover:-translate-y-1 duration-300 ${isHighlighted ? 'border-2 border-[#F5A051]' : 'border border-gray-200'}`}>
      <div className="bg-[#F5A051] text-white p-4">
        <h3 className="font-bold text-base md:text-lg lg:text-xl">{title}</h3>
      </div>
      <div className="bg-white p-4">
        <p className="text-gray-800 font-medium">{date}</p>
      </div>
    </div>
  );
};

export default CallForPapers;
