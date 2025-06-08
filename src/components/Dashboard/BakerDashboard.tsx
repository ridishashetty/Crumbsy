import React, { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { Search, Filter, Clock, MapPin, DollarSign, MessageSquare, Cake } from 'lucide-react';

export const BakerDashboard: React.FC = () => {
  const { orders } = useOrderStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDistance, setFilterDistance] = useState('');

  // Filter for unassigned orders (available to bid on) - only show 'posted' status orders
  const availableOrders = orders.filter(order => order.status === 'posted' && !order.bakerId);
  
  // Filter for orders assigned to current baker
  const myOrders = orders.filter(order => order.bakerId === user?.id);

  const filteredAvailableOrders = availableOrders.filter(order => {
    const matchesSearch = order.cakeDesign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryZipCode.includes(searchTerm);
    
    const matchesDate = !filterDate || 
                       order.expectedDeliveryDate.toISOString().split('T')[0] >= filterDate;
    
    // Simple distance filter - in real app would calculate actual distance
    const matchesDistance = !filterDistance || true;
    
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

  const formatDate = (date: Date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Baker Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage orders and grow your cake business</p>
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
              filteredAvailableOrders.map((order) => (
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
                          <span>{order.deliveryZipCode}</span>
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Cake Details:</span> {order.cakeDesign.layers?.length || 0} tier{(order.cakeDesign.layers?.length || 0) !== 1 ? 's' : ''}, 
                      {order.cakeDesign.buttercream?.flavor || 'vanilla'} buttercream
                      {order.cakeDesign.toppings && order.cakeDesign.toppings.length > 0 && (
                        <span>, {order.cakeDesign.toppings.join(', ')}</span>
                      )}
                    </p>
                    {order.cakeDesign.topText && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Text:</span> "{order.cakeDesign.topText}"
                      </p>
                    )}
                    
                    {/* Cake Shape and Layers Details */}
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Shape:</span> {order.cakeDesign.shape || 'round'}
                        </div>
                        <div>
                          <span className="font-medium">Tiers:</span> {order.cakeDesign.layers?.length || 0}
                        </div>
                      </div>
                      
                      {order.cakeDesign.layers && order.cakeDesign.layers.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-700">Tier Details:</span>
                          <div className="mt-1 space-y-1">
                            {order.cakeDesign.layers.map((layer, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                Tier {index + 1}: {layer.flavor} cake, {layer.frosting || 'american buttercream'} frosting
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Posted {formatDate(order.createdAt)}
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      <span>Send Quote</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Orders */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Orders</h2>
          
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Cake className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No assigned orders yet</p>
                <p className="text-xs text-gray-500 mt-1">Start bidding on available orders!</p>
              </div>
            ) : (
              myOrders.map((order) => (
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
  );
};