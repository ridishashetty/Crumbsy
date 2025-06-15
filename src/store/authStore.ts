import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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
  cancelationDays?: number;
  dbId: number; // Always use database ID
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: Omit<User, 'id' | 'dbId'>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: () => User[];
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,

      initializeAuth: async () => {
        try {
          console.log('🔄 Initializing auth...');
          
          // Check if we have a stored user
          const state = get();
          if (state.user) {
            console.log('✅ Found stored user:', state.user.username);
            set({ isAuthenticated: true, loading: false });
            return;
          }
          
          console.log('ℹ️ No stored user found');
          set({ user: null, isAuthenticated: false, loading: false });
        } catch (error) {
          console.error('❌ Auth initialization error:', error);
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },

      login: async (identifier, password) => {
        try {
          console.log('🔐 Login attempt for:', identifier);
          set({ loading: true });

          // Special admin login
          if (identifier === 'Admin' && password === 'admin@Crumbsy') {
            console.log('👑 Admin login detected');
            const adminUser: User = {
              id: 'admin-001',
              dbId: 0, // Special case for admin
              email: 'admin@crumbsy.com',
              name: 'System Administrator',
              username: 'Admin',
              type: 'admin',
              profilePicture: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
            };
            
            set({ user: adminUser, isAuthenticated: true, loading: false });
            console.log('✅ Admin login successful');
            return { success: true };
          }

          // Database login
          console.log('🔍 Checking database for user...');
          const { data: userData, error: loginError } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${identifier},email.eq.${identifier}`)
            .eq('password', password)
            .single();

          if (loginError || !userData) {
            console.log('❌ Login failed:', loginError?.message || 'No user found');
            set({ loading: false });
            return { success: false, error: 'Invalid credentials' };
          }

          console.log('✅ Database user found:', userData.username);
          
          const user: User = {
            id: `user-${userData.id}`,
            dbId: userData.id,
            email: userData.email,
            name: userData.full_name,
            username: userData.username,
            type: userData.user_type,
            profilePicture: userData.profile_picture || undefined,
            location: userData.location || undefined,
            zipCode: userData.zip_code || undefined,
            phone: userData.phone || undefined,
            address: userData.address || undefined,
            cancelationDays: userData.cancellation_days || undefined,
          };

          set({ user, isAuthenticated: true, loading: false });
          console.log('✅ Login successful');
          return { success: true };
        } catch (error) {
          console.error('❌ Login error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      signup: async (userData) => {
        try {
          console.log('📝 Signup attempt for:', userData.email);
          set({ loading: true });

          // Check if email already exists
          const { data: existingEmail } = await supabase
            .from('users')
            .select('email')
            .eq('email', userData.email)
            .single();

          if (existingEmail) {
            console.log('❌ Email already exists');
            set({ loading: false });
            return { success: false, error: 'An account with this email already exists' };
          }

          // Check if username already exists
          const { data: existingUsername } = await supabase
            .from('users')
            .select('username')
            .eq('username', userData.username)
            .single();

          if (existingUsername) {
            console.log('❌ Username already exists');
            set({ loading: false });
            return { success: false, error: 'This username is already taken' };
          }

          // Create new user
          console.log('➕ Creating new user...');
          const { data: newUserData, error: insertError } = await supabase
            .from('users')
            .insert({
              email: userData.email,
              username: userData.username,
              password: (userData as any).password || 'defaultpass',
              full_name: userData.name,
              user_type: userData.type,
              profile_picture: userData.profilePicture,
              location: userData.location,
              zip_code: userData.zipCode,
              phone: userData.phone,
              address: userData.address,
              cancellation_days: userData.cancelationDays
            })
            .select()
            .single();

          if (insertError || !newUserData) {
            console.error('❌ Database insert error:', insertError);
            set({ loading: false });
            return { success: false, error: 'Failed to create user account' };
          }

          console.log('✅ User created with ID:', newUserData.id);

          const newUser: User = {
            id: `user-${newUserData.id}`,
            dbId: newUserData.id,
            email: userData.email,
            name: userData.name,
            username: userData.username,
            type: userData.type,
            profilePicture: userData.profilePicture,
            location: userData.location,
            zipCode: userData.zipCode,
            phone: userData.phone,
            address: userData.address,
            cancelationDays: userData.cancelationDays,
          };

          set({ user: newUser, isAuthenticated: true, loading: false });
          console.log('✅ Signup successful');
          return { success: true };
        } catch (error) {
          console.error('❌ Signup error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        console.log('👋 Logging out');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user || user.type === 'admin') return;

        console.log('🔄 Updating user:', user.dbId);

        try {
          const { error } = await supabase
            .from('users')
            .update({
              location: updates.location,
              zip_code: updates.zipCode,
              phone: updates.phone,
              address: updates.address,
            })
            .eq('id', user.dbId);

          if (error) {
            console.error('❌ Update user error:', error);
            return;
          }

          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
          console.log('✅ User updated');
        } catch (error) {
          console.error('❌ Update user error:', error);
        }
      },

      deleteUser: async (userId) => {
        console.log('🗑️ Delete user not implemented for database users');
      },

      getAllUsers: () => {
        // This would need to be implemented to fetch from database
        // For now, return empty array since admin functionality needs rework
        return [];
      },
    }),
    {
      name: 'crumbsy-auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth when the store is created
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}