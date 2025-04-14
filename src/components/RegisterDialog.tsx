import React, { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendWelcomeEmail } from '../services/sendGridService';

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

const SPORTS = [
  { id: 'padel', name: 'Padel', icon: '🎾' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
];

export const RegisterDialog: React.FC<RegisterDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useClickOutside(dialogRef, () => {
    if (!isLoading) {
      onClose();
    }
  });

  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedSports.length > 0;
      case 2:
        return displayName.trim() !== '' && email.trim() !== '';
      case 3:
        return password.length >= 6;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && canProceedToNextStep()) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceedToNextStep()) return;

    setIsLoading(true);
    setError('');

    try {
      const user = await register(email, password, displayName);
      
      // Store additional user data in Firestore
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: 'Avatar1',
          sports: selectedSports,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Add user to welcome series
        await sendWelcomeEmail(email, displayName);
      }

      onClose();
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Select Your Sports</h3>
            <p className="text-gray-400">Choose the sports you're interested in playing</p>
            
            <div className="grid grid-cols-2 gap-4">
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => handleSportToggle(sport.id)}
                  className={`p-4 rounded-xl transition-colors ${
                    selectedSports.includes(sport.id)
                      ? 'bg-[#C1FF2F] text-black'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                  }`}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <p className="mt-2 font-medium">{sport.name}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Your Profile</h3>
            <p className="text-gray-400">Tell us about yourself</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Create Password</h3>
            <p className="text-gray-400">Choose a secure password for your account</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <p className="mt-2 text-sm text-gray-400">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel 
          ref={dialogRef}
          className="bg-[#1E1E1E] rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col relative"
        >
          <div className="p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            
            <Dialog.Title className="text-2xl font-medium text-white mb-6">
              Create Account
            </Dialog.Title>

            {/* Progress indicator */}
            <div className="flex justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-1/3 h-1 rounded-full mx-1 ${
                    step <= currentStep ? 'bg-[#C1FF2F]' : 'bg-[#2A2A2A]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-8 pb-8 overflow-y-auto flex-1">
            <div className="space-y-4">
              {renderStepContent()}

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-white hover:bg-[#2A2A2A] rounded-xl transition-colors"
                  >
                    Back
                  </button>
                )}
                
                <div className="ml-auto">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedToNextStep()}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        canProceedToNextStep()
                          ? 'bg-[#C1FF2F] text-black hover:bg-[#B1EF1F]'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || !canProceedToNextStep()}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        !isLoading && canProceedToNextStep()
                          ? 'bg-[#C1FF2F] text-black hover:bg-[#B1EF1F]'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Creating...' : 'Create Account'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 