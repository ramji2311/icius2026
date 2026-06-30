import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileText, CreditCard, Mail, Phone, Building, Globe, Calendar, User, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../config/api';

interface AcceptedPaper {
  _id: string;
  submissionId: string;
  paperTitle: string;
  status: string;
  category: string;
  createdAt: string;
  paymentStatus?: string;
}

interface RegistrationCategory {
  id: string;
  name: string;
  price: number;
  description: string;
}

const AuthorRegistration: React.FC = () => {
  const [acceptedPapers, setAcceptedPapers] = useState<AcceptedPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  
  // Form states
  const [institution, setInstitution] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [registrationCategory, setRegistrationCategory] = useState('indian-author');
  
  // Registration categories with pricing
  const registrationCategories: RegistrationCategory[] = [
    { id: 'indian-student', name: 'Indian Student', price: 3000, description: 'For Indian students with valid ID' },
    { id: 'indian-faculty', name: 'Indian Faculty', price: 4000, description: 'For Indian academic faculty' },
    { id: 'indian-author', name: 'Indian Author', price: 5000, description: 'For Indian authors' },
    { id: 'indian-listener', name: 'Indian Listener', price: 2000, description: 'For Indian listeners/attendees' },
    { id: 'foreign-author', name: 'Foreign Author', price: 200, description: 'For international authors (USD)' },
    { id: 'foreign-listener', name: 'Foreign Listener', price: 100, description: 'For international listeners (USD)' },
  ];

  useEffect(() => {
    fetchAcceptedPapers();
    checkMembershipStatus();
    fetchPrefillDetails();
  }, []);

  const fetchPrefillDetails = async () => {
    try {
      const response = await api.get('/api/registration/prefill-details');
      if (response.data.success && response.data.details) {
        const { institution, address, country } = response.data.details;
        if (institution) setInstitution(institution);
        if (address) setAddress(address);
        if (country) setCountry(country);
      }
    } catch (error) {
      console.error('Error fetching prefill details:', error);
    }
  };

  const fetchAcceptedPapers = async () => {
    try {
      const response = await api.get('/api/registration/accepted-papers');
      if (response.data.success) {
        setAcceptedPapers(response.data.papers);
      }
    } catch (error) {
      console.error('Error fetching accepted papers:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch your accepted papers'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMembershipStatus = async () => {
    try {
      const response = await api.get('/api/membership/check-membership');
      setMembershipStatus(response.data);
    } catch (error) {
      console.error('Error checking membership status:', error);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    const newSelected = new Set(selectedPapers);
    if (newSelected.has(paperId)) {
      newSelected.delete(paperId);
    } else {
      newSelected.add(paperId);
    }
    setSelectedPapers(newSelected);
  };

  const calculateTotalAmount = () => {
    const category = registrationCategories.find(cat => cat.id === registrationCategory);
    if (!category) return 0;
    
    const basePrice = category.price;
    const paperCount = selectedPapers.size;
    
    // Apply SCIS member discount if applicable
    const discount = membershipStatus?.isMember ? 0.1 : 0; // 10% discount for SCIS members
    
    let total = basePrice;
    
    // Additional charge for multiple papers (if any)
    if (paperCount > 1) {
      total = basePrice + (paperCount - 1) * (basePrice * 0.5); // 50% for additional papers
    }
    
    return total - (total * discount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPapers.size === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Papers Selected',
        text: 'Please select at least one paper to register'
      });
      return;
    }
    
    if (!institution || !address || !country) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields'
      });
      return;
    }
    
    if (!paymentScreenshot) {
      Swal.fire({
        icon: 'warning',
        title: 'Payment Proof Required',
        text: 'Please upload your payment screenshot'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add selected papers
      selectedPapers.forEach(paperId => {
        formData.append('selectedPapers', paperId);
      });
      
      // Add registration details
      formData.append('institution', institution);
      formData.append('address', address);
      formData.append('country', country);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      formData.append('registrationCategory', registrationCategory);
      formData.append('amount', calculateTotalAmount().toString());
      formData.append('paperCount', selectedPapers.size.toString());
      formData.append('paymentScreenshot', paymentScreenshot);
      
      const response = await api.post('/api/registration/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registration Submitted!',
          text: 'Your registration has been submitted successfully. Admin will verify your payment and confirm your registration.',
          confirmButtonColor: '#3085d6'
        });
        
        // Reset form
        setSelectedPapers(new Set());
        setInstitution('');
        setAddress('');
        setCountry('');
        setTransactionId('');
        setPaymentScreenshot(null);
      }
    } catch (error: any) {
      console.error('Registration submission error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.response?.data?.message || 'Failed to submit registration. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your accepted papers...</p>
        </div>
      </div>
    );
  }

  if (acceptedPapers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Accepted Papers</h2>
          <p className="text-gray-600 mb-4">
            You don't have any accepted papers yet. Please wait for the review process to complete.
          </p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the admin at icius2026@isius.org
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Author Registration</h1>
          <p className="text-gray-600">
            Select your accepted papers and complete your registration for ICIUS 2026
          </p>
        </div>

        {/* SCIS Membership Status */}
        {membershipStatus && (
          <div className={`mb-6 border-l-4 p-4 rounded ${membershipStatus.isMember
            ? 'bg-green-50 border-green-500'
            : 'bg-yellow-50 border-yellow-500'
            }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {membershipStatus.isMember ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="ml-3">
                {membershipStatus.isMember ? (
                  <>
                    <p className="text-sm font-bold text-green-800">
                      SCIS Member - 10% Discount Applied!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Membership ID: <span className="font-mono font-semibold">{membershipStatus.membershipId}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-yellow-800">
                    Not a SCIS Member - Standard Rates Apply
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paper Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FileText className="mr-2 text-blue-600" />
            Select Papers for Registration
          </h2>
          
          <div className="space-y-3">
            {acceptedPapers.map((paper, index) => {
              const isPaid = paper.paymentStatus === 'paid' || paper.paymentStatus === 'verified';
              const isPending = paper.paymentStatus === 'pending';
              const isRegistered = isPaid || isPending;
              return (
              <div
                key={paper.submissionId || index}
                className={`border rounded-lg p-4 transition-all ${
                  isRegistered ? 'border-gray-200 bg-gray-50 opacity-75' :
                  selectedPapers.has(paper.submissionId)
                    ? 'border-blue-500 bg-blue-50 cursor-pointer'
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
                onClick={() => !isRegistered && togglePaperSelection(paper.submissionId)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isRegistered ? 'border-gray-300 bg-gray-200' :
                      selectedPapers.has(paper.submissionId)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {(selectedPapers.has(paper.submissionId) || isRegistered) && (
                        <CheckCircle className={`w-3 h-3 ${isRegistered ? 'text-gray-500' : 'text-white'}`} />
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 flex justify-between items-center">
                    <div>
                      <p className={`font-medium ${isRegistered ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{paper.paperTitle}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {paper.submissionId} | {paper.category}
                      </p>
                    </div>
                    {isPaid && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Payment Recorded
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <User className="mr-2 text-blue-600" />
            Registration Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your institution name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Category <span className="text-red-500">*</span>
              </label>
              <select
                value={registrationCategory}
                onChange={(e) => setRegistrationCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {registrationCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} - {category.name.includes('Foreign') ? '$' : '₹'}{category.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your complete address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your country"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="bank-transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter transaction ID (if available)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload screenshot of your payment confirmation
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <CreditCard className="mr-2 text-blue-600" />
              Payment Summary
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Papers:</span>
                <span className="font-medium">{selectedPapers.size}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Base Registration:</span>
                <span className="font-medium">
                  {registrationCategories.find(cat => cat.id === registrationCategory)?.name.includes('Foreign') ? '$' : '₹'}
                  {registrationCategories.find(cat => cat.id === registrationCategory)?.price || 0}
                </span>
              </div>
              
              {selectedPapers.size > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Additional Papers:</span>
                  <span className="font-medium">
                    {registrationCategories.find(cat => cat.id === registrationCategory)?.name.includes('Foreign') ? '$' : '₹'}
                    {(selectedPapers.size - 1) * ((registrationCategories.find(cat => cat.id === registrationCategory)?.price || 0) * 0.5)}
                  </span>
                </div>
              )}
              
              {membershipStatus?.isMember && (
                <div className="flex justify-between text-green-600">
                  <span>SCIS Member Discount (10%):</span>
                  <span className="font-medium">
                    -{registrationCategories.find(cat => cat.id === registrationCategory)?.name.includes('Foreign') ? '$' : '₹'}
                    {(calculateTotalAmount() * 0.1 / (1 - 0.1)).toFixed(0)}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">
                    {registrationCategories.find(cat => cat.id === registrationCategory)?.name.includes('Foreign') ? '$' : '₹'}
                    {calculateTotalAmount()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Need Help?</strong> If you have any questions or face issues during registration, 
                  please contact us at <strong>icius2026@isius.org</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || selectedPapers.size === 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Registration...
              </>
            ) : (
              <>
                <Upload className="mr-2" size={20} />
                Submit Registration ({registrationCategories.find(cat => cat.id === registrationCategory)?.name.includes('Foreign') ? '$' : '₹'}{calculateTotalAmount()})
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthorRegistration;
