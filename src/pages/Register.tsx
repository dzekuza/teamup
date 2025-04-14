import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import phoneMockup from '../assets/phonemock.png';
import logoWhite from '../assets/images/logo-white.svg';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendWelcomeEmail } from '../services/sendGridService';

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
    length: false,
    number: false,
    special: false,
    uppercase: false
  });

  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      length: password.length >= 6,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password)
    });
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

  const renderPasswordRequirements = () => (
    <div className="mt-2 space-y-1">
      <p className="text-sm font-medium text-gray-400">Password requirements:</p>
      <ul className="text-sm space-y-1">
        <li className={`flex items-center gap-2 ${passwordRequirements.length ? 'text-green-500' : 'text-gray-400'}`}>
          <span>{passwordRequirements.length ? '✓' : '○'}</span>
          At least 6 characters
        </li>
        <li className={`flex items-center gap-2 ${passwordRequirements.number ? 'text-green-500' : 'text-gray-400'}`}>
          <span>{passwordRequirements.number ? '✓' : '○'}</span>
          Contains a number
        </li>
        <li className={`flex items-center gap-2 ${passwordRequirements.special ? 'text-green-500' : 'text-gray-400'}`}>
          <span>{passwordRequirements.special ? '✓' : '○'}</span>
          Contains a special character
        </li>
        <li className={`flex items-center gap-2 ${passwordRequirements.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
          <span>{passwordRequirements.uppercase ? '✓' : '○'}</span>
          Contains an uppercase letter
        </li>
      </ul>
    </div>
  );

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
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
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