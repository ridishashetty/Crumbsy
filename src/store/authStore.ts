import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  // Database IDs
  id_ua?: number;
  id_at?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
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

      initializeAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Get user data from database
            const userData = await getUserFromDatabase(session.user);
            if (userData) {
              set({ user: userData, isAuthenticated: true, loading: false });
              return;
            }
          }
          
          set({ user: null, isAuthenticated: false, loading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },

      login: async (identifier, password) => {
        try {
          set({ loading: true });

          // Special admin login
          if (identifier === 'Admin' && password === 'admin@Crumbsy') {
            const adminUser: User = {
              id: 'admin-001',
              email: 'admin@crumbsy.com',
              name: 'System Administrator',
              username: 'Admin',
              type: 'admin',
              profilePicture: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
            };
            
            set({ user: adminUser, isAuthenticated: true, loading: false });
            return { success: true };
          }

          // Check if identifier is email or username
          let email = identifier;
          
          // If it doesn't contain @, it's a username - look up email
          if (!identifier.includes('@')) {
            const { data: loginData, error: loginError } = await supabase
              .from('LoginInfo')
              .select(`
                UserAccount!inner(ua_Email)
              `)
              .eq('li_Username', identifier)
              .eq('li_Password', password)
              .limit(1);

            if (loginError || !loginData || loginData.length === 0) {
              set({ loading: false });
              return { success: false, error: 'Invalid credentials' };
            }

            email = loginData[0].UserAccount.ua_Email;
          } else {
            // Verify email/password combination
            const { data: loginData, error: loginError } = await supabase
              .from('LoginInfo')
              .select(`
                UserAccount!inner(ua_Email)
              `)
              .eq('UserAccount.ua_Email', email)
              .eq('li_Password', password)
              .limit(1);

            if (loginError || !loginData || loginData.length === 0) {
              set({ loading: false });
              return { success: false, error: 'Invalid credentials' };
            }
          }

          // Sign in with Supabase Auth using email
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) {
            // If user doesn't exist in Supabase Auth, create them
            if (authError.message.includes('Invalid login credentials')) {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password
              });

              if (signUpError) {
                set({ loading: false });
                return { success: false, error: signUpError.message };
              }

              if (signUpData.user) {
                const userData = await getUserFromDatabase(signUpData.user);
                if (userData) {
                  set({ user: userData, isAuthenticated: true, loading: false });
                  return { success: true };
                }
              }
            }
            
            set({ loading: false });
            return { success: false, error: authError.message };
          }

          if (authData.user) {
            const userData = await getUserFromDatabase(authData.user);
            if (userData) {
              set({ user: userData, isAuthenticated: true, loading: false });
              return { success: true };
            }
          }

          set({ loading: false });
          return { success: false, error: 'Failed to load user data' };
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      signup: async (userData) => {
        try {
          set({ loading: true });

          // Check if email already exists
          const { data: existingUser } = await supabase
            .from('UserAccount')
            .select('ua_Email')
            .eq('ua_Email', userData.email)
            .limit(1);

          if (existingUser && existingUser.length > 0) {
            set({ loading: false });
            return { success: false, error: 'An account with this email already exists' };
          }

          // Check if username already exists
          const { data: existingUsername } = await supabase
            .from('LoginInfo')
            .select('li_Username')
            .eq('li_Username', userData.username)
            .limit(1);

          if (existingUsername && existingUsername.length > 0) {
            set({ loading: false });
            return { success: false, error: 'This username is already taken' };
          }

          // Create Supabase Auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password
          });

          if (authError) {
            set({ loading: false });
            return { success: false, error: authError.message };
          }

          if (!authData.user) {
            set({ loading: false });
            return { success: false, error: 'Failed to create account' };
          }

          // Get account type ID
          const accountTypeMap = { buyer: 1, baker: 2, admin: 3 };
          const accountTypeId = accountTypeMap[userData.type];

          // Create UserAccount record
          const { data: userAccountData, error: userAccountError } = await supabase
            .from('UserAccount')
            .insert({
              ua_FullName: userData.name,
              ua_Email: userData.email,
              ua_ZipCode: userData.zipCode ? parseInt(userData.zipCode) : null,
              ua_FullAddress: userData.location,
              id_at: accountTypeId,
              created_by: null
            })
            .select()
            .limit(1);

          if (userAccountError || !userAccountData || userAccountData.length === 0) {
            set({ loading: false });
            return { success: false, error: 'Failed to create user account' };
          }

          // Create LoginInfo record
          const { error: loginInfoError } = await supabase
            .from('LoginInfo')
            .insert({
              id_ua: userAccountData[0].id_ua,
              li_Username: userData.username,
              li_Password: userData.password,
              created_by: userAccountData[0].id_ua
            });

          if (loginInfoError) {
            set({ loading: false });
            return { success: false, error: 'Failed to create login information' };
          }

          // Create user object
          const newUser: User = {
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            username: userData.username,
            type: userData.type,
            profilePicture: userData.profilePicture,
            location: userData.location,
            zipCode: userData.zipCode,
            cancelationDays: userData.cancelationDays,
            id_ua: userAccountData[0].id_ua,
            id_at: accountTypeId
          };

          set({ user: newUser, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (error) {
          console.error('Signup error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user || !user.id_ua) return;

        try {
          // Update UserAccount table
          const { error } = await supabase
            .from('UserAccount')
            .update({
              ua_ZipCode: updates.zipCode ? parseInt(updates.zipCode) : null,
              ua_FullAddress: updates.address || updates.location,
            })
            .eq('id_ua', user.id_ua);

          if (error) {
            console.error('Update user error:', error);
            return;
          }

          // Update local state
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
        } catch (error) {
          console.error('Update user error:', error);
        }
      },

      deleteUser: async (userId) => {
        // Admin function - implement as needed
        console.log('Delete user:', userId);
      },

      getAllUsers: () => {
        // Admin function - return empty array for now
        // In a real implementation, this would fetch from the database
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

// Helper function to get user data from database
async function getUserFromDatabase(supabaseUser: SupabaseUser): Promise<User | null> {
  try {
    const { data: userAccount, error } = await supabase
      .from('UserAccount')
      .select(`
        *,
        AccountType(at_AccountType),
        LoginInfo(li_Username)
      `)
      .eq('ua_Email', supabaseUser.email)
      .limit(1);

    if (error || !userAccount || userAccount.length === 0) {
      console.error('Error fetching user data:', error);
      return null;
    }

    const accountTypeMap: { [key: string]: 'buyer' | 'baker' | 'admin' } = {
      'buyer': 'buyer',
      'baker': 'baker', 
      'admin': 'admin'
    };

    const user = userAccount[0];

    return {
      id: supabaseUser.id,
      email: user.ua_Email,
      name: user.ua_FullName,
      username: user.LoginInfo?.[0]?.li_Username || '',
      type: accountTypeMap[user.AccountType?.at_AccountType] || 'buyer',
      location: user.ua_FullAddress,
      zipCode: user.ua_ZipCode?.toString(),
      id_ua: user.id_ua,
      id_at: user.id_at,
      profilePicture: `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
    };
  } catch (error) {
    console.error('Error in getUserFromDatabase:', error);
    return null;
  }
}

// Initialize auth when the store is created
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { initializeAuth } = useAuthStore.getState();
  
  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  } else if (event === 'SIGNED_IN' && session?.user) {
    await initializeAuth();
  }
});