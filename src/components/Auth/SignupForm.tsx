import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Cake, Mail, Lock, User, MapPin, AtSign, AlertCircle, Loader2 } from 'lucide-react';

interface SignupFormProps {
  onToggleMode: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    userType: 'buyer' as 'buyer' | 'baker',
    location: '',
    zipCode: '',
  });
  const [error, setError] = useState('');
  const { signup, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    const userData = {
      email: formData.email,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      type: formData.userType,
      profilePicture: `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`,
      location: formData.location,
      zipCode: formData.zipCode,
      cancelationDays: formData.userType === 'baker' ? 3 : undefined,
    };
    
    const result = await signup(userData);
    
    if (!result.success) {
      setError(result.error || 'Signup failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Cake className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">
            Join Crumbsy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start ordering custom cakes
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-error-600" />
              <span className="text-sm text-error-700">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="buyer"
                    checked={formData.userType === 'buyer'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as 'buyer' | 'baker' }))}
                    disabled={loading}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cake Buyer</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="baker"
                    checked={formData.userType === 'baker'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as 'buyer' | 'baker' }))}
                    disabled={loading}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Baker</span>
                </label>
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Full name"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Username (min 3 characters)"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Password (min 6 characters)"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="zipCode"
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="ZIP Code"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              disabled={loading}
              className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50"
            >
              Already have an account? Sign in
            </button>
          </div>

          {formData.userType === 'baker' && (
            <div className="mt-4 p-4 bg-accent-50 rounded-lg">
              <p className="text-sm text-accent-800">
                <strong>Baker Benefits:</strong> $0 subscription fee, access to all buyer orders, 
                built-in portfolio system, and secure payment processing.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};