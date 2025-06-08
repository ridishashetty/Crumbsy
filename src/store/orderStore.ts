import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CakeDesign } from './cakeStore';

export interface Order {
  id: string;
  buyerId: string;
  bakerId?: string;
  cakeDesign: CakeDesign;
  deliveryAddress?: string;
  deliveryZipCode: string;
  expectedDeliveryDate: Date;
  status: 'posted' | 'baker-assigned' | 'in-progress' | 'out-for-delivery' | 'delivered' | 'cancelled';
  price?: number;
  modificationRequests?: string;
  otpCode?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date; // When baker was assigned
  messages: ChatMessage[];
  quotes: Quote[]; // Track all quotes from different bakers
}

export interface Quote {
  id: string;
  bakerId: string;
  price: number;
  modificationRequests: string;
  message: string;
  timestamp: Date;
  isActive: boolean; // Baker can revoke their quote
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'buyer' | 'baker';
  message: string;
  image?: string;
  price?: number;
  timestamp: Date;
  isQuote?: boolean; // Mark quote messages
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'quotes'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  assignBaker: (orderId: string, bakerId: string) => void;
  addMessage: (orderId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendQuote: (orderId: string, bakerId: string, price: number, modificationRequests: string, message: string) => void;
  revokeQuote: (orderId: string, bakerId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], otpCode?: string) => void;
  cancelOrder: (orderId: string, buyerId: string) => void;
  declineOrder: (orderId: string, bakerId: string) => void;
  setCurrentOrder: (order: Order | null) => void;
  getBuyerOrders: (buyerId: string) => Order[];
  canCancelOrder: (order: Order, userId: string, userType: 'buyer' | 'baker') => boolean;
  canDeclineOrder: (order: Order, bakerId: string) => boolean;
  getBakerQuote: (order: Order, bakerId: string) => Quote | undefined;
  hasActiveBakerQuote: (order: Order, bakerId: string) => boolean;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      createOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
          quotes: [],
        };
        
        set((state) => ({
          orders: [...state.orders, newOrder],
        }));
      },
      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === id
              ? { ...order, ...updates, updatedAt: new Date() }
              : order
          ),
        }));
      },
      assignBaker: (orderId, bakerId) => {
        get().updateOrder(orderId, {
          bakerId,
          status: 'baker-assigned',
          assignedAt: new Date(),
        });
      },
      addMessage: (orderId, messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  messages: [...order.messages, message],
                  updatedAt: new Date(),
                }
              : order
          ),
        }));
      },
      sendQuote: (orderId, bakerId, price, modificationRequests, message) => {
        const { orders } = get();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        // Check if baker already has an active quote
        const existingQuoteIndex = order.quotes.findIndex(q => q.bakerId === bakerId);
        
        const newQuote: Quote = {
          id: Date.now().toString(),
          bakerId,
          price,
          modificationRequests,
          message,
          timestamp: new Date(),
          isActive: true
        };
        
        let updatedQuotes;
        if (existingQuoteIndex >= 0) {
          // Replace existing quote
          updatedQuotes = [...order.quotes];
          updatedQuotes[existingQuoteIndex] = newQuote;
        } else {
          // Add new quote
          updatedQuotes = [...order.quotes, newQuote];
        }
        
        // Add quote message to chat
        const quoteMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          senderId: bakerId,
          senderType: 'baker',
          message: message,
          price: price,
          timestamp: new Date(),
          isQuote: true
        };
        
        get().updateOrder(orderId, {
          quotes: updatedQuotes,
          messages: [...order.messages, quoteMessage]
        });
      },
      revokeQuote: (orderId, bakerId) => {
        const { orders } = get();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        const updatedQuotes = order.quotes.map(quote =>
          quote.bakerId === bakerId
            ? { ...quote, isActive: false }
            : quote
        );
        
        // Add revocation message
        const revocationMessage: ChatMessage = {
          id: Date.now().toString(),
          senderId: bakerId,
          senderType: 'baker',
          message: 'Quote has been withdrawn.',
          timestamp: new Date(),
        };
        
        get().updateOrder(orderId, {
          quotes: updatedQuotes,
          messages: [...order.messages, revocationMessage]
        });
      },
      updateOrderStatus: (orderId, status, otpCode) => {
        const updates: Partial<Order> = { status };
        if (otpCode) {
          updates.otpCode = otpCode;
        }
        get().updateOrder(orderId, updates);
      },
      cancelOrder: (orderId, buyerId) => {
        const { orders } = get();
        const order = orders.find(o => o.id === orderId && o.buyerId === buyerId);
        
        if (order && get().canCancelOrder(order, buyerId, 'buyer')) {
          get().updateOrder(orderId, { status: 'cancelled' });
        }
      },
      declineOrder: (orderId, bakerId) => {
        const { orders } = get();
        const order = orders.find(o => o.id === orderId && o.bakerId === bakerId);
        
        if (order && get().canDeclineOrder(order, bakerId)) {
          get().updateOrder(orderId, { 
            status: 'posted',
            bakerId: undefined,
            assignedAt: undefined
          });
        }
      },
      setCurrentOrder: (order) => set({ currentOrder: order }),
      getBuyerOrders: (buyerId) => {
        const { orders } = get();
        return orders.filter(order => order.buyerId === buyerId);
      },
      canCancelOrder: (order, userId, userType) => {
        if (userType === 'buyer') {
          // Buyer can cancel if order is posted or if assigned but delivery is more than 3 days away
          if (order.status === 'posted') return true;
          if (order.status === 'baker-assigned') {
            const deliveryDate = new Date(order.expectedDeliveryDate);
            const now = new Date();
            const timeDiff = deliveryDate.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            // Also check if within 24 hours of assignment
            if (order.assignedAt) {
              const assignedTime = new Date(order.assignedAt);
              const hoursSinceAssigned = (now.getTime() - assignedTime.getTime()) / (1000 * 3600);
              return hoursSinceAssigned <= 24 && daysDiff > 3;
            }
          }
        }
        return false;
      },
      canDeclineOrder: (order, bakerId) => {
        if (order.status === 'baker-assigned' && order.bakerId === bakerId && order.assignedAt) {
          const now = new Date();
          const assignedTime = new Date(order.assignedAt);
          const hoursSinceAssigned = (now.getTime() - assignedTime.getTime()) / (1000 * 3600);
          return hoursSinceAssigned <= 24;
        }
        return false;
      },
      getBakerQuote: (order, bakerId) => {
        return order.quotes.find(q => q.bakerId === bakerId && q.isActive);
      },
      hasActiveBakerQuote: (order, bakerId) => {
        return order.quotes.some(q => q.bakerId === bakerId && q.isActive);
      },
    }),
    {
      name: 'crumbsy-order-storage',
      partialize: (state) => ({ 
        orders: state.orders,
        // Don't persist currentOrder to avoid stale data
      }),
    }
  )
);