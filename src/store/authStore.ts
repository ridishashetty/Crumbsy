import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  type: 'buyer' | 'baker' | 'admin';
  profilePicture?: string;
  location?: string;
  zipCode?: string;
  phone?: string;
  address?: string;
  cancelationDays?: number; // For bakers
  password: string; // In real app, this would be hashed
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[]; // Store all registered users
  login: (identifier: string, password: string) => { success: boolean; error?: string };
  signup: (userData: Omit<User, 'id'>) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  deleteUser: (userId: string) => void; // Admin function
  getAllUsers: () => User[]; // Admin function
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [],
      
      login: (identifier, password) => {
        const { users } = get();
        
        // Special admin login
        if (identifier === 'Admin' && password === 'admin@Crumbsy') {
          const adminUser: User = {
            id: 'admin-001',
            email: 'admin@crumbsy.com',
            name: 'System Administrator',
            username: 'Admin',
            type: 'admin',
            password: 'admin@Crumbsy',
            profilePicture: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
          };
          
          set({ user: adminUser, isAuthenticated: true });
          return { success: true };
        }
        
        // Regular user login - find by email or username and password
        const user = users.find(u => 
          (u.email === identifier || u.username === identifier) && 
          u.password === password
        );
        
        if (user) {
          set({ user, isAuthenticated: true });
          return { success: true };
        } else {
          return { success: false, error: 'Invalid credentials' };
        }
      },
      
      signup: (userData) => {
        const { users } = get();
        
        // Check if email already exists
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
          return { success: false, error: 'An account with this email already exists' };
        }
        
        // Check if username already exists (across all user types)
        const existingUsername = users.find(u => u.username === userData.username);
        if (existingUsername) {
          return { success: false, error: 'This username is already taken' };
        }
        
        // Create new user
        const newUser: User = {
          ...userData,
          id: Date.now().toString(),
        };
        
        set((state) => ({
          users: [...state.users, newUser],
          user: newUser,
          isAuthenticated: true,
        }));
        
        return { success: true };
      },
      
      logout: () => set({ user: null, isAuthenticated: false }),
      
      updateUser: (updates) => set((state) => {
        if (!state.user) return state;
        
        const updatedUser = { ...state.user, ...updates };
        const updatedUsers = state.users.map(u => 
          u.id === state.user!.id ? updatedUser : u
        );
        
        return {
          user: updatedUser,
          users: updatedUsers,
        };
      }),
      
      deleteUser: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId),
      })),
      
      getAllUsers: () => {
        const { users } = get();
        return users;
      },
    }),
    {
      name: 'crumbsy-auth-storage',
      partialize: (state) => ({ 
        users: state.users,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);