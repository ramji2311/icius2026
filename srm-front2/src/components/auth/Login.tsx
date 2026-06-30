import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Check, AlertCircle, Eye, EyeOff } from 'react-feather';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Swal from 'sweetalert2';
import api from '../../config/api';
import PageTransition from '../PageTransition';
import { useAuth } from '../../context/AuthContext';
// Remove unused imports
// import { auth } from "../config/firebase";
// import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    // Check if there's a verification token in the URL - improve token extraction
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const emailParam = params.get('email'); // Get email from URL parameter

    // Auto-fill email if provided in URL (from reviewer assignment email)
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    if (token) {
      console.log("Found token in URL:", token);
      setIsVerifying(true);
      verifyEmail(token);
    }
  }, [location]);



  const verifyEmail = async (token: string) => {
    try {
      setVerificationStatus({});


      // Log request details for debugging
      console.log(`Sending verification request with token: ${token}`);

      const response = await api.get(`/api/auth/verify/${token}`);

      console.log("Verification API response:", response.data);

      if (response.data.success) {
        setVerificationStatus({
          success: true,
          message: response.data.message || 'Email verified successfully!'
        });

        Swal.fire({
          icon: 'success',
          title: 'Email Verified',
          text: 'Your email has been verified successfully. You can now log in.',
          confirmButtonColor: '#F5A051'
        });
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error("Verification error details:", {
        error,
        response: error.response?.data,
        status: error.response?.status
      });

      setVerificationStatus({
        success: false,
        message: error.response?.data?.message || 'Invalid or expired verification link'
      });
    } finally {
      setIsVerifying(false);
      // Remove the token from URL to avoid confusion if page is refreshed
      window.history.replaceState({}, document.title, '/login');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {

      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      // If login was successful but verification is needed
      if (response.data.needsVerification) {
        Swal.fire({
          icon: 'warning',
          title: 'Email Not Verified',
          text: 'Please verify your email before logging in',
          confirmButtonColor: '#F5A051',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Resend Verification Email'
        }).then((result) => {
          if (result.isConfirmed) {
            resendVerificationEmail(email);
          }
        });
        setIsLoading(false);
        return;
      }

      if (response.data.success && response.data.verified) {
        // Persist lightweight flag and token for non-cookie / cross-domain scenarios
        localStorage.setItem('isAuthenticated', 'true');
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }

        // Refresh the global Auth context so Navbar and route guards update immediately
        await refresh();
        window.dispatchEvent(new Event('authStateChanged'));

        const returnUrl = localStorage.getItem('returnUrl');
        let redirectPath = returnUrl || '/dashboard';

        if (!returnUrl) {
          if (response.data.role === 'Reviewer') {
            redirectPath = '/reviewer';
          } else if (response.data.role === 'Editor' || response.data.role === 'Admin') {
            redirectPath = '/dashboard';
          } else if (response.data.role === 'Author') {
            redirectPath = '/author-dashboard';
          }
        }

        // Clear returnUrl after using it
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
        }

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'You are now logged in',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate(redirectPath);
        });
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.response?.data?.needsVerification) {
        Swal.fire({
          icon: 'warning',
          title: 'Email Not Verified',
          text: 'Please verify your email before logging in',
          confirmButtonColor: '#F5A051',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Resend Verification Email'
        }).then((result) => {
          if (result.isConfirmed) {
            resendVerificationEmail(email);
          }
        });
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || '';
        let userMessage = '';

        // Provide specific user-friendly messages based on error type
        if (errorMessage.includes('No account found') || errorMessage.includes('user not found')) {
          userMessage = "No account found with this email address. Please check your email or sign up for a new account.";
        } else if (errorMessage.includes('Incorrect password') || errorMessage.includes('password is incorrect')) {
          userMessage = "Incorrect password. Please try again or use the 'Forgot Password' option.";
        } else if (errorMessage.includes('Invalid email') || errorMessage.includes('email format')) {
          userMessage = "Invalid email format. Please enter a valid email address.";
        } else {
          userMessage = "Invalid email or password. Please check your credentials and try again.";
        }

        Swal.fire({
          icon: 'info',
          title: 'Login Failed',
          text: userMessage,
          confirmButtonColor: '#F5A051'
        });
      } else {
        // Handle other errors
        Swal.fire({
          icon: 'info',
          title: 'Login Failed',
          text: 'An error occurred while logging in. Please try again later.',
          confirmButtonColor: '#F5A051'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    setIsLoading(true);
    try {

      const response = await api.post('/api/auth/resend-verification', { email });
      Swal.fire({
        icon: 'success',
        title: 'Verification Email Sent',
        text: 'Please check your inbox and follow the verification link',
        confirmButtonColor: '#F5A051'
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      Swal.fire({
        icon: 'info',
        title: 'Failed to Resend',
        text: error.response?.data?.message || 'Could not send verification email',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Swal.fire({
      title: 'Reset Password',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'Email',
      confirmButtonColor: '#F5A051',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter your email';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {

          const response = await api.post('/api/auth/forgot-password', { email: result.value });

          if (response.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'OTP Sent',
              text: 'Check your email for the password reset OTP',
              confirmButtonColor: '#F5A051'
            });

            // Show OTP input dialog
            setTimeout(() => {
              promptForOTP(result.value);
            }, 1000);
          }
        } catch (error: any) {
          Swal.fire({
            icon: 'info',
            title: 'Request Failed',
            text: error.response?.data?.message || 'Failed to send password reset email',
            confirmButtonColor: '#F5A051'
          });
        }
      }
    });
  };

  const promptForOTP = (email: any) => {
    Swal.fire({
      title: 'Enter OTP',
      input: 'text',
      inputLabel: 'OTP sent to your email',
      inputPlaceholder: '6-digit OTP',
      confirmButtonColor: '#F5A051',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter the OTP';
        }
        if (value.length !== 6 || !/^\d+$/.test(value)) {
          return 'OTP must be 6 digits';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        promptForNewPassword(email, result.value);
      }
    });
  };

  const promptForNewPassword = (email: any, otp: any) => {
    Swal.fire({
      title: 'New Password',
      input: 'password',
      inputLabel: 'Enter your new password',
      inputPlaceholder: 'Password',
      confirmButtonColor: '#F5A051',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a new password';
        }
        if (value.length < 6) {
          return 'Password must be at least 6 characters long';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {

          const response = await api.post('/api/auth/reset-password', {
            email: email,
            otp: otp,
            newPassword: result.value
          });
          if (response.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Password Reset Successful',
              text: 'You can now log in with your new password',
              confirmButtonColor: '#F5A051'
            });
          }
        } catch (error: any) {
          Swal.fire({
            icon: 'info',
            title: 'Reset Failed',
            text: error.response?.data?.message || 'Invalid or expired OTP',
            confirmButtonColor: '#F5A051'
          });
        }
      }
    });
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5A051] mx-auto"></div>
          <p className="mt-4 text-lg">Verifying your email address...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-r from-red-50 to gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto" data-aos="fade-up">
          {/* Display verification status message if present */}
          {verificationStatus.message && (
            <div className={`mb-4 p-4 rounded-md ${verificationStatus.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
              <div className="flex">
                {verificationStatus.success ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <p>{verificationStatus.message}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                    placeholder="Enter your password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#F5A051] focus:ring-[#F5A051] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  className="text-sm font-medium text-[#F5A051] hover:text-[#e08c3e]"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F5A051] ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#e08c3e]'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5A051]`}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {/* Commented out Google sign-in functionality
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5A051]"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Sign in with Google
                </button>
                */}
              </div>
            </div>

            {/* Verification help section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <b>Having trouble logging in?</b>
              </p>
              <button
                onClick={() => {
                  if (email) {
                    resendVerificationEmail(email);
                  } else {
                    Swal.fire({
                      icon: 'info',
                      title: 'Email Required',
                      text: 'Please enter your email address first',
                      confirmButtonColor: '#F5A051'
                    });
                  }
                }}
                type="button"
                className="w-full text-left text-sm text-[#F5A051] hover:text-[#e08c3e]"
              >
                Resend verification email
              </button>
            </div>

            {/* Sign up link section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/signin"
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5A051]"
                >
                  Create a new account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;