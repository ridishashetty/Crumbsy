import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Cake, User, LogOut, MessageCircle, Home, ChevronDown, Package, Camera, FileText } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Cake className="h-8 w-8 text-primary-500" />
            <span className="font-display font-bold text-2xl text-gray-900">Crumbsy</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              {user?.type === 'buyer' ? (
                <>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <span>My Portfolio</span>
                </>
              )}
            </Link>

            {user?.type === 'buyer' && (
              <Link
                to="/playground"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/playground')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Cake className="h-4 w-4" />
                <span>Cake Playground</span>
              </Link>
            )}

            {user?.type === 'baker' && (
              <Link
                to="/orders"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/orders')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Posted Orders</span>
              </Link>
            )}

            <Link
              to="/messages"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/messages')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Messages</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-md hover:bg-gray-50"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs text-gray-500">@{user?.username}</div>
                  </div>
                </Link>
                
                <hr className="my-1" />
                
                <Link
                  to="/orders"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
                
                <hr className="my-1" />
                
                <button
                  onClick={() => {
                    logout();
                    setIsProfileDropdownOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};