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
  // Database IDs
  id_ua?: number;
  id_at?: number;
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
          // For now, just check if we have a stored user and use local auth
          const state = get();
          if (state.user) {
            set({ isAuthenticated: true, loading: false });
            return;
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

          // Try database login first
          try {
            let email = identifier;
            let userData = null;
            
            // If it doesn't contain @, it's a username - look up email
            if (!identifier.includes('@')) {
              const { data: loginData, error: loginError } = await supabase
                .from('LoginInfo')
                .select(`
                  li_Username,
                  li_Password,
                  UserAccount!inner(
                    id_ua,
                    ua_Email,
                    ua_FullName,
                    ua_ZipCode,
                    ua_FullAddress,
                    id_at,
                    AccountType(at_AccountType)
                  )
                `)
                .eq('li_Username', identifier)
                .eq('li_Password', password)
                .limit(1);

              if (!loginError && loginData && loginData.length > 0) {
                const dbUser = loginData[0];
                const accountTypeMap: { [key: string]: 'buyer' | 'baker' | 'admin' } = {
                  'buyer': 'buyer',
                  'baker': 'baker', 
                  'admin': 'admin'
                };

                userData = {
                  id: `db-${dbUser.UserAccount.id_ua}`,
                  email: dbUser.UserAccount.ua_Email,
                  name: dbUser.UserAccount.ua_FullName,
                  username: dbUser.li_Username,
                  type: accountTypeMap[dbUser.UserAccount.AccountType?.at_AccountType] || 'buyer',
                  location: dbUser.UserAccount.ua_FullAddress,
                  zipCode: dbUser.UserAccount.ua_ZipCode?.toString(),
                  id_ua: dbUser.UserAccount.id_ua,
                  id_at: dbUser.UserAccount.id_at,
                  profilePicture: `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
                };
              }
            } else {
              // Email login
              const { data: loginData, error: loginError } = await supabase
                .from('LoginInfo')
                .select(`
                  li_Username,
                  li_Password,
                  UserAccount!inner(
                    id_ua,
                    ua_Email,
                    ua_FullName,
                    ua_ZipCode,
                    ua_FullAddress,
                    id_at,
                    AccountType(at_AccountType)
                  )
                `)
                .eq('UserAccount.ua_Email', email)
                .eq('li_Password', password)
                .limit(1);

              if (!loginError && loginData && loginData.length > 0) {
                const dbUser = loginData[0];
                const accountTypeMap: { [key: string]: 'buyer' | 'baker' | 'admin' } = {
                  'buyer': 'buyer',
                  'baker': 'baker', 
                  'admin': 'admin'
                };

                userData = {
                  id: `db-${dbUser.UserAccount.id_ua}`,
                  email: dbUser.UserAccount.ua_Email,
                  name: dbUser.UserAccount.ua_FullName,
                  username: dbUser.li_Username,
                  type: accountTypeMap[dbUser.UserAccount.AccountType?.at_AccountType] || 'buyer',
                  location: dbUser.UserAccount.ua_FullAddress,
                  zipCode: dbUser.UserAccount.ua_ZipCode?.toString(),
                  id_ua: dbUser.UserAccount.id_ua,
                  id_at: dbUser.UserAccount.id_at,
                  profilePicture: `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
                };
              }
            }

            if (userData) {
              set({ user: userData, isAuthenticated: true, loading: false });
              return { success: true };
            }
          } catch (dbError) {
            console.log('Database login failed, trying local auth:', dbError);
          }

          // Fallback to local auth
          const { users } = get();
          const user = users.find(u => 
            (u.email === identifier || u.username === identifier) && 
            u.password === password
          );
          
          if (user) {
            set({ user, isAuthenticated: true, loading: false });
            return { success: true };
          }

          set({ loading: false });
          return { success: false, error: 'Invalid credentials' };
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      signup: async (userData) => {
        try {
          set({ loading: true });

          // Try database signup first
          try {
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

            // Get account type ID
            const accountTypeMap = { buyer: 3, baker: 2, admin: 1 }; // Updated mapping
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
              throw new Error('Failed to create user account');
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
              throw new Error('Failed to create login information');
            }

            // Create user object
            const newUser: User = {
              id: `db-${userAccountData[0].id_ua}`,
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
          } catch (dbError) {
            console.log('Database signup failed, using local auth:', dbError);
            
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
            
            return { success: true };
          }
        } catch (error) {
          console.error('Signup error:', error);
          set({ loading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user) return;

        try {
          // Try database update if user has id_ua
          if (user.id_ua) {
            const { error } = await supabase
              .from('UserAccount')
              .update({
                ua_ZipCode: updates.zipCode ? parseInt(updates.zipCode) : null,
                ua_FullAddress: updates.address || updates.location,
              })
              .eq('id_ua', user.id_ua);

            if (error) {
              console.error('Update user error:', error);
            }
          }

          // Update local state
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
          
          // Update in users array if it's a local user
          if (!user.id_ua) {
            set((state) => ({
              users: state.users.map(u => 
                u.id === user.id ? updatedUser : u
              )
            }));
          }
        } catch (error) {
          console.error('Update user error:', error);
        }
      },

      deleteUser: async (userId) => {
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