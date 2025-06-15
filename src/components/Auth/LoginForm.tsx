import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Cake, User, Lock, AlertCircle, Shield, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await login(identifier, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const isAdminLogin = identifier === 'Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Cake className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">
            Welcome to Crumbsy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Custom cake ordering made delicious
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
              <label htmlFor="identifier" className="sr-only">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder={isAdminLogin ? 'Admin Username' : 'Username'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          {isAdminLogin && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Admin Access:</strong> Use special credentials to access system administration.
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdminLogin 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isAdminLogin ? (
                    <Shield className="h-5 w-5 mr-2" />
                  ) : (
                    <User className="h-5 w-5 mr-2" />
                  )}
                  Sign In
                </>
              )}
            </button>
          </div>

          {!isAdminLogin && (
            <div className="text-center">
              <button
                type="button"
                onClick={onToggleMode}
                disabled={loading}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50"
              >
                Don't have an account? Sign up
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};