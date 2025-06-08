import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { X, User, MapPin, Phone, Mail, Camera, Star } from 'lucide-react';

interface BakerProfileModalProps {
  bakerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BakerProfileModal: React.FC<BakerProfileModalProps> = ({ bakerId, isOpen, onClose }) => {
  const { getAllUsers } = useAuthStore();
  const { getBakerPortfolio } = usePortfolioStore();
  
  if (!isOpen) return null;
  
  const allUsers = getAllUsers();
  const baker = allUsers.find(u => u.id === bakerId);
  const portfolioItems = getBakerPortfolio(bakerId);
  
  if (!baker) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-gray-600">Baker not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Baker Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Baker Info */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            {baker.profilePicture ? (
              <img 
                src={baker.profilePicture} 
                alt={baker.name} 
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-8 w-8 text-primary-600" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900">{baker.name}</h4>
              <p className="text-gray-600">@{baker.username}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                {baker.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{baker.location}</span>
                  </span>
                )}
                {baker.zipCode && (
                  <span>{baker.zipCode}</span>
                )}
              </div>
              {baker.phone && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{baker.phone}</span>
                  </span>
                </div>
              )}
              {baker.email && (
                <div className="mt-1 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{baker.email}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Baker Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{portfolioItems.length}</div>
              <div className="text-sm text-gray-600">Portfolio Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">4.8</div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                Rating
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{baker.cancelationDays || 3}</div>
              <div className="text-sm text-gray-600">Days Notice</div>
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Portfolio ({portfolioItems.length})
            </h5>
            
            {portfolioItems.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No portfolio items yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {portfolioItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="relative group">
                    <img
                      src={item.image}
                      alt={item.caption}
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&dpr=1';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <p className="text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2">
                        {item.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {portfolioItems.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  +{portfolioItems.length - 6} more items in portfolio
                </p>
              </div>
            )}
          </div>

          {/* Policies */}
          {baker.cancelationDays && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h6 className="font-medium text-blue-900 mb-2">Cancellation Policy</h6>
              <p className="text-sm text-blue-800">
                Requires {baker.cancelationDays} days notice for order cancellations.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};