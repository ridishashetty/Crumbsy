import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCakeStore } from '../../store/cakeStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { BakerProfileModal } from '../Profile/BakerProfileModal';
import { Trash2, ShoppingCart, Cake, Plus, X, Calendar, MapPin, XCircle, Clock, CheckCircle, MessageSquare, DollarSign, User, Loader2 } from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { getUserDesigns, deleteDesign, setCurrentDesign, loadUserDesigns } = useCakeStore();
  const { createOrder, getBuyerOrders, cancelOrder, assignBaker, addMessage, canCancelOrder } = useOrderStore();
  const { user, getAllUsers } = useAuthStore();
  const navigate = useNavigate();
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Get designs and orders for current user only
  const savedDesigns = user ? getUserDesigns(user.id) : [];
  const userOrders = user ? getBuyerOrders(user.id) : [];
  
  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showBakerProfileModal, setShowBakerProfileModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [selectedBakerId, setSelectedBakerId] = useState<string>('');
  const [orderData, setOrderData] = useState({
    zipCode: '',
    deliveryDate: '',
    deliveryTime: ''
  });
  const [orderError, setOrderError] = useState('');

  // Load user designs on component mount
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        try {
          await loadUserDesigns(user.id);
        } catch (error) {
          console.error('Error loading user designs:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadData();
  }, [user, loadUserDesigns]);

  const handleEditCake = (design: any) => {
    setCurrentDesign(design);
    navigate('/playground');
  };

  const handleCreateNew = () => {
    setCurrentDesign(null); // Clear current design to start fresh
    navigate('/playground');
  };

  const handleOrderClick = (design: any) => {
    // Check if this design already has a posted order (regardless of quotes)
    const existingOrder = userOrders.find(order => 
      order.cakeDesign.id === design.id && order.status === 'posted'
    );
    
    if (existingOrder) {
      // If order exists and is posted, navigate to messages to see quotes
      navigate('/messages');
      return;
    }
    
    // Check if design has an assigned baker
    const assignedOrder = userOrders.find(order => 
      order.cakeDesign.id === design.id && order.status === 'baker-assigned'
    );
    
    if (assignedOrder) {
      // Navigate to messages for assigned orders
      navigate('/messages');
      return;
    }
    
    setSelectedDesign(design);
    setShowOrderModal(true);
    setOrderError('');
    // Reset form
    setOrderData({
      zipCode: user?.zipCode || '',
      deliveryDate: '',
      deliveryTime: ''
    });
  };

  const handleCancelOrder = (orderId: string) => {
    if (user) {
      const order = userOrders.find(o => o.id === orderId);
      if (order && canCancelOrder(order, user.id, 'buyer')) {
        cancelOrder(orderId, user.id);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        successDiv.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Order cancelled successfully!</span>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 4000);
      } else {
        alert('This order cannot be cancelled at this time.');
      }
    }
  };

  const handleOrderSubmit = () => {
    setOrderError('');
    
    // Validation
    if (!orderData.zipCode.trim()) {
      setOrderError('Please enter your zip code');
      return;
    }
    
    if (!/^\d{5}(-\d{4})?$/.test(orderData.zipCode.trim())) {
      setOrderError('Please enter a valid zip code (e.g., 12345 or 12345-6789)');
      return;
    }
    
    if (!orderData.deliveryDate) {
      setOrderError('Please select a delivery date');
      return;
    }
    
    if (!orderData.deliveryTime) {
      setOrderError('Please select a delivery time');
      return;
    }
    
    // Check if delivery date is at least 3 days from now
    const selectedDate = new Date(orderData.deliveryDate + 'T' + orderData.deliveryTime);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    
    if (selectedDate < minDate) {
      setOrderError('Delivery date must be at least 3 days from today');
      return;
    }
    
    // Create the order
    const newOrder = {
      buyerId: user!.id,
      cakeDesign: selectedDesign,
      deliveryZipCode: orderData.zipCode.trim(),
      expectedDeliveryDate: selectedDate,
      status: 'posted' as const
    };
    
    createOrder(newOrder);
    
    // Close modal and show success
    setShowOrderModal(false);
    setSelectedDesign(null);
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    successDiv.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Order posted successfully! Bakers will now see your request.</span>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 4000);
  };

  const handleViewBakerProfile = (bakerId: string) => {
    setSelectedBakerId(bakerId);
    setShowBakerProfileModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-yellow-100 text-yellow-800';
      case 'baker-assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'out-for-delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const getBakerName = (bakerId: string) => {
    const allUsers = getAllUsers();
    const baker = allUsers.find(u => u.id === bakerId);
    return baker?.name || 'Unknown Baker';
  };

  // Get minimum date (3 days from now)
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  // Check if design has any order (posted or assigned)
  const getDesignOrderStatus = (design: any) => {
    return userOrders.find(order => 
      order.cakeDesign.id === design.id && (order.status === 'posted' || order.status === 'baker-assigned')
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your designs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Create, customize, and order your perfect cakes</p>
      </div>

      {/* Recent Orders Summary */}
      {userOrders.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">{order.cakeDesign.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status === 'posted' ? 'Posted' : 
                     order.status === 'baker-assigned' ? 'Baker Assigned' :
                     order.status === 'in-progress' ? 'In Progress' :
                     order.status === 'delivered' ? 'Delivered' :
                     order.status === 'cancelled' ? 'Cancelled' : order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                </p>
                {order.bakerId && (
                  <p className="text-sm text-gray-600 mb-2">
                    Baker: 
                    <button
                      onClick={() => handleViewBakerProfile(order.bakerId!)}
                      className="ml-1 text-primary-600 hover:text-primary-700 underline"
                    >
                      {getBakerName(order.bakerId)}
                    </button>
                  </p>
                )}
                {order.quotes && order.quotes.length > 0 && order.status === 'posted' && (
                  <p className="text-sm text-blue-600 mb-2">
                    {order.quotes.filter(q => q.isActive).length} quote{order.quotes.filter(q => q.isActive).length !== 1 ? 's' : ''} received
                  </p>
                )}
                <div className="flex space-x-2">
                  {order.status === 'posted' && (
                    <>
                      {order.quotes && order.quotes.filter(q => q.isActive).length > 0 && (
                        <Link
                          to="/messages"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>View Quotes</span>
                        </Link>
                      )}
                      {canCancelOrder(order, user!.id, 'buyer') && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </>
                  )}
                  {order.status === 'baker-assigned' && (
                    <>
                      <Link
                        to="/messages"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Chat</span>
                      </Link>
                      {canCancelOrder(order, user!.id, 'buyer') && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {userOrders.length > 3 && (
            <div className="mt-4 text-center">
              <Link 
                to="/orders" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all orders →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Saved Cakes - Full width, left aligned */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 text-left">My Cake Designs</h2>
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Design</span>
          </button>
        </div>

        {savedDesigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Cake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No cake designs yet</p>
            <p className="text-sm text-gray-500 mb-6">Start creating your first custom cake design!</p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Cake</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedDesigns.map((design) => {
              const relatedOrder = getDesignOrderStatus(design);
              
              return (
                <div key={design.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group relative">
                  {/* Delete button - positioned on top right, visible on hover */}
                  <button
                    onClick={() => user && deleteDesign(design.id, user.id)}
                    className="absolute top-2 right-2 p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 z-10 shadow-md"
                    title="Delete Cake"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Order Status Badge */}
                  {relatedOrder && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(relatedOrder.status)}`}>
                        {relatedOrder.status === 'posted' ? (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {relatedOrder.quotes && relatedOrder.quotes.filter(q => q.isActive).length > 0 
                              ? `${relatedOrder.quotes.filter(q => q.isActive).length} Quote${relatedOrder.quotes.filter(q => q.isActive).length !== 1 ? 's' : ''}`
                              : 'Posted'
                            }
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Baker Assigned
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Cake Preview Image */}
                  <div className="aspect-[4/3] bg-gradient-to-b from-blue-50 to-blue-100 relative overflow-hidden flex items-center justify-center p-4">
                    {design.preview ? (
                      <img 
                        src={design.preview} 
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Cake visualization
                      <div className="relative flex flex-col-reverse items-center">
                        {design.layers?.map((tier, index) => {
                          const baseDiameter = design.shape === 'round' ? 50 : 45;
                          const diameter = (design.layers.length - index + 1) * baseDiameter;
                          const height = 45;
                          const isTopTier = index === design.layers.length - 1;
                          const frostingColor = getFrostingColor(tier);
                          
                          return (
                            <div
                              key={index}
                              className="relative shadow-lg flex items-center justify-center overflow-visible"
                              style={{
                                width: `${diameter}px`,
                                height: `${height}px`,
                                backgroundColor: tier.color,
                                zIndex: design.layers.length - index,
                                border: `3px solid ${frostingColor}`,
                                marginTop: '0px',
                                ...getShapeStyle(design.shape),
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
                                        borderRadius: design.shape === 'round' ? '50px' : '2px',
                                        opacity: 0.9
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Top Design Element */}
                              {isTopTier && tier.topDesign && tier.topDesign !== 'none' && (
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                                  {tier.topDesign === 'drip' && (
                                    <div className="flex space-x-1">
                                      {[1, 2].map(i => (
                                        <div 
                                          key={i}
                                          className="w-0.5 bg-amber-600 rounded-b-full"
                                          style={{ height: `${3 + Math.random() * 2}px` }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {tier.topDesign === 'berries' && (
                                    <div className="text-xs">🍓</div>
                                  )}
                                  {tier.topDesign === 'flowers' && (
                                    <div className="text-xs">❀</div>
                                  )}
                                  {tier.topDesign === 'creative' && (
                                    <div className="text-xs">✨</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Text on Cake */}
                    {design.topText && (
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white px-2 py-1 rounded-full shadow-md border border-gray-200">
                          <span className="text-xs font-semibold text-gray-800">{design.topText}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Toppings Icons */}
                    {design.toppings && design.toppings.length > 0 && (
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {design.toppings.slice(0, 2).map((topping, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center"
                            title={topping}
                          >
                            <span className="text-xs">
                              {topping.includes('Berries') ? '🍓' :
                               topping.includes('Chocolate') ? '🍫' :
                               topping.includes('Sprinkles') ? '✨' :
                               topping.includes('Flowers') ? '🌸' :
                               topping.includes('Drizzle') ? '🍯' :
                               topping.includes('Caramel') ? '🍮' :
                               topping.includes('Nuts') ? '🥜' :
                               topping.includes('Candy') ? '🍬' : '🎂'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Cake Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 text-center truncate" title={design.name}>
                      {design.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{design.layers?.length || 0} tier{(design.layers?.length || 0) !== 1 ? 's' : ''}</span>
                      <span>{design.shape}</span>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleEditCake(design)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        <span>Edit</span>
                      </button>
                      
                      {relatedOrder ? (
                        relatedOrder.status === 'posted' ? (
                          relatedOrder.quotes && relatedOrder.quotes.filter(q => q.isActive).length > 0 ? (
                            <Link
                              to="/messages"
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              title="View Quotes"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Quotes</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleCancelOrder(relatedOrder.id)}
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                              title="Cancel Posted Order"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          )
                        ) : (
                          <Link
                            to="/messages"
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            title="Chat with Baker"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Chat</span>
                          </Link>
                        )
                      ) : (
                        <button
                          onClick={() => handleOrderClick(design)}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                          title="Order This Cake"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedDesign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Your Cake</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Selected Cake Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedDesign.name}</h4>
                <div className="text-sm text-gray-600">
                  <div>{selectedDesign.layers?.length || 0} tier{(selectedDesign.layers?.length || 0) !== 1 ? 's' : ''} • {selectedDesign.shape} shape</div>
                  {selectedDesign.toppings && selectedDesign.toppings.length > 0 && (
                    <div className="mt-1">Toppings: {selectedDesign.toppings.join(', ')}</div>
                  )}
                  {selectedDesign.topText && (
                    <div className="mt-1">Text: "{selectedDesign.topText}"</div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {orderError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{orderError}</p>
                </div>
              )}

              {/* Order Form */}
              <div className="space-y-4">
                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Delivery Zip Code
                  </label>
                  <input
                    type="text"
                    value={orderData.zipCode}
                    onChange={(e) => setOrderData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter zip code (e.g., 12345)"
                    maxLength={10}
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={orderData.deliveryDate}
                    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 3 days from today to allow preparation time
                  </p>
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Time
                  </label>
                  <select
                    value={orderData.deliveryTime}
                    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">What happens next?</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your order will be posted for local bakers to see</li>
                    <li>• Bakers will send you quotes and proposals</li>
                    <li>• You can review baker profiles and choose your favorite</li>
                    <li>• Payment is processed securely when you accept a quote</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOrderSubmit}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Post Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Baker Profile Modal */}
      <BakerProfileModal
        bakerId={selectedBakerId}
        isOpen={showBakerProfileModal}
        onClose={() => setShowBakerProfileModal(false)}
      />
    </div>
  );
};