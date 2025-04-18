import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import logoWhite from '../assets/images/logo-white.svg';
import ResetPasswordDialog from '../components/ResetPasswordDialog';
import logoGoogle from '../assets/google.svg';
import { setCookie, getCookie, removeCookie } from '../utils/cookieUtils';

// Declare global Facebook SDK types
declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
    };
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetOption, setShowResetOption] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    // Check for saved credentials in cookies
    const savedEmail = getCookie('savedEmail');
    const savedPassword = getCookie('savedPassword');
    
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Initialize Facebook SDK
  useEffect(() => {
    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      if (window.FB) {
        window.FB.init({
          appId: '1551008789077882', // Replace with your actual Facebook App ID
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      }
    };

    // Load Facebook SDK
    const loadFacebookSDK = () => {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    };

    loadFacebookSDK();
  }, []);

  const getFirebaseErrorMessage = (error: any) => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format. Please check your email.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return 'An error occurred during login. Please try again.';
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        // Use cookies for more secure and persistent storage
        setCookie('savedEmail', email, { expires: 30 });
        setCookie('savedPassword', password, { expires: 30 });
        
        // Store user authentication info
        if (userCredential.user) {
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName
          };
          
          // Store non-sensitive user data for quick access
          setCookie('userData', userData, { expires: 30 });
        }
      } else {
        // Remove cookies if remember me is not checked
        removeCookie('savedEmail');
        removeCookie('savedPassword');
        removeCookie('userData');
      }
      
      // Login successful
      navigate('/');
    } catch (error: any) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (rememberMe && result.user) {
        // Store non-sensitive user data for quick access
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        };
        
        setCookie('userData', userData, { expires: 30 });
      }
      
      // Login successful
      navigate('/');
    } catch (error: any) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email'); // Request email permission
      provider.addScope('public_profile'); // Request basic profile info
      
      const result = await signInWithPopup(auth, provider);
      
      if (rememberMe && result.user) {
        // Store non-sensitive user data for quick access
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        };
        
        setCookie('userData', userData, { expires: 30 });
      }
      
      // Login successful
      navigate('/');
    } catch (error: any) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              Find your sports buddy in seconds
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Create your own private or public sports event or join other. Any sport, any date
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-black rounded-xl p-4 font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <img src={logoGoogle} alt="Google" className="h-5 mr-3" />
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                'Continue with Google'
              )}
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={isLoading}
              className="w-full bg-[#1877F2] text-white rounded-xl p-4 font-medium hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
              </svg>
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Signing in with Facebook...</span>
                </>
              ) : (
                'Continue with Facebook'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#121212] text-gray-400">Or continue with email</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="w-full bg-[#C1FF2F] text-black rounded-xl p-4 font-medium hover:bg-[#B1EF1F] transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Please wait...</span>
                  </>
                ) : (
                  'Join now'
                )}
              </button>
            </div>

            <p className="text-center">
              <span className="text-gray-400">Don't have an account? </span>
              <button 
                onClick={() => navigate('/register')}
                className="text-[#C1FF2F] hover:underline font-medium"
              >
                Create new
              </button>
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              Login to your account
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Enter your password to continue
            </p>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-[#C1FF2F] focus:ring-[#C1FF2F] border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="ml-auto text-sm text-[#C1FF2F] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C1FF2F] text-black rounded-xl p-4 font-medium hover:bg-[#B1EF1F] transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Signing in...</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#121212] text-gray-400">Or sign in with</span>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-black rounded-xl p-4 font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <img src={logoGoogle} alt="Google" className="h-5 mr-3" />
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  'Continue with Google'
                )}
              </button>

              <button
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="w-full bg-[#1877F2] text-white rounded-xl p-4 font-medium hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
                </svg>
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Signing in with Facebook...</span>
                  </>
                ) : (
                  'Continue with Facebook'
                )}
              </button>
            </div>

            <p className="text-center">
              <span className="text-gray-400">Don't have an account? </span>
              <button 
                onClick={() => navigate('/register')}
                className="text-[#C1FF2F] hover:underline font-medium"
              >
                Create new
              </button>
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#121212] grid md:grid-cols-2">
        {/* Left Column - Form */}
        <div className="flex flex-col p-8">
          <div className="flex items-center mb-12">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-white hover:text-[#C1FF2F] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <img src={logoWhite} alt="Logo" className="h-8" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              {renderStep()}
            </div>
          </div>
        </div>

        {/* Right Column - Phone Mockup */}
        <div className="hidden md:block relative bg-[#CDEA68] overflow-hidden p-16">
          <img
            src={"https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/iMockup%20-%20iPhone%2015%20Pro%20Max-2.png?alt=media&token=d8d661f7-e2f7-4710-8f13-3719e8a4945b"}
            alt="App preview"
            className="absolute inset-0 w-full h-full object-contain p-4 md:p-8"
          />
        </div>
      </div>

      <ResetPasswordDialog
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        email={email}
      />
    </>
  );
};

export default Login; 