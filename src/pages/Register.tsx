import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import phoneMockup from '../assets/phonemock.png';
import logoWhite from '../assets/images/logo-white.svg';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendWelcomeEmail } from '../services/sendGridService';
import { setCookie, removeCookie } from '../utils/cookieUtils';

const SPORTS = [
  { id: 'padel', name: 'Padel', icon: '🎾' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-100 strength score
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Check password requirements when password field changes
    if (name === 'password') {
      checkPasswordRequirements(value);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1 && selectedSports.length === 0) {
      setError('Please select at least one sport');
      return;
    }
    if (currentStep === 2 && (!formData.displayName || !formData.email || !formData.phoneNumber)) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let score = 0;
    const length = password.length;

    // Base score from length
    if (length >= 8) score += 20;
    if (length >= 10) score += 10;
    if (length >= 12) score += 10;

    // Character variety
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    // Bonus for combination of character types
    const charTypes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(regex => 
      regex.test(password)
    ).length;
    if (charTypes >= 3) score += 10;
    if (charTypes === 4) score += 5;

    // Penalty for repetitive patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Same character repeated 3+ times
    if (/^[a-zA-Z]+$|^[0-9]+$/.test(password)) score -= 10; // Only letters or only numbers

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  };

  const getPasswordStrengthLabel = (score: number): string => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  };

  const getPasswordStrengthColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-lime-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const checkPasswordRequirements = (value: string) => {
    const requirements = {
      minLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasLowercase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecial: /[^A-Za-z0-9]/.test(value),
    };
    
    setPasswordRequirements({
      ...requirements
    });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  useEffect(() => {
    checkPasswordRequirements(formData.password);
  }, [formData.password]);

  const getFirebaseErrorMessage = (error: any) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please try logging in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Unable to register at this time. Please try again later.';
      case 'auth/weak-password':
        return 'Please choose a stronger password.';
      default:
        return 'An error occurred during registration. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: formData.displayName
        });

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          photoURL: 'Avatar1',
          sports: selectedSports,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        await sendWelcomeEmail(formData.email, formData.displayName);
        
        // Save credentials if remember me is checked
        if (rememberMe) {
          // Use cookies instead of localStorage for better security and persistence
          setCookie('savedEmail', formData.email, { expires: 30 });
          setCookie('savedPassword', formData.password, { expires: 30 });
          
          // Store user data in a cookie
          const userData = {
            uid: userCredential.user.uid,
            email: formData.email,
            displayName: formData.displayName
          };
          
          setCookie('userData', userData, { expires: 30 });
        } else {
          // Remove any previously saved credentials
          removeCookie('savedEmail');
          removeCookie('savedPassword');
          removeCookie('userData');
        }
        
        navigate('/');
      }
    } catch (error: any) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const renderPasswordStrengthMeter = () => {
    if (!formData.password) return null;
    
    const strengthLabel = getPasswordStrengthLabel(passwordStrength);
    const strengthColor = getPasswordStrengthColor(passwordStrength);
    
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Password Strength</span>
          <span className="text-xs font-medium" style={{color: strengthColor === 'bg-red-500' ? '#ef4444' : 
                                                      strengthColor === 'bg-orange-500' ? '#f97316' :
                                                      strengthColor === 'bg-yellow-500' ? '#eab308' :
                                                      strengthColor === 'bg-lime-500' ? '#84cc16' : 
                                                      '#22c55e'}}>
            {strengthLabel}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${strengthColor} transition-all duration-300`} 
            style={{ width: `${passwordStrength}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderPasswordRequirements = () => {
    if (!formData.password) return null;

    return (
      <div className="mt-2 mb-4 text-sm">
        <p className="text-gray-400 mb-1">Password must contain:</p>
        <ul className="space-y-1 px-4">
          <li className={`flex items-center gap-1 ${passwordRequirements.minLength ? 'text-green-500' : 'text-gray-400'}`}>
            {passwordRequirements.minLength ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            At least 8 characters
          </li>
          <li className={`flex items-center gap-1 ${passwordRequirements.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
            {passwordRequirements.hasUppercase ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            At least one uppercase letter
          </li>
          <li className={`flex items-center gap-1 ${passwordRequirements.hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
            {passwordRequirements.hasLowercase ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            At least one lowercase letter
          </li>
          <li className={`flex items-center gap-1 ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
            {passwordRequirements.hasNumber ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            At least one number
          </li>
          <li className={`flex items-center gap-1 ${passwordRequirements.hasSpecial ? 'text-green-500' : 'text-gray-400'}`}>
            {passwordRequirements.hasSpecial ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            At least one special character (!@#$%^&*)
          </li>
        </ul>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              Create an account
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Let's start with your hobby
            </p>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400">
                Select sport that you are interested in
              </label>
              <div className="grid grid-cols-2 gap-4">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => handleSportToggle(sport.id)}
                    type="button"
                    className={`p-4 rounded-xl transition-colors flex flex-col items-center ${
                      selectedSports.includes(sport.id)
                        ? 'bg-[#C1FF2F] text-black'
                        : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                    }`}
                  >
                    <span className="text-2xl mb-2">{sport.icon}</span>
                    <span className="font-medium">{sport.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleContinue}
              className="w-full bg-[#C1FF2F] text-black rounded-xl p-4 font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              Create an account
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Now let's add your info
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Your name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 font-medium hover:bg-[#3A3A3A] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className="w-full bg-[#C1FF2F] text-black rounded-xl p-4 font-medium hover:bg-[#B1EF1F] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              Create an account
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Create your password
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] pr-10"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {renderPasswordStrengthMeter()}
                {renderPasswordRequirements()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] pr-10"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#C1FF2F] border-gray-600 rounded focus:ring-[#C1FF2F] bg-[#2A2A2A]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 font-medium hover:bg-[#3A3A3A] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#C1FF2F] text-black rounded-xl p-4 font-medium hover:bg-[#B1EF1F] transition-colors"
                >
                  {isLoading ? 'Creating account...' : 'Go to dashboard'}
                </button>
              </div>
            </form>
          </div>
        );
    }
  };

  return (
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
  );
}; 