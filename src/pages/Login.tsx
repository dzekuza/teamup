import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import logoWhite from '../assets/images/logo-white.svg';
import phoneMockup from '../assets/phonemock.png';
import ResetPasswordDialog from '../components/ResetPasswordDialog';
import logoGoogle from '../assets/google.svg';
import { setCookie, getCookie, removeCookie } from '../utils/cookieUtils';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetOption, setShowResetOption] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved email on component mount, and clear any legacy plaintext password cookie
  useEffect(() => {
    const savedEmail = getCookie('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
    // Remove any legacy plaintext password cookie from previous sessions
    removeCookie('savedPassword');
  }, []);

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
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message ?? 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      // signInWithGoogle triggers a browser redirect — code here won't execute
    } catch (err: any) {
      setError(err.message ?? 'An error occurred during login. Please try again.');
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
