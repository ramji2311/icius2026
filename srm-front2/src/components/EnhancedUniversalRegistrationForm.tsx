import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, Building, CheckCircle, Globe, FileText, AlertCircle, Check, X, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../config/api';
import upiqr from "./images/bali/qr.png"
import CountrySelector from './CountrySelector';



const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

interface PaperDetails {
    submissionId: string;
    paperTitle: string;
    authorName: string;
    authorEmail: string;
    category: string;
    paymentStatus: string;
}

interface UserInfo {
    name: string;
    email: string;
    country?: string;
    isAuthor: boolean;
    userType?: 'student' | 'faculty' | 'scholar' | null;
}

interface RegistrationCategory {
    id: string;
    label: string;
    price: number;
    societyDiscountPrice?: number;
    currency: string;
    description: string;
}

const EnhancedUniversalRegistrationForm: React.FC = React.memo(() => {
    const [registrationType, setRegistrationType] = useState<'author' | 'listener' | ''>('');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [paperDetails, setPaperDetails] = useState<PaperDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [userCountry, setUserCountry] = useState<string>(() => {
        // Initialize from localStorage immediately
        return localStorage.getItem('userCountry') || localStorage.getItem('country') || '';
    });
    const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'paypal' | 'external' | ''>('');
    const [paymentSubMethod, setPaymentSubMethod] = useState<'upi' | 'bank-account' | ''>('');
    const [transactionId, setTransactionId] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState(0);
    const [registrationStatus, setRegistrationStatus] = useState<any>(null);
    const [membershipStatus, setMembershipStatus] = useState<any>(null);
    const [loadingMembership, setLoadingMembership] = useState(true);
    const [institution, setInstitution] = useState('');
    const [address, setAddress] = useState('');
    const [listenerRegistration, setListenerRegistration] = useState<any>(null);
    const [loadingListenerStatus, setLoadingListenerStatus] = useState(true);

    // Get registration categories based on country and type
    const getRegistrationCategories = (): RegistrationCategory[] => {
        if (!userCountry) return [];

        const categories: RegistrationCategory[] = [];

        if (userCountry === 'India') {
            if (registrationType === 'author') {
                categories.push(
                    {
                        id: 'indian-student',
                        label: 'Indian Student',
                        price: 5850,
                        societyDiscountPrice: 4500,
                        currency: 'INR',
                        description: 'For undergraduate and postgraduate students'
                    },
                    {
                        id: 'indian-faculty',
                        label: 'Indian Faculty',
                        price: 7500,
                        societyDiscountPrice: 6750,
                        currency: 'INR',
                        description: 'For faculty members and professors'
                    },
                    {
                        id: 'indian-scholar',
                        label: 'Indian Research Scholar',
                        price: 7500,
                        societyDiscountPrice: 6750,
                        currency: 'INR',
                        description: 'For research scholars and PhD candidates'
                    }
                );
            } else {
                categories.push({
                    id: 'indian-listener',
                    label: 'Indian Listener/Attendee',
                    price: 3500,
                    societyDiscountPrice: 2500,
                    currency: 'INR',
                    description: 'For conference attendees without paper presentation'
                });
            }
        } else if (userCountry === 'Indonesia') {
            if (registrationType === 'author') {
                categories.push({
                    id: 'indonesian-author',
                    label: 'Indonesian Author',
                    price: 2600000,
                    currency: 'IDR',
                    description: 'For Indonesian authors presenting papers'
                });
            } else {
                categories.push({
                    id: 'indonesian-listener',
                    label: 'Indonesian Listener/Attendee',
                    price: 1500000,
                    currency: 'IDR',
                    description: 'For Indonesian conference attendees'
                });
            }
        } else { // Other countries
            if (registrationType === 'author') {
                categories.push({
                    id: 'foreign-author',
                    label: 'International Author',
                    price: 350,
                    currency: 'USD',
                    description: 'For international authors presenting papers'
                });
            } else {
                categories.push({
                    id: 'foreign-listener',
                    label: 'International Listener/Attendee',
                    price: 150,
                    currency: 'USD',
                    description: 'For international conference attendees'
                });
            }
        }

        return categories;
    };

    useEffect(() => {
        fetchUserInfo();
        checkMembershipStatus();
    }, []);

    // Auto-set registration type based on whether user has accepted paper
    useEffect(() => {
        if (userInfo) {
            if (userInfo.isAuthor) {
                if (registrationType !== 'author') {
                    setRegistrationType('author');
                }
            } else {
                if (registrationType !== 'listener') {
                    setRegistrationType('listener');
                }
            }
        }
    }, [userInfo]);

    // Auto-select category based on userType and country
    useEffect(() => {
        if (userInfo && userCountry && registrationType) {
            const categories = getRegistrationCategories();
            if (categories.length > 0) {
                // Determine best matching category based on userType
                let selectedCategoryId = categories[0].id;

                if (registrationType === 'author' && userCountry === 'India') {
                    if (userInfo.userType === 'student') {
                        selectedCategoryId = 'indian-student';
                    } else if (userInfo.userType === 'faculty') {
                        selectedCategoryId = 'indian-faculty';
                    } else if (userInfo.userType === 'scholar') {
                        selectedCategoryId = 'indian-scholar';
                    }
                }
                // For other countries or listeners, use the default (first) category

                // Find the matching category and call handleCategoryChange to set amount
                const matchingCategory = categories.find(c => c.id === selectedCategoryId);
                if (matchingCategory) {
                    handleCategoryChange(matchingCategory);
                } else {
                    // Fallback if no matching category found
                    setSelectedCategory(selectedCategoryId);
                    const price = (membershipStatus?.isMember && categories[0].societyDiscountPrice)
                        ? categories[0].societyDiscountPrice
                        : categories[0].price;
                    setAmount(price);
                }
            }
        }
    }, [userInfo, userCountry, registrationType, membershipStatus]);

    const fetchUserInfo = async () => {
        try {
            // First, fetch user's complete info from backend
            let userCountry = 'India'; // Default
            let actualUserName = '';

            try {
                const userResponse = await api.get('/api/auth/me');

                if (userResponse.data.success && userResponse.data.user) {
                    const user = userResponse.data.user;

                    // Get username from backend
                    actualUserName = user.username || '';

                    // Get country
                    if (user.country) {
                        userCountry = user.country;
                        setUserCountry(user.country);
                        localStorage.setItem('userCountry', user.country);
                    }
                }
            } catch (error) {
                // Fallback to localStorage
                const storedCountry = localStorage.getItem('userCountry') || localStorage.getItem('country');
                if (storedCountry) {
                    userCountry = storedCountry;
                    setUserCountry(storedCountry);
                }
                actualUserName = localStorage.getItem('username') || '';
            }

            // Then check if user has submitted papers
            try {
                const response = await api.get('/api/registration/my-paper-details');

                if (response.data && response.data.success) {
                    setPaperDetails(response.data.paperDetails);
                    const authorInfo = {
                        name: response.data.paperDetails.authorName,
                        email: response.data.paperDetails.authorEmail,
                        country: userCountry,
                        isAuthor: true
                    };
                    setUserInfo(authorInfo);
                }
            } catch (error: any) {
                // 404 means no accepted paper - user can register as listener (expected case)
                if (error.response?.status === 404) {
                    const listenerInfo = {
                        name: actualUserName || 'User',
                        email: '', // Backend should handle this
                        country: userCountry,
                        isAuthor: false
                    };
                    setUserInfo(listenerInfo);
                } else {
                    // Other errors should be logged
                    console.error('Error fetching paper details:', error);
                    const listenerInfo = {
                        name: actualUserName || localStorage.getItem('email') || 'User',
                        email: localStorage.getItem('email') || '',
                        country: userCountry,
                        isAuthor: false
                    };
                    setUserInfo(listenerInfo);
                }
            }
        } catch (error: any) {
            // Fallback to listener if anything fails (404 is normal for users without papers)
            if (error.response?.status !== 404) {
                console.error('Error fetching paper details:', error);
            }
            const fallbackInfo = {
                name: localStorage.getItem('username') || localStorage.getItem('email') || 'User',
                email: localStorage.getItem('email') || '',
                country: localStorage.getItem('userCountry') || 'India',
                isAuthor: false
            };
            setUserInfo(fallbackInfo);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrefillDetails = async () => {
        try {
            const response = await api.get('/api/registration/prefill-details');
            if (response.data.success && response.data.details) {
                const { institution, address, country } = response.data.details;
                if (institution) setInstitution(institution);
                if (address) setAddress(address);
                if (country) {
                    setUserCountry(country);
                    localStorage.setItem('userCountry', country);
                }
            }
        } catch (error) {
            console.error('Error fetching prefill details:', error);
        }
    };

    const checkRegistrationStatus = async () => {
        try {
            const response = await api.get('/api/registration/my-registration');

            if (response.data && response.data.success) {
                setRegistrationStatus(response.data.registration);
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error checking registration status:', error);
            }
        }
    };

    const checkMembershipStatus = async () => {
        try {
            setLoadingMembership(true);
            const response = await api.get('/api/membership/check-membership');
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
            setLoadingListenerStatus(true);
            const response = await api.get('/api/listener/my-listener-registration');

            console.log(' Listener registration response:', response.data);

            if (response.data && response.data.registration) {
                console.log('📋 Listener registration found:', response.data.registration);
                setListenerRegistration(response.data.registration);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log('ℹ️ No listener registration found (404)');
            } else {
                console.error('❌ Error checking listener registration:', error.response?.data || error.message);
            }
        } finally {
            setLoadingListenerStatus(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            checkRegistrationStatus();
            checkListenerRegistrationStatus();
            fetchPrefillDetails();
        }
    }, [userInfo]);

    const handleCountryChange = (country: string) => {
        setUserCountry(country);
        localStorage.setItem('userCountry', country);
        // Reset category selection when country changes
        setSelectedCategory('');
        setAmount(0);
    };

    const handleCategoryChange = (category: RegistrationCategory) => {
        setSelectedCategory(category.id);
        // Use society discount price if user is a member and discount is available
        const price = (membershipStatus?.isMember && category.societyDiscountPrice) 
            ? category.societyDiscountPrice 
            : category.price;
        setAmount(price);
    };

    const handlePayPalPayment = () => {
        window.open('https://www.paypal.com/ncp/payment/3Q9N4H9ZKX24A', '_blank');
    };

    const handleExternalPayment = () => {
        window.open('https://melangepublications.com/payment_details.php', '_blank');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!userCountry) {
            Swal.fire({
                icon: 'info',
                title: 'Country Required',
                text: 'Please select your country first',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (!registrationType) {
            Swal.fire({
                icon: 'info',
                title: 'Registration Type Required',
                text: 'Please select whether you are registering as an author or listener',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (!selectedCategory) {
            Swal.fire({
                icon: 'info',
                title: 'Category Required',
                text: 'Please select a registration category',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (registrationType === 'listener') {
            if (!institution || institution.trim() === '') {
                Swal.fire({
                    icon: 'info',
                    title: 'Institution Required',
                    text: 'Please enter your institution or organization name',
                    confirmButtonColor: '#dc2626',
                });
                return;
            }

            if (!address || address.trim() === '') {
                Swal.fire({
                    icon: 'info',
                    title: 'Address Required',
                    text: 'Please enter your complete address',
                    confirmButtonColor: '#dc2626',
                });
                return;
            }
        }

        if (!paymentMethod) {
            Swal.fire({
                icon: 'info',
                title: 'Payment Method Required',
                text: 'Please select a payment method',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'bank-transfer' && !paymentSubMethod) {
            Swal.fire({
                icon: 'info',
                title: 'Payment Option Required',
                text: 'Please select UPI or Bank Account',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'bank-transfer' && !paymentScreenshot) {
            Swal.fire({
                icon: 'info',
                title: 'Screenshot Required',
                text: 'Please upload your payment screenshot',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'paypal' && !transactionId) {
            Swal.fire({
                icon: 'info',
                title: 'Transaction ID Required',
                text: 'Please enter your PayPal transaction ID',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'paypal' && !paymentScreenshot) {
            Swal.fire({
                icon: 'info',
                title: 'Screenshot Required',
                text: 'Please upload your PayPal payment screenshot',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'external' && !transactionId) {
            Swal.fire({
                icon: 'info',
                title: 'Transaction ID Required',
                text: 'Please enter your Melange transaction ID',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'external' && !paymentScreenshot) {
            Swal.fire({
                icon: 'info',
                title: 'Screenshot Required',
                text: 'Please upload your payment screenshot from Melange',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Submitting Registration...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Route to different endpoints based on registration type
            const endpoint = registrationType === 'listener'
                ? '/api/listener/submit-listener'
                : '/api/registration/submit';

            // For author registration, redirect to proper paper selection page
            if (registrationType === 'author') {
                Swal.close();
                Swal.fire({
                    icon: 'info',
                    title: 'Author Registration',
                    html: `
                        <p>For author registration, please use the dedicated author registration page where you can:</p>
                        <ul class="text-left mt-3">
                            <li>✓ Select which papers to register</li>
                            <li>✓ See calculated pricing for multiple papers</li>
                            <li>✓ Upload payment proof</li>
                            <li>✓ Complete registration for selected papers</li>
                        </ul>
                        <p class="mt-3">Redirecting you to the author registration page...</p>
                    `,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                }).then(() => {
                    window.location.href = '/author-registration';
                });
                return;
            }

            // Build request body
            const requestBody: any = {
                paymentMethod,
                paymentSubMethod,
                transactionId: (transactionId || '').trim(),
                amount: Number(amount) || 0,  // Ensure amount is a number
                paymentScreenshot,
                registrationCategory: selectedCategory,
                country: userCountry,
            };

            // For listeners, include institution and address (with trimming and string conversion)
            if (registrationType === 'listener') {
                requestBody.institution = String(institution).trim();
                requestBody.address = String(address).trim();
            }

            console.log('🔍 Prepared request body:', requestBody);

            const response = await api.post(
                endpoint,
                requestBody
            );

            Swal.close();

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Submitted!',
                    html: `
                        <p>Your ${registrationType} registration has been submitted successfully!</p>
                        <p class="mt-2 text-sm text-gray-600">Please wait for admin verification of your payment.</p>
                        <p class="mt-2 text-sm text-gray-600">You will be notified once verified.</p>
                    `,
                    confirmButtonColor: '#dc2626',
                });

                // Reset form
                setPaymentMethod('');
                setPaymentSubMethod('');
                setTransactionId('');
                setPaymentScreenshot('');
                setSelectedCategory('');
                checkRegistrationStatus();
            }
        } catch (error: any) {
            Swal.close();
            console.error('Registration error:', error);

            Swal.fire({
                icon: 'info',
                title: 'Submission Failed',
                text: error.response?.data?.message || 'Failed to submit registration',
                confirmButtonColor: '#dc2626',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your details...</p>
                </div>
            </div>
        );
    }

    // Show registration status if already submitted
    if (registrationStatus && registrationStatus.paymentStatus !== 'rejected') {
        const statusColors = {
            pending: 'bg-yellow-50 border-yellow-500 text-yellow-800',
            verified: 'bg-green-50 border-green-500 text-green-800',
            rejected: 'bg-red-50 border-red-500 text-red-800'
        };

        const statusIcons = {
            pending: '...',
            verified: '✓',
            rejected: '✕'
        };

        return (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-full min-w-0">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Registration Status</h2>

                <div className={`border-l-4 p-6 rounded ${statusColors[registrationStatus.paymentStatus as keyof typeof statusColors]}`}>
                    <div className="flex items-center mb-4">
                        <span className="text-4xl mr-4">{statusIcons[registrationStatus.paymentStatus as keyof typeof statusIcons]}</span>
                        <div>
                            <h3 className="text-xl font-bold">
                                {registrationStatus.paymentStatus === 'pending' && 'Waiting for Admin Verification'}
                                {registrationStatus.paymentStatus === 'verified' && 'Registration Verified!'}
                                {registrationStatus.paymentStatus === 'rejected' && 'Registration Rejected'}
                            </h3>
                            <p className="text-sm mt-1">
                                {registrationStatus.paymentStatus === 'pending' && 'Your registration has been submitted successfully. Please wait while our admin team verifies your payment.'}
                                {registrationStatus.paymentStatus === 'verified' && 'Your payment has been verified! You will receive a confirmation email shortly.'}
                                {registrationStatus.paymentStatus === 'rejected' && 'Your payment was rejected. Please contact support for more information.'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white bg-opacity-50 p-4 rounded mt-4 space-y-2">
                        <p><strong>Name:</strong> {registrationStatus.authorName}</p>
                        {registrationStatus.paperTitle && <p><strong>Paper:</strong> {registrationStatus.paperTitle}</p>}
                        <p><strong>Amount:</strong> {registrationStatus.amount} {registrationStatus.currency || 'INR'}</p>
                        <p><strong>Payment Method:</strong> {registrationStatus.paymentMethod}</p>
                        <p><strong>Registration Type:</strong> {registrationStatus.registrationType || 'Author'}</p>
                        <p><strong>Submitted:</strong> {new Date(registrationStatus.registrationDate).toLocaleDateString()}</p>
                        {registrationStatus.verifiedAt && (
                            <p><strong>Verified:</strong> {new Date(registrationStatus.verifiedAt).toLocaleDateString()}</p>
                        )}
                        {registrationStatus.rejectionReason && (
                            <p className="text-red-700"><strong>Reason:</strong> {registrationStatus.rejectionReason}</p>
                        )}
                    </div>

                    {registrationStatus.paymentStatus === 'pending' && (
                        <div className="mt-6 p-4 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>📧 Email Notification:</strong> Once your payment is verified, we will send you a confirmation email with your registration details.
                            </p>
                        </div>
                    )}

                    {userInfo?.isAuthor && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-bold mb-2 text-gray-800">Have other accepted papers?</h3>
                            <p className="text-gray-600 mb-4 text-sm">If you have multiple accepted papers, you can register for the remaining ones.</p>
                            <button
                                onClick={() => window.location.href = '/author-registration'}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow transition duration-200"
                            >
                                Register Other Papers
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show rejected registration with resubmit option
    if (registrationStatus && registrationStatus.paymentStatus === 'rejected') {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-full min-w-0">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Registration Status</h2>

                <div className="border-l-4 border-red-500 bg-red-50 p-6 rounded mb-6">
                    <div className="flex items-start mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-4">
                            <X size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-red-800">Registration Rejected</h3>
                            <p className="text-sm text-red-700 mt-1">
                                Your payment could not be verified. Please review the reason below and try again with a different payment method.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white bg-opacity-50 p-4 rounded mt-4 space-y-2 mb-4">
                        <p><strong>Name:</strong> {registrationStatus.authorName}</p>
                        {registrationStatus.paperTitle && <p><strong>Paper:</strong> {registrationStatus.paperTitle}</p>}
                        <p><strong>Amount:</strong> {registrationStatus.amount} {registrationStatus.currency || 'INR'}</p>
                        <p><strong>Previous Payment Method:</strong> {registrationStatus.paymentMethod}</p>
                        <p><strong>Registration Type:</strong> {registrationStatus.registrationType || 'Author'}</p>
                        <p><strong>Submitted:</strong> {new Date(registrationStatus.registrationDate).toLocaleDateString()}</p>
                        <p><strong>Reviewed:</strong> {new Date(registrationStatus.verifiedAt).toLocaleDateString()}</p>
                        {registrationStatus.rejectionReason && (
                            <p className="text-red-700 font-semibold"><strong>Reason for Rejection:</strong> {registrationStatus.rejectionReason}</p>
                        )}
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                        <p className="text-sm text-yellow-800">
                            <strong>💡 Tip:</strong> Try using a different payment method or ensure your payment details are correct.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => {
                            setRegistrationStatus(null);
                            setPaymentMethod('');
                            setPaymentSubMethod('');
                            setTransactionId('');
                            setPaymentScreenshot('');
                            setSelectedCategory('');
                            setAmount(0);
                        }}
                        className="flex items-center justify-center w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
                    >
                        <ArrowRight className="mr-2" /> Resubmit Registration
                    </button>
                    <p className="text-center text-sm text-gray-600">
                        Clear the form and try again with a different payment method
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-full min-w-0">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Conference Registration</h2>

            {/* Country Selection */}
            {!userCountry && (
                <div className="mb-8">
                    <CountrySelector onCountryChange={handleCountryChange} showAsModal={false} />
                </div>
            )}

            {userCountry && (
                <div className="mb-6">
                    <CountrySelector onCountryChange={handleCountryChange} showAsModal={false} />
                </div>
            )}

            {/* User Info Section */}
            {userInfo && userCountry && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
                    <h3 className="font-bold text-lg mb-4 text-blue-900">Your Information</h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {userInfo.name}</p>
                        <p><strong>Email:</strong> {userInfo.email}</p>
                        <p><strong>Country:</strong> <span className="text-blue-600 font-semibold">{userCountry}</span></p>
                    </div>
                </div>
            )}

            {/* Author Status Banner */}
            {userInfo?.isAuthor && registrationType === 'author' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-bold text-blue-800">
                                ✓ Author Registration
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                You have an accepted paper. Complete your author registration to present at the conference.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* SCIS Membership Status */}
            {!loadingMembership && membershipStatus && userCountry && (
                <div className={`border-l-4 p-4 rounded mb-6 ${membershipStatus.isMember
                    ? 'bg-green-50 border-green-500'
                    : 'bg-yellow-50 border-yellow-500'
                    }`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {membershipStatus.isMember ? (
                                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
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
                                        You will see discounted member rates below.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-yellow-800">
                                        Non-SCIS Member
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Standard registration fees apply. Become a SCIS member to save on registration!
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Listener Registration Status */}
            {!loadingListenerStatus && listenerRegistration && registrationType === 'listener' && (
                <div className={`border-l-4 p-4 rounded mb-6 ${listenerRegistration.paymentStatus === 'verified'
                    ? 'bg-green-50 border-green-500'
                    : listenerRegistration.paymentStatus === 'rejected'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {listenerRegistration.paymentStatus === 'verified' ? (
                                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : listenerRegistration.paymentStatus === 'rejected' ? (
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            )}
                        </div>
                        <div className="ml-3 flex-1">
                            {listenerRegistration.paymentStatus === 'verified' ? (
                                <>
                                    <p className="text-sm font-bold text-green-800">
                                         Listener Registration Verified
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Your registration and payment have been verified. Thank you for registering as a listener!
                                    </p>
                                    <p className="text-xs text-green-700 mt-2">
                                        <strong>Registration Number:</strong> {listenerRegistration.registrationNumber}
                                    </p>
                                </>
                            ) : listenerRegistration.paymentStatus === 'rejected' ? (
                                <>
                                    <p className="text-sm font-bold text-red-800">
                                        ❌ Payment Rejected
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                        <strong>Reason:</strong> {listenerRegistration.rejectionReason || 'Please contact admin for details'}
                                    </p>
                                    <p className="text-xs text-red-700 mt-2">
                                        You can submit a new registration with corrected payment details. Your previous payment amount was ₹{listenerRegistration.amount}.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setListenerRegistration(null);
                                            Swal.fire({
                                                icon: 'info',
                                                title: 'Resubmit Registration',
                                                text: 'You can now resubmit your listener registration with the corrected payment details.',
                                                confirmButtonColor: '#2563eb',
                                            });
                                        }}
                                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition"
                                    >
                                        Resubmit Registration
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-blue-800">
                                        ⏳ Registration Pending
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Your listener registration is under review. We will notify you once your payment is verified.
                                    </p>
                                    <p className="text-xs text-blue-700 mt-2">
                                        <strong>Payment Status:</strong> Awaiting Verification
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Verified Listener Registration Details */}
            {!loadingListenerStatus && listenerRegistration && listenerRegistration.paymentStatus === 'verified' && registrationType === 'listener' && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-green-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                                    <CheckCircle className="text-white" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Registration Confirmed</h3>
                                    <p className="text-green-100 text-sm mt-1">Your listener registration is verified and active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 bg-white">
                        {/* Registration Number - Highlight */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
                            <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Registration Number</p>
                            <p className="text-3xl font-bold text-blue-600 font-mono mt-2">{listenerRegistration.registrationNumber}</p>
                            <p className="text-xs text-gray-500 mt-2">Use this number for all conference communications</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Personal Information Card */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                                    👤 Personal Information
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Full Name</p>
                                        <p className="text-base text-gray-800 font-medium mt-1">{listenerRegistration.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Email Address</p>
                                        <p className="text-base text-blue-600 font-medium mt-1">{listenerRegistration.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Country</p>
                                        <p className="text-base text-gray-800 font-medium mt-1">{listenerRegistration.country}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Institution Card */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500">
                                    🏢 Organization Details
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Institution/Organization</p>
                                        <p className="text-base text-gray-800 font-medium mt-1">{listenerRegistration.institution}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Complete Address</p>
                                        <p className="text-base text-gray-800 font-medium mt-1 leading-relaxed">{listenerRegistration.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Registration Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Payment Card */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
                                    💳 Payment Information
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                        <p className="text-sm text-gray-600">Amount Paid:</p>
                                        <p className="text-2xl font-bold text-green-600">₹{listenerRegistration.amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Payment Method</p>
                                        <p className="text-base text-gray-800 font-medium mt-1 bg-blue-50 p-2 rounded">
                                            {listenerRegistration.paymentMethod?.replace('-', ' ').toUpperCase()}
                                        </p>
                                    </div>
                                    {listenerRegistration.transactionId && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Transaction ID</p>
                                            <p className="text-sm text-gray-800 font-mono mt-1 bg-gray-100 p-2 rounded break-all">{listenerRegistration.transactionId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Registration Category Card */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-500">
                                    📋 Registration Details
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Category</p>
                                        <p className="text-base text-gray-800 font-medium mt-1 bg-orange-50 p-2 rounded">
                                            {listenerRegistration.registrationCategory?.replace(/-/g, ' ').toUpperCase()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Membership Status</p>
                                        <p className="text-base font-medium mt-1">
                                            {listenerRegistration.isScisMember ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">✓ SCIS Member</span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Non-SCIS Member</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verification Status */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Status</p>
                                    <p className="text-lg font-bold text-green-600 mt-1"> Verified</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Verified On</p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{new Date(listenerRegistration.verifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                {listenerRegistration.certificateNumber && (
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Certificate</p>
                                        <p className="text-sm font-mono text-blue-600 mt-1 break-all">{listenerRegistration.certificateNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Paper Details for Authors */}
            {registrationType === 'author' && paperDetails && (
                <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded">
                    <h3 className="font-bold text-lg mb-4 text-green-900 flex items-center">
                        <FileText className="mr-2" size={20} />
                        Your Paper Details
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>Submission ID:</strong> {paperDetails.submissionId}</p>
                        <p><strong>Paper Title:</strong> {paperDetails.paperTitle}</p>
                        <p><strong>Category:</strong> {paperDetails.category}</p>
                    </div>
                </div>
            )}

            {/* Institutional Details - Shared for all registration types */}
            {registrationType && (!listenerRegistration || listenerRegistration.paymentStatus === 'rejected') && (
                <div className="mb-8 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Building size={20} className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Professional Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Institution/Organization <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={institution}
                                onChange={(e) => setInstitution(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                                placeholder="Enter your institution name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Country <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={userCountry}
                                    readOnly
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                                    placeholder="Country (set above)"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Complete Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                            placeholder="Enter your complete correspondence address"
                            rows={3}
                            required
                        />
                    </div>
                </div>
            )}

            {/* Rest of the form continues... */}
            {registrationType && userCountry && (!listenerRegistration || listenerRegistration.paymentStatus !== 'verified') && (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-4">
                            Select Registration Category <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                            {getRegistrationCategories().map((category) => {
                                const price = (membershipStatus?.isMember && category.societyDiscountPrice) 
                                    ? category.societyDiscountPrice 
                                    : category.price;
                                const savings = category.societyDiscountPrice ? category.price - category.societyDiscountPrice : 0;

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => handleCategoryChange(category)}
                                        className={`p-6 rounded-xl border-2 transition-all text-left ${selectedCategory === category.id
                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                            : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">{category.label}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {category.currency === 'INR' ? '₹' : category.currency === 'IDR' ? 'Rp ' : '$'}
                                                    {price.toLocaleString()}
                                                </p>
                                                {membershipStatus?.isMember && category.societyDiscountPrice && (
                                                    <p className="text-xs text-green-600 mt-2">
                                                        <span className="line-through text-gray-400">
                                                            {category.currency === 'INR' ? '₹' : category.currency === 'IDR' ? 'Rp ' : '$'}
                                                            {category.price.toLocaleString()}
                                                        </span>
                                                        {' '}Save {category.currency === 'INR' ? '₹' : category.currency === 'IDR' ? 'Rp ' : '$'}{savings.toLocaleString()} with Society Membership!
                                                    </p>
                                                )}
                                                {!membershipStatus?.isMember && category.societyDiscountPrice && userCountry === 'India' && (
                                                    <p className="text-xs text-blue-600 mt-2">
                                                        💡 Register to Society for Cyber Intelligent Systems to save {category.currency === 'INR' ? '₹' : category.currency === 'IDR' ? 'Rp ' : '$'}{savings.toLocaleString()}!
                                                    </p>
                                                )}
                                            </div>
                                            {selectedCategory === category.id && (
                                                <CheckCircle className="h-6 w-6 text-blue-500" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Method Selection - Similar to original */}
                    {selectedCategory && (
                        <div className="space-y-6">
                            <label className="block text-sm font-semibold text-gray-800">
                                <CreditCard className="inline h-4 w-4 mr-2 text-red-500" />
                                Select Payment Method <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('bank-transfer')}
                                    className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'bank-transfer'
                                        ? 'border-red-500 bg-red-50 shadow-lg'
                                        : 'border-gray-200 hover:border-red-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-center mb-3">
                                        <div className={`p-3 rounded-lg ${paymentMethod === 'bank-transfer' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                            <Building className="h-8 w-8 text-red-500" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Bank Transfer</h3>
                                    <p className="text-sm text-gray-600">UPI or Bank Account</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'paypal'
                                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-center mb-3">
                                        <div className={`p-3 rounded-lg ${paymentMethod === 'paypal' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <CreditCard className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">PayPal</h3>
                                    <p className="text-sm text-gray-600">Credit Card / PayPal</p>
                                    {userCountry !== 'India' && (
                                        <p className="text-xs text-blue-600 mt-1">Recommended for international participants</p>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('external')}
                                    className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'external'
                                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                                        : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-center mb-3">
                                        <div className={`p-3 rounded-lg ${paymentMethod === 'external' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                            <Globe className="h-8 w-8 text-purple-500" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Melange Portal</h3>
                                    <p className="text-sm text-gray-600">External Payment</p>
                                </button>
                            </div>

                            {/* Bank Transfer Sub-options */}
                            {paymentMethod === 'bank-transfer' && (
                                <div className="space-y-6">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Choose Payment Option <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentSubMethod('upi')}
                                            className={`p-6 rounded-xl border-2 transition-all ${paymentSubMethod === 'upi'
                                                ? 'border-green-500 bg-green-50 shadow-lg'
                                                : 'border-gray-200 hover:border-green-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center mb-3">
                                                <div className={`p-3 rounded-lg ${paymentSubMethod === 'upi' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    <Globe className="h-8 w-8 text-green-500" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">UPI Payment</h3>
                                            <p className="text-sm text-gray-600">Scan QR Code</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentSubMethod('bank-account')}
                                            className={`p-6 rounded-xl border-2 transition-all ${paymentSubMethod === 'bank-account'
                                                ? 'border-green-500 bg-green-50 shadow-lg'
                                                : 'border-gray-200 hover:border-green-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center mb-3">
                                                <div className={`p-3 rounded-lg ${paymentSubMethod === 'bank-account' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    <Building className="h-8 w-8 text-green-500" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">Bank Account</h3>
                                            <p className="text-sm text-gray-600">Direct Transfer</p>
                                        </button>
                                    </div>

                                    {/* UPI QR Code */}
                                    {paymentSubMethod === 'upi' && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-200">
                                            <h3 className="text-xl font-bold text-center mb-4">Scan QR Code to Pay</h3>
                                            <div className="flex justify-center mb-4">
                                                <div className="bg-white p-4 rounded-xl shadow-lg">
                                                    <img
                                                        src={upiqr}
                                                        alt="UPI Payment QR Code"
                                                        className="w-80 h-80 object-contain"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="font-semibold text-gray-800">UPI ID: eazypay.0000029676@icici</p>
                                                <p className="text-sm text-gray-600">Use any UPI app (PhonePe, Google Pay, Paytm, etc.)</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bank Account Details */}
                                    {paymentSubMethod === 'bank-account' && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200">
                                            <h3 className="text-xl font-bold text-center mb-6">Bank Account Details</h3>
                                            <div className="space-y-4 max-w-md mx-auto">
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">Account Name:</span>
                                                    <span className="font-bold">Melange Publications</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">Account Number:</span>
                                                    <span className="font-bold">736805000791</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">Account Type:</span>
                                                    <span className="font-bold">Current Account</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">Bank Name:</span>
                                                    <span className="font-bold">ICICI Bank</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">IFSC Code:</span>
                                                    <span className="font-bold">ICIC0007368</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">SWIFT Code:</span>
                                                    <span className="font-bold">ICICIN BBCTS</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                    <span className="font-semibold text-gray-600">Branch:</span>
                                                    <span className="font-bold">Villianur, Puducherry</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Transaction ID and Screenshot */}
                                    {paymentSubMethod && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-gray-800">
                                                    Transaction ID / Reference Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                    placeholder="Enter your transaction ID"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-gray-800">
                                                    Upload Payment Screenshot <span className="text-red-500">*</span>
                                                </label>
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-all">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            try {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const compressed = await compressImage(file);
                                                                    setPaymentScreenshot(compressed);
                                                                }
                                                            } catch (error) {
                                                                Swal.fire({
                                                                    icon: 'info',
                                                                    title: 'Upload Failed',
                                                                    text: 'Failed to upload screenshot',
                                                                    confirmButtonColor: '#dc2626',
                                                                });
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id="payment-screenshot"
                                                    />
                                                    <label htmlFor="payment-screenshot" className="cursor-pointer">
                                                        {paymentScreenshot ? (
                                                            <div className="space-y-3">
                                                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                                                <p className="text-sm font-semibold text-green-600">Screenshot uploaded!</p>
                                                                <div className="mt-4 border-2 border-green-200 rounded-lg p-2 bg-green-50">
                                                                    <img
                                                                        src={paymentScreenshot}
                                                                        alt="Payment Screenshot"
                                                                        className="max-h-40 mx-auto rounded"
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-500">Click to change</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                                                                <p className="text-sm font-semibold text-gray-700">Click to upload payment screenshot</p>
                                                                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* PayPal Payment */}
                            {paymentMethod === 'paypal' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border-2 border-blue-300">
                                        <h3 className="text-xl font-bold text-center mb-4">PayPal Payment</h3>
                                        <p className="text-center text-gray-700 mb-6">
                                            Click the button below to proceed to PayPal for secure payment
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handlePayPalPayment}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                        >
                                            Pay with PayPal - {amount.toLocaleString()} {getRegistrationCategories().find(c => c.id === selectedCategory)?.currency}
                                        </button>
                                        <p className="text-center text-sm text-gray-600 mt-4">
                                            After successful payment on PayPal, return here and fill in your details below
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-800">
                                            Transaction ID / Reference Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your PayPal transaction ID"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-800">
                                            Upload Payment Screenshot <span className="text-red-500">*</span>
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    try {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const compressed = await compressImage(file);
                                                            setPaymentScreenshot(compressed);
                                                        }
                                                    } catch (error) {
                                                        Swal.fire({
                                                            icon: 'info',
                                                            title: 'Upload Failed',
                                                            text: 'Failed to upload screenshot',
                                                            confirmButtonColor: '#dc2626',
                                                        });
                                                    }
                                                }}
                                                className="hidden"
                                                id="paypal-screenshot"
                                            />
                                            <label htmlFor="paypal-screenshot" className="cursor-pointer">
                                                {paymentScreenshot ? (
                                                    <div className="space-y-3">
                                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                                        <p className="text-sm font-semibold text-green-600">Screenshot uploaded!</p>
                                                        <div className="mt-4 border-2 border-green-200 rounded-lg p-2 bg-green-50">
                                                            <img
                                                                src={paymentScreenshot}
                                                                alt="Payment Screenshot"
                                                                className="max-h-40 mx-auto rounded"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500">Click to change</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                                                        <p className="text-sm font-semibold text-gray-700">Click to upload payment screenshot</p>
                                                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* External Payment Portal */}
                            {paymentMethod === 'external' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border-2 border-purple-300">
                                        <h3 className="text-xl font-bold text-center mb-4">Melange Publications Payment Portal</h3>
                                        <p className="text-center text-gray-700 mb-6">
                                            Click the button below to visit the Melange Publications payment portal
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleExternalPayment}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                        >
                                            Go to Melange Publications
                                        </button>
                                        <p className="text-center text-sm text-gray-600 mt-4">
                                            After successful payment, return here and fill in your details below
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-800">
                                            Transaction ID / Reference Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Enter your Melange transaction ID"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-800">
                                            Upload Payment Screenshot <span className="text-red-500">*</span>
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-all">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    try {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const compressed = await compressImage(file);
                                                            setPaymentScreenshot(compressed);
                                                        }
                                                    } catch (error) {
                                                        Swal.fire({
                                                            icon: 'info',
                                                            title: 'Upload Failed',
                                                            text: 'Failed to upload screenshot',
                                                            confirmButtonColor: '#dc2626',
                                                        });
                                                    }
                                                }}
                                                className="hidden"
                                                id="external-screenshot"
                                            />
                                            <label htmlFor="external-screenshot" className="cursor-pointer">
                                                {paymentScreenshot ? (
                                                    <div className="space-y-3">
                                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                                        <p className="text-sm font-semibold text-green-600">Screenshot uploaded!</p>
                                                        <div className="mt-4 border-2 border-green-200 rounded-lg p-2 bg-green-50">
                                                            <img
                                                                src={paymentScreenshot}
                                                                alt="Payment Screenshot"
                                                                className="max-h-40 mx-auto rounded"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500">Click to change</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                                                        <p className="text-sm font-semibold text-gray-700">Click to upload payment screenshot</p>
                                                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    {selectedCategory && paymentMethod && (
                        (paymentMethod === 'bank-transfer' && paymentSubMethod && paymentScreenshot) ||
                        (paymentMethod === 'paypal' && transactionId && paymentScreenshot) ||
                        (paymentMethod === 'external' && transactionId && paymentScreenshot)
                    ) && (
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300"
                            >
                                Submit Registration
                            </button>
                        )}
                </form>
            )}
        </div>
    );
});

export default EnhancedUniversalRegistrationForm;
