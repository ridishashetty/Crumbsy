import React, { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { calculateDistance } from '../../utils/distanceCalculator';
import { Search, Filter, Clock, MapPin, MessageSquare, Cake, DollarSign, X, Send, Eye, Trash2 } from 'lucide-react';

export const PostedOrders: React.FC = () => {
  const { orders, sendQuote, revokeQuote, addMessage, getBakerQuote, hasActiveBakerQuote } = useOrderStore();
  const { user, getAllUsers } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDistance, setFilterDistance] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [quoteData, setQuoteData] = useState({
    price: '',
    modificationRequests: '',
    message: ''
  });
  const [quoteError, setQuoteError] = useState('');

  // Filter for orders that are posted (available to bid on)
  const availableOrders = orders.filter(order => order.status === 'posted');
  
  // Filter for orders where current baker has sent quotes
  const myQuotedOrders = orders.filter(order => 
    order.status === 'posted' && hasActiveBakerQuote(order, user?.id || '')
  );

  // Filter for orders assigned to current baker
  const myAssignedOrders = orders.filter(order => order.bakerId === user?.id);

  const filteredAvailableOrders = availableOrders.filter(order => {
    const matchesSearch = order.cakeDesign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryZipCode.includes(searchTerm);
    
    const matchesDate = !filterDate || 
                       new Date(order.expectedDeliveryDate).toISOString().split('T')[0] >= filterDate;
    
    // Distance filter using actual calculation
    const matchesDistance = !filterDistance || (() => {
      if (!user?.zipCode) return true;
      const distance = calculateDistance(user.zipCode, order.deliveryZipCode);
      const maxDistance = parseInt(filterDistance);
      return distance <= maxDistance;
    })();
    
    return matchesSearch && matchesDate && matchesDistance;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-yellow-100 text-yellow-800';
      case 'baker-assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'out-for-delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDistance = (zipCode: string) => {
    if (!user?.zipCode) return 'Unknown';
    const distance = calculateDistance(user.zipCode, zipCode);
    return `${distance} miles`;
  };

  const getBuyerName = (buyerId: string) => {
    const allUsers = getAllUsers();
    const buyer = allUsers.find(u => u.id === buyerId);
    return buyer?.name || 'Unknown Buyer';
  };

  const handleSendQuote = (order: any) => {
    setSelectedOrder(order);
    setQuoteData({
      price: '',
      modificationRequests: '',
      message: ''
    });
    setQuoteError('');
    setShowQuoteModal(true);
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const handleQuoteSubmit = () => {
    setQuoteError('');
    
    if (!quoteData.price.trim()) {
      setQuoteError('Please enter a price');
      return;
    }
    
    const price = parseFloat(quoteData.price);
    if (isNaN(price) || price <= 0) {
      setQuoteError('Please enter a valid price');
      return;
    }
    
    if (!quoteData.message.trim()) {
      setQuoteError('Please enter a message');
      return;
    }
    
    sendQuote(
      selectedOrder.id,
      user!.id,
      price,
      quoteData.modificationRequests.trim(),
      quoteData.message.trim()
    );
    
    setShowQuoteModal(false);
    setSelectedOrder(null);
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    successDiv.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Quote sent successfully!</span>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  };

  const handleRevokeQuote = (order: any) => {
    if (confirm('Are you sure you want to revoke your quote? This action cannot be undone.')) {
      revokeQuote(order.id, user!.id);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      successDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Quote revoked successfully!</span>
      `;
      
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    }
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setSelectedOrder(null);
    setQuoteData({
      price: '',
      modificationRequests: '',
      message: ''
    });
    setQuoteError('');
  };

  const getShapeStyle = (shape: string) => {
    switch (shape) {
      case 'round':
        return { borderRadius: '50%' };
      case 'square':
        return { borderRadius: '8px' };
      default:
        return { borderRadius: '50%' };
    }
  };

  const getFrostingColor = (tier: any) => {
    return tier.frostingColor || '#FFFFFF';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Posted Orders</h1>
        <p className="text-gray-600 mt-2">Browse and bid on cake orders from customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Orders */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Orders</h2>
            
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by cake name or zip code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <input
                    type="date"
                    placeholder="Delivery date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <select
                    value={filterDistance}
                    onChange={(e) => setFilterDistance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any distance</option>
                    <option value="5">Within 5 miles</option>
                    <option value="10">Within 10 miles</option>
                    <option value="25">Within 25 miles</option>
                    <option value="50">Within 50 miles</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAvailableOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No orders match your filters</p>
                <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredAvailableOrders.map((order) => {
                const hasMyQuote = hasActiveBakerQuote(order, user?.id || '');
                const myQuote = hasMyQuote ? getBakerQuote(order, user?.id || '') : null;
                
                return (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{order.cakeDesign.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(order.expectedDeliveryDate)} at {formatTime(order.expectedDeliveryDate)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{order.deliveryZipCode} ({getDistance(order.deliveryZipCode)})</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Ordered by: {getBuyerName(order.buyerId)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {order.quotes.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {order.quotes.filter(q => q.isActive).length} quote{order.quotes.filter(q => q.isActive).length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Cake Details:</span> {order.cakeDesign.layers?.length || 0} tier{(order.cakeDesign.layers?.length || 0) !== 1 ? 's' : ''}, 
                        {order.cakeDesign.shape} shape
                        {order.cakeDesign.toppings && order.cakeDesign.toppings.length > 0 && (
                          <span>, {order.cakeDesign.toppings.join(', ')}</span>
                        )}
                      </p>
                      {order.cakeDesign.topText && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Text:</span> "{order.cakeDesign.topText}"
                        </p>
                      )}
                    </div>

                    {/* My Quote Status */}
                    {hasMyQuote && myQuote && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Your Quote: ${myQuote.price}</p>
                            {myQuote.modificationRequests && (
                              <p className="text-xs text-blue-800 mt-1">{myQuote.modificationRequests}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRevokeQuote(order)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Revoke Quote"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Posted {formatDate(order.createdAt)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        {!hasMyQuote ? (
                          <button
                            onClick={() => handleSendQuote(order)}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Send Quote</span>
                          </button>
                        ) : (
                          <span className="text-sm text-blue-600 font-medium px-3 py-2">Quote Sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* My Orders Sidebar */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Orders</h2>
          
          {/* My Quoted Orders */}
          {myQuotedOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Quotes ({myQuotedOrders.length})</h3>
              <div className="space-y-3">
                {myQuotedOrders.map((order) => {
                  const myQuote = getBakerQuote(order, user?.id || '');
                  return (
                    <div key={order.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{order.cakeDesign.name}</h4>
                        <span className="text-xs text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">
                          Quote Sent
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        Delivery: {formatDate(order.expectedDeliveryDate)}
                      </p>
                      {myQuote && (
                        <p className="text-xs font-medium text-green-600">
                          Your Quote: ${myQuote.price}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Assigned Orders */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Orders ({myAssignedOrders.length})</h3>
            <div className="space-y-4">
              {myAssignedOrders.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Cake className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No assigned orders yet</p>
                  <p className="text-xs text-gray-500 mt-1">Start bidding on available orders!</p>
                </div>
              ) : (
                myAssignedOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{order.cakeDesign.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Delivery: {formatDate(order.expectedDeliveryDate)} at {formatTime(order.expectedDeliveryDate)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Location: {order.deliveryZipCode}
                    </p>
                    {order.price && (
                      <p className="text-sm font-medium text-green-600">
                        ${order.price}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send Quote Modal */}
      {showQuoteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Quote</h3>
              <button
                onClick={closeQuoteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{selectedOrder.cakeDesign.name}</h4>
                <p className="text-sm text-gray-600">
                  Delivery: {formatDate(selectedOrder.expectedDeliveryDate)} at {formatTime(selectedOrder.expectedDeliveryDate)}
                </p>
                <p className="text-sm text-gray-600">
                  Location: {selectedOrder.deliveryZipCode} ({getDistance(selectedOrder.deliveryZipCode)})
                </p>
              </div>

              {quoteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{quoteError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteData.price}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your price"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={quoteData.message}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Introduce yourself and explain your quote..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modification Requests (Optional)
                  </label>
                  <textarea
                    value={quoteData.modificationRequests}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, modificationRequests: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any changes you'd like to make to the order..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Suggest any modifications to improve the cake or process
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeQuoteModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuoteSubmit}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Send Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <button
                onClick={() => setShowOrderDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Order Info */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedOrder.cakeDesign.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Customer:</span>
                    <span className="ml-2 text-gray-600">{getBuyerName(selectedOrder.buyerId)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Delivery Date:</span>
                    <span className="ml-2 text-gray-600">{formatDate(selectedOrder.expectedDeliveryDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Delivery Time:</span>
                    <span className="ml-2 text-gray-600">{formatTime(selectedOrder.expectedDeliveryDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{selectedOrder.deliveryZipCode} ({getDistance(selectedOrder.deliveryZipCode)})</span>
                  </div>
                </div>
              </div>

              {/* Cake Visualization */}
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Cake Design</h5>
                <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-6 flex items-center justify-center">
                  <div className="relative flex flex-col-reverse items-center">
                    {selectedOrder.cakeDesign.layers?.map((tier: any, index: number) => {
                      const baseDiameter = selectedOrder.cakeDesign.shape === 'round' ? 60 : 55;
                      const diameter = (selectedOrder.cakeDesign.layers.length - index + 1) * baseDiameter;
                      const height = 50;
                      const isTopTier = index === selectedOrder.cakeDesign.layers.length - 1;
                      const frostingColor = getFrostingColor(tier);
                      
                      return (
                        <div
                          key={index}
                          className="relative shadow-lg flex items-center justify-center"
                          style={{
                            width: `${diameter}px`,
                            height: `${height}px`,
                            backgroundColor: tier.color,
                            zIndex: selectedOrder.cakeDesign.layers.length - index,
                            border: `3px solid ${frostingColor}`,
                            marginTop: '0px',
                            ...getShapeStyle(selectedOrder.cakeDesign.shape),
                          }}
                        >
                          {/* Frosting lines */}
                          <div className="absolute inset-0 flex flex-col justify-center">
                            <div className="flex flex-col justify-between h-full py-2">
                              {[1, 2, 3].map((lineIndex) => (
                                <div 
                                  key={lineIndex}
                                  className="h-0.5"
                                  style={{ 
                                    backgroundColor: frostingColor,
                                    width: '75%',
                                    margin: '0 auto',
                                    borderRadius: selectedOrder.cakeDesign.shape === 'round' ? '50px' : '2px',
                                    opacity: 0.9
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cake Specifications */}
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Specifications</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700">Shape:</span>
                      <span className="ml-2 text-gray-600 capitalize">{selectedOrder.cakeDesign.shape}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tiers:</span>
                      <span className="ml-2 text-gray-600">{selectedOrder.cakeDesign.layers?.length || 0}</span>
                    </div>
                  </div>

                  {/* Tier Details */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-900 text-sm">Tier Details:</h6>
                    {selectedOrder.cakeDesign.layers?.map((layer: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-900">
                            Tier {index + 1} {index === 0 ? '(Bottom)' : index === selectedOrder.cakeDesign.layers.length - 1 ? '(Top)' : ''}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: layer.color }}
                              title="Cake color"
                            />
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: getFrostingColor(layer) }}
                              title="Frosting color"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Cake:</span> {layer.flavor}
                          </div>
                          <div>
                            <span className="font-medium">Frosting:</span> {layer.frosting || 'american buttercream'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Toppings */}
                  {selectedOrder.cakeDesign.toppings && selectedOrder.cakeDesign.toppings.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h6 className="font-medium text-gray-900 text-sm mb-2">Toppings:</h6>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.cakeDesign.toppings.map((topping: string, index: number) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs"
                          >
                            {topping}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text on Cake */}
                  {selectedOrder.cakeDesign.topText && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h6 className="font-medium text-gray-900 text-sm mb-2">Text on Cake:</h6>
                      <p className="text-sm text-gray-600 italic">"{selectedOrder.cakeDesign.topText}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Quotes (only show count, not details) */}
              {selectedOrder.quotes && selectedOrder.quotes.filter((q: any) => q.isActive).length > 0 && (
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Competition</h5>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      This order has received {selectedOrder.quotes.filter((q: any) => q.isActive).length} quote{selectedOrder.quotes.filter((q: any) => q.isActive).length !== 1 ? 's' : ''} from other bakers.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowOrderDetailsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};