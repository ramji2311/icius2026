import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Swal from 'sweetalert2';
import Select from 'react-select';
// Remove unused imports
// import { auth } from "../config/firebase";
// import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, Building } from 'lucide-react';
import PageTransition from '../PageTransition';
import { ALL_COUNTRIES } from '../../utils/countries';
import api from '../../config/api';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("");
  const [userType, setUserType] = useState("");
  const [institution, setInstitution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!email || !password || !country || !userType || !institution) {
        Swal.fire({
          icon: 'info',
          title: 'Missing Information',
          text: 'Please fill in all required fields. Email, password, country, institution, and professional category are mandatory.',
          timer: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Swal.fire({
          icon: 'info',
          title: 'Invalid Email Format',
          text: 'Please enter a valid email address (e.g., user@example.com)',
          confirmButtonColor: '#F5A051',
        });
        setIsSubmitting(false);
        return;
      }

      // Password strength validation
      if (password.length < 6) {
        Swal.fire({
          icon: 'info',
          title: 'Password Requirements',
          text: 'Password must be at least 6 characters long and contain both uppercase and lowercase letters',
          confirmButtonColor: '#F5A051',
        });
        setIsSubmitting(false);
        return;
      }

      // Check for password complexity (optional but recommended)
      if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
        Swal.fire({
          icon: 'info',
          title: 'Password Requirements',
          text: 'Password must contain both uppercase and lowercase letters',
          confirmButtonColor: '#F5A051',
        });
        setIsSubmitting(false);
        return;
      }


      const response = await api.post('/api/auth/signin', {
        email,
        password,
        country,
        userType,
        institution
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Account Created Successfully!',
          text: 'A verification email has been sent to your email address. Please check your inbox and follow the verification link to complete the registration process.',
          confirmButtonColor: '#F5A051',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
      } else {
        // This block might not be hit depends on interceptor, but keep for safety
        throw new Error(response.data.message || 'Signup failed');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || 'Unable to create account';
      
      if (errorMessage.includes("User already exists") || errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        Swal.fire({
          icon: 'info',
          title: 'Account Already Exists',
          text: 'An account with this email already exists. Please use a different email or try logging in.',
          confirmButtonColor: '#F5A051',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Go to Login'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
      } else if (errorMessage.includes("Invalid email") || errorMessage.includes("email format")) {
        Swal.fire({
          icon: 'info',
          title: 'Invalid Email Format',
          text: 'Please enter a valid email address (e.g., user@example.com)',
          confirmButtonColor: '#F5A051',
        });
      } else if (errorMessage.includes("Password") || errorMessage.includes("password")) {
        Swal.fire({
          icon: 'info',
          title: 'Password Requirements',
          text: 'Password must be at least 6 characters long and contain both uppercase and lowercase letters',
          confirmButtonColor: '#F5A051',
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Signup Failed',
          text: errorMessage || 'Unable to create account. Please try again later.',
          confirmButtonColor: '#F5A051',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete the unused Google sign-in functions
  // handleGoogleSignIn and getErrorMessage functions removed

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-150 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto" data-aos="fade-up">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
              <p className="text-gray-600">Join our community today</p>
            </div>

            {/* Add verification info banner */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After signing up, you'll need to verify your email address before logging in.
                Please check your inbox for a verification link.
              </p>
            </div>

            {/* Commented out Google sign-in functionality
            <div className="mb-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                Sign up with Google
              </button>
            </div>
            */}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <p className="text-xs text-gray-500 mb-2">
                  Type to search for your country
                </p>
                <Select
                  options={ALL_COUNTRIES.map(c => ({ value: c.value, label: c.label }))}
                  value={country ? { value: country, label: ALL_COUNTRIES.find(c => c.value === country)?.label || country } : null}
                  onChange={(option) => option && setCountry(option.value)}
                  isSearchable={true}
                  placeholder="🔍 Type to search for your country..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      padding: '2px',
                      borderRadius: '8px',
                      borderColor: state.isFocused ? '#F5A051' : '#d1d5db',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(245, 160, 81, 0.2)' : 'none',
                      '&:hover': {
                        borderColor: '#F5A051'
                      }
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#F5A051' : state.isFocused ? '#fef3e2' : 'white',
                      color: state.isSelected ? 'white' : '#1f2937',
                      cursor: 'pointer',
                      '&:active': {
                        backgroundColor: '#F5A051'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: '8px',
                      marginTop: '4px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    })
                  }}
                  className="text-base"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This helps us show you the correct registration fees
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution/Organization</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your university or organization"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Category</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  required
                >
                  <option value="">Select your professional category</option>
                  <option value="student">Student - Pursuing Bachelor's or Master's degree</option>
                  <option value="faculty">Faculty - Academic faculty member or professor</option>
                  <option value="scholar">Research Scholar - PhD candidate or postdoctoral researcher</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This helps us apply the correct registration fee for your category
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-[#F5A051]"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#F5A051] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#e08c3e]'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#F5A051] hover:text-[#e08c3e]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}