import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCakeStore } from '../../store/cakeStore';
import { useOrderStore } from '../../store/orderStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { 
  Users, 
  Cake, 
  ShoppingCart, 
  Camera, 
  Trash2, 
  Edit3, 
  Search,
  Download,
  BarChart3,
  Shield,
  LogOut
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { getAllUsers, deleteUser, updateUser, logout } = useAuthStore();
  const { savedDesigns } = useCakeStore();
  const { orders } = useOrderStore();
  const { portfolioItems } = usePortfolioStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cakes' | 'orders' | 'portfolio'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    type: 'buyer' as 'buyer' | 'baker',
    location: '',
    zipCode: ''
  });

  const allUsers = getAllUsers();
  const buyers = allUsers.filter(u => u.type === 'buyer');
  const bakers = allUsers.filter(u => u.type === 'baker');

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCakes = savedDesigns.filter(cake =>
    cake.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.cakeDesign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.deliveryZipCode.includes(searchTerm)
  );

  const filteredPortfolio = portfolioItems.filter(item =>
    item.caption.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      type: user.type,
      location: user.location || '',
      zipCode: user.zipCode || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      updateUser({
        ...selectedUser,
        ...editFormData
      });
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      successDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>User updated successfully!</span>
      `;
      
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUser(userId);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      successDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>User deleted successfully!</span>
      `;
      
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    }
  };

  const exportData = (type: string) => {
    let data: any[] = [];
    let filename = '';
    
    switch (type) {
      case 'users':
        data = allUsers;
        filename = 'users.json';
        break;
      case 'cakes':
        data = savedDesigns;
        filename = 'cake-designs.json';
        break;
      case 'orders':
        data = orders;
        filename = 'orders.json';
        break;
      case 'portfolio':
        data = portfolioItems;
        filename = 'portfolio-items.json';
        break;
      case 'overview':
        data = {
          users: allUsers,
          cakes: savedDesigns,
          orders: orders,
          portfolio: portfolioItems,
          stats: {
            totalUsers: allUsers.length,
            buyers: buyers.length,
            bakers: bakers.length,
            totalCakes: savedDesigns.length,
            totalOrders: orders.length,
            totalPortfolioItems: portfolioItems.length
          }
        };
        filename = 'crumbsy-full-export.json';
        break;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TabButton = ({ id, label, icon: Icon, count }: { id: string; label: string; icon: any; count?: number }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs ${
          activeTab === id ? 'bg-white text-primary-600' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-red-600" />
                Crumbsy Admin Panel
              </h1>
              <p className="text-gray-600 mt-2">System administration and data management</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportData(activeTab)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon={BarChart3} />
            <TabButton id="users" label="Users" icon={Users} count={allUsers.length} />
            <TabButton id="cakes" label="Cake Designs" icon={Cake} count={savedDesigns.length} />
            <TabButton id="orders" label="Orders" icon={ShoppingCart} count={orders.length} />
            <TabButton id="portfolio" label="Portfolio" icon={Camera} count={portfolioItems.length} />
          </div>
        </div>

        {/* Search Bar */}
        {activeTab !== 'overview' && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-blue-900">{allUsers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Cake Designs</p>
                      <p className="text-2xl font-bold text-green-900">{savedDesigns.length}</p>
                    </div>
                    <Cake className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-purple-900">{orders.length}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Portfolio Items</p>
                      <p className="text-2xl font-bold text-orange-900">{portfolioItems.length}</p>
                    </div>
                    <Camera className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Buyers</span>
                      <span className="font-semibold text-blue-600">{buyers.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Bakers</span>
                      <span className="font-semibold text-green-600">{bakers.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                  <div className="space-y-2">
                    {['posted', 'baker-assigned', 'in-progress', 'delivered'].map(status => {
                      const count = orders.filter(o => o.status === status).length;
                      return (
                        <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-700 capitalize">{status.replace('-', ' ')}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.profilePicture ? (
                            <img className="h-10 w-10 rounded-full\" src={user.profilePicture} alt={user.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.type === 'buyer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.location && user.zipCode ? `${user.location}, ${user.zipCode}` : 'Not provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                </div>
              )}
            </div>
          )}

          {/* Cake Designs Tab */}
          {activeTab === 'cakes' && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCakes.map((cake) => {
                  const owner = allUsers.find(u => u.id === cake.userId);
                  return (
                    <div key={cake.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {cake.preview ? (
                        <img src={cake.preview} alt={cake.name} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                          <Cake className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 truncate">{cake.name}</h3>
                        <p className="text-sm text-gray-600">by {owner?.name || 'Unknown'}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <div>{cake.layers?.length || 0} tiers • {cake.shape}</div>
                          <div>Updated {formatDate(cake.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredCakes.length === 0 && (
                <div className="text-center py-8">
                  <Cake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No cake designs found</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Baker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const buyer = allUsers.find(u => u.id === order.buyerId);
                    const baker = order.bakerId ? allUsers.find(u => u.id === order.bakerId) : null;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.cakeDesign.name}</div>
                          <div className="text-sm text-gray-500">{order.deliveryZipCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {baker?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.expectedDeliveryDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.price ? `$${order.price}` : 'Not set'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No orders found</p>
                </div>
              )}
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPortfolio.map((item) => {
                  const baker = allUsers.find(u => u.id === item.bakerId);
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.caption} 
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1';
                        }}
                      />
                      <div className="p-4">
                        <p className="text-sm text-gray-700 line-clamp-2">{item.caption}</p>
                        <p className="text-xs text-gray-500 mt-2">by {baker?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">Added {formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredPortfolio.length === 0 && (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No portfolio items found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value as 'buyer' | 'baker' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="baker">Baker</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="City, State"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={editFormData.zipCode}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="12345"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};