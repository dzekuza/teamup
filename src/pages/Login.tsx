import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import logoWhite from '../assets/images/logo-white.svg';
import phoneMockup from '../assets/phonemock.png';
import ResetPasswordDialog from '../components/ResetPasswordDialog';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetOption, setShowResetOption] = useState(false);

  const getFirebaseErrorMessage = (error: any) => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An error occurred during sign in. Please try again.';
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
    setIsLoading(true);
    setError('');
    setShowResetOption(false);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      setError(errorMessage);
      if (error.code === 'auth/wrong-password') {
        setShowResetOption(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
              className="w-full bg-white text-black rounded-xl p-4 font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                'Continue with Google'
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
                <label className="block text-sm font-medium text-gray-400 mb-1">
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {showResetOption && (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="w-full text-[#C1FF2F] hover:underline text-sm text-center"
                >
                  Forgot your password? Reset it here
                </button>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 font-medium hover:bg-[#3A3A3A] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#C1FF2F] text-black rounded-xl p-4 font-medium hover:bg-[#B1EF1F] transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
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
        <div className="hidden md:block relative bg-[#CDEA68] overflow-hidden">
          <img
            src={phoneMockup}
            alt="App preview"
            className="absolute inset-0 w-full h-full object-cover object-center"
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