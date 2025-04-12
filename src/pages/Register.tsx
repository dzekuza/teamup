import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    try {
      await register(email, password, displayName);
      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Failed to create an account.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-[#1E1E1E] rounded-3xl p-8">
          <h1 className="text-2xl font-medium text-white mb-6 text-center">Register</h1>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              />
              <p className="text-gray-400 text-sm mt-1">Password must be at least 6 characters long</p>
            </div>
            <button
              type="submit"
              className="w-full bg-[#C1FF2F] text-black rounded-xl py-3 font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              Register
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C1FF2F] hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 