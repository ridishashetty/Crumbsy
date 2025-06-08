import React from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { Clock, CheckCircle, Package, MapPin, DollarSign } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { orders } = useOrderStore();
  const { user } = useAuthStore();

  // Filter orders based on user type
  const userOrders = user?.type === 'buyer' 
    ? orders.filter(order => order.buyerId === user.id)
    : orders.filter(order => order.bakerId === user.id);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <Clock className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-2">
          {user?.type === 'buyer' ? 'Track your cake orders' : 'Manage your assigned orders'}
        </p>
      </div>

      <div className="space-y-6">
        {userOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No orders yet</p>
            <p className="text-sm text-gray-500">
              {user?.type === 'buyer' 
                ? 'Create a cake design and place your first order!' 
                : 'Start browsing available orders to get your first assignment!'
              }
            </p>
          </div>
        ) : (
          userOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{order.cakeDesign.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Delivery: {order.expectedDeliveryDate.toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{order.deliveryZipCode}</span>
                    </span>
                    {order.price && (
                      <span className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>${order.price}</span>
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cake Details:</span> {order.cakeDesign.layers.length} layer{order.cakeDesign.layers.length !== 1 ? 's' : ''}, 
                  {order.cakeDesign.buttercream.flavor} buttercream
                  {order.cakeDesign.toppings.length > 0 && (
                    <span>, {order.cakeDesign.toppings.join(', ')}</span>
                  )}
                </p>
                {order.cakeDesign.topText && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Text:</span> "{order.cakeDesign.topText}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Order placed {order.createdAt.toLocaleDateString()}</span>
                {order.otpCode && order.status === 'out-for-delivery' && user?.type === 'buyer' && (
                  <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-md">
                    <span className="font-medium">Delivery Code: {order.otpCode}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};