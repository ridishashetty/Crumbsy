import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, MapPin, Phone, Mail, Edit3, Save, X } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    zipCode: user?.zipCode || '',
    location: user?.location || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate zip code format
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
      setError('Please enter a valid zip code (e.g., 12345 or 12345-6789)');
      return;
    }

    // Validate phone format (basic validation)
    if (formData.phone && !/^[\d\s\-\(\)\+\.]{10,}$/.test(formData.phone.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    // Update user profile
    updateUser({
      zipCode: formData.zipCode.trim(),
      location: formData.location.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim()
    });

    setIsEditing(false);

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    successDiv.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Profile updated successfully!</span>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  };

  const handleCancel = () => {
    setFormData({
      zipCode: user?.zipCode || '',
      location: user?.location || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setError('');
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 mb-8">
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.name} 
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-10 w-10 text-primary-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                {user.type}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Read-only fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
                </div>
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    City, State
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                    placeholder="e.g., 12345"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    isEditing 
                      ? 'focus:outline-none focus:ring-2 focus:ring-primary-500' 
                      : 'bg-gray-50 text-gray-700'
                  }`}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Full Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    isEditing 
                      ? 'focus:outline-none focus:ring-2 focus:ring-primary-500' 
                      : 'bg-gray-50 text-gray-700'
                  }`}
                  placeholder="Enter your full delivery address..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {user.type === 'buyer' 
                    ? 'This will be used as your default delivery address for orders'
                    : 'This helps customers know your service area'
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Account Type:</span>
                <span className="ml-2 text-gray-600 capitalize">{user.type}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Username:</span>
                <span className="ml-2 text-gray-600">@{user.username}</span>
              </div>
              {user.type === 'baker' && user.cancelationDays && (
                <div>
                  <span className="font-medium text-gray-700">Cancellation Policy:</span>
                  <span className="ml-2 text-gray-600">{user.cancelationDays} days notice required</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};