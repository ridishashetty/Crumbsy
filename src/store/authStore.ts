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
  // Database ID for new schema
  dbId?: number;
  password?: string; // Keep for local fallback
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  users: User[]; // Keep local users for fallback
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string }>;
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
      users: [], // Keep existing users as fallback

      initializeAuth: async () => {
        try {
          console.log('Initializing auth...');
          
          // Check if we have a stored user and use local auth
          const state = get();
          if (state.user) {
            console.log('Found stored user:', state.user.username);
            set({ isAuthenticated: true, loading: false });
            return;
          }
          
          console.log('No stored user found');
          set({ user: null, isAuthenticated: false, loading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },

      login: async (identifier, password) => {
        try {
          console.log('=== LOGIN ATTEMPT ===');
          console.log('Identifier:', identifier);
          set({ loading: true });

          // Special admin login
          if (identifier === 'Admin' && password === 'admin@Crumbsy') {
            console.log('Admin login detected');
            const adminUser: User = {
              id: 'admin-001',
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

          // Try database login first
          try {
            console.log('Attempting database login...');
            const { data: userData, error: loginError } = await supabase
              .from('users')
              .select('*')
              .eq('username', identifier)
              .eq('password', password)
              .single();

            if (loginError) {
              console.log('Database login error:', loginError.message);
            } else if (userData) {
              console.log('✅ Database user found:', userData.username);
              
              const user: User = {
                id: `db-${userData.id}`,
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
                dbId: userData.id
              };

              set({ user, isAuthenticated: true, loading: false });
              console.log('✅ Database login successful');
              return { success: true };
            }
          } catch (dbError) {
            console.log('Database login failed, trying local auth:', dbError);
          }

          // Fallback to local auth
          console.log('Trying local auth...');
          const { users } = get();
          const user = users.find(u => 
            (u.email === identifier || u.username === identifier) && 
            u.password === password
          );
          
          if (user) {
            console.log('✅ Local user found:', user.username);
            set({ user, isAuthenticated: true, loading: false });
            return { success: true };
          }

          console.log('❌ Login failed - no matching user');
          set({ loading: false });
          return { success: false, error: 'Invalid credentials' };
        } catch (error) {
          console.error('❌ Login error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      signup: async (userData) => {
        try {
          console.log('=== SIGNUP ATTEMPT ===');
          console.log('User data:', { ...userData, password: '[HIDDEN]' });
          set({ loading: true });

          // Try database signup first
          try {
            console.log('Attempting database signup...');
            
            // Check if email already exists
            const { data: existingUser } = await supabase
              .from('users')
              .select('email')
              .eq('email', userData.email)
              .single();

            if (existingUser) {
              console.log('❌ Email already exists in database');
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
              console.log('❌ Username already exists in database');
              set({ loading: false });
              return { success: false, error: 'This username is already taken' };
            }

            // Create new user in database
            console.log('Creating new user in database...');
            const { data: newUserData, error: insertError } = await supabase
              .from('users')
              .insert({
                email: userData.email,
                username: userData.username,
                password: userData.password || 'defaultpass',
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
              throw new Error('Failed to create user account');
            }

            console.log('✅ User created in database with ID:', newUserData.id);

            // Create user object
            const newUser: User = {
              id: `db-${newUserData.id}`,
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
              dbId: newUserData.id
            };

            set({ user: newUser, isAuthenticated: true, loading: false });
            console.log('✅ Database signup successful');
            return { success: true };
          } catch (dbError) {
            console.log('❌ Database signup failed, using local auth:', dbError);
            
            // Fallback to local signup
            const { users } = get();
            
            // Check if email already exists locally
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
              set({ loading: false });
              return { success: false, error: 'An account with this email already exists' };
            }
            
            // Check if username already exists locally
            const existingUsername = users.find(u => u.username === userData.username);
            if (existingUsername) {
              set({ loading: false });
              return { success: false, error: 'This username is already taken' };
            }
            
            // Create new user locally
            const newUser: User = {
              ...userData,
              id: Date.now().toString(),
            };
            
            set((state) => ({
              users: [...state.users, newUser],
              user: newUser,
              isAuthenticated: true,
              loading: false
            }));
            
            console.log('✅ Local signup successful');
            return { success: true };
          }
        } catch (error) {
          console.error('❌ Signup error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        console.log('=== LOGOUT ===');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user) return;

        console.log('=== UPDATE USER ===');
        console.log('Updates:', updates);

        try {
          // Try database update if user has dbId
          if (user.dbId) {
            console.log('Updating user in database, ID:', user.dbId);
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
            } else {
              console.log('✅ User updated in database');
            }
          }

          // Update local state
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
          
          // Update in users array if it's a local user
          if (!user.dbId) {
            set((state) => ({
              users: state.users.map(u => 
                u.id === user.id ? updatedUser : u
              )
            }));
          }
          
          console.log('✅ User updated locally');
        } catch (error) {
          console.error('❌ Update user error:', error);
        }
      },

      deleteUser: async (userId) => {
        console.log('=== DELETE USER ===');
        console.log('User ID:', userId);
        set((state) => ({
          users: state.users.filter(u => u.id !== userId),
        }));
      },

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

// Initialize auth when the store is created
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}