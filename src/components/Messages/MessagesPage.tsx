import React, { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { MessageSquare, User, Clock, DollarSign, X, Send, CheckCircle } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { orders, addMessage, assignBaker } = useOrderStore();
  const { user, getAllUsers } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');

  const allUsers = getAllUsers();

  // Get conversations based on user type
  const getConversations = () => {
    if (user?.type === 'buyer') {
      // For buyers: show orders with quotes grouped by baker
      const ordersWithQuotes = orders.filter(order => 
        order.buyerId === user.id && 
        order.quotes.some(q => q.isActive)
      );

      const conversations: any[] = [];
      
      ordersWithQuotes.forEach(order => {
        order.quotes.filter(q => q.isActive).forEach(quote => {
          const baker = allUsers.find(u => u.id === quote.bakerId);
          if (baker) {
            conversations.push({
              id: `${order.id}-${quote.bakerId}`,
              orderId: order.id,
              bakerId: quote.bakerId,
              order: order,
              baker: baker,
              quote: quote,
              lastMessage: order.messages
                .filter(m => m.senderId === quote.bakerId || m.senderId === user.id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
              unreadCount: 0 // Could implement unread tracking
            });
          }
        });
      });

      return conversations.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return bTime - aTime;
      });
    } else if (user?.type === 'baker') {
      // For bakers: show orders where they've sent quotes
      const myQuotedOrders = orders.filter(order => 
        order.quotes.some(q => q.bakerId === user.id && q.isActive)
      );

      return myQuotedOrders.map(order => {
        const buyer = allUsers.find(u => u.id === order.buyerId);
        const myQuote = order.quotes.find(q => q.bakerId === user.id && q.isActive);
        
        return {
          id: `${order.id}-${user.id}`,
          orderId: order.id,
          buyerId: order.buyerId,
          order: order,
          buyer: buyer,
          quote: myQuote,
          lastMessage: order.messages
            .filter(m => m.senderId === order.buyerId || m.senderId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
          unreadCount: 0
        };
      }).sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return bTime - aTime;
      });
    }

    return [];
  };

  const conversations = getConversations();

  const getConversationMessages = (conversation: any) => {
    if (!conversation) return [];
    
    const otherUserId = user?.type === 'buyer' ? conversation.bakerId : conversation.buyerId;
    
    return conversation.order.messages.filter((message: any) => 
      message.senderId === user?.id || message.senderId === otherUserId
    ).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    addMessage(selectedConversation.orderId, {
      senderId: user!.id,
      senderType: user!.type as 'buyer' | 'baker',
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleAssignBaker = (conversation: any) => {
    if (user?.type === 'buyer' && conversation.bakerId) {
      assignBaker(conversation.orderId, conversation.bakerId);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      successDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Baker assigned successfully!</span>
      `;
      
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">
          {user?.type === 'buyer' 
            ? 'Chat with bakers who have sent you quotes'
            : 'Chat with customers for your quoted orders'
          }
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Conversations ({conversations.length})
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {user?.type === 'buyer' 
                      ? 'Conversations will appear when bakers send you quotes'
                      : 'Conversations will appear when you send quotes to customers'
                    }
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherUser = user?.type === 'buyer' ? conversation.baker : conversation.buyer;
                  const isSelected = selectedConversation?.id === conversation.id;
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                        isSelected ? 'bg-primary-50 border-primary-200' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {otherUser?.profilePicture ? (
                          <img
                            src={otherUser.profilePicture}
                            alt={otherUser.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {otherUser?.name || 'Unknown User'}
                            </p>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 truncate mb-1">
                            {conversation.order.cakeDesign.name}
                          </p>
                          
                          {conversation.quote && (
                            <p className="text-xs font-medium text-green-600">
                              Quote: ${conversation.quote.price}
                            </p>
                          )}
                          
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {conversation.lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {(user?.type === 'buyer' ? selectedConversation.baker : selectedConversation.buyer)?.profilePicture ? (
                        <img
                          src={(user?.type === 'buyer' ? selectedConversation.baker : selectedConversation.buyer).profilePicture}
                          alt={(user?.type === 'buyer' ? selectedConversation.baker : selectedConversation.buyer).name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {(user?.type === 'buyer' ? selectedConversation.baker : selectedConversation.buyer)?.name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-600">{selectedConversation.order.cakeDesign.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {selectedConversation.quote && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            ${selectedConversation.quote.price}
                          </p>
                          <p className="text-xs text-gray-500">Quoted Price</p>
                        </div>
                      )}
                      
                      {/* Assign Baker Button (only for buyers on posted orders) */}
                      {user?.type === 'buyer' && selectedConversation.order.status === 'posted' && (
                        <button
                          onClick={() => handleAssignBaker(selectedConversation)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Assign Baker</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {getConversationMessages(selectedConversation).map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {message.isQuote && message.price && (
                          <div className="font-bold mb-1 flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Quote: ${message.price}</span>
                          </div>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.id ? 'text-primary-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};