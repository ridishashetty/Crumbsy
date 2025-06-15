import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      AccountType: {
        Row: {
          id_at: number;
          at_AccountType: string | null;
        };
        Insert: {
          id_at?: number;
          at_AccountType?: string | null;
        };
        Update: {
          id_at?: number;
          at_AccountType?: string | null;
        };
      };
      UserAccount: {
        Row: {
          id_ua: number;
          id_at: number | null;
          ua_FullName: string | null;
          ua_Email: string | null;
          ua_ZipCode: number | null;
          ua_FullAddress: string | null;
          created_by: number | null;
          created_at: string | null;
        };
        Insert: {
          id_ua?: number;
          id_at?: number | null;
          ua_FullName?: string | null;
          ua_Email?: string | null;
          ua_ZipCode?: number | null;
          ua_FullAddress?: string | null;
          created_by?: number | null;
          created_at?: string | null;
        };
        Update: {
          id_ua?: number;
          id_at?: number | null;
          ua_FullName?: string | null;
          ua_Email?: string | null;
          ua_ZipCode?: number | null;
          ua_FullAddress?: string | null;
          created_by?: number | null;
          created_at?: string | null;
        };
      };
      LoginInfo: {
        Row: {
          id_li: number;
          id_ua: number | null;
          li_Username: string | null;
          li_Password: string | null;
          created_at: string;
          created_by: number | null;
          updated_at: string | null;
          updated_by: number | null;
        };
        Insert: {
          id_li?: number;
          id_ua?: number | null;
          li_Username?: string | null;
          li_Password?: string | null;
          created_at?: string;
          created_by?: number | null;
          updated_at?: string | null;
          updated_by?: number | null;
        };
        Update: {
          id_li?: number;
          id_ua?: number | null;
          li_Username?: string | null;
          li_Password?: string | null;
          created_at?: string;
          created_by?: number | null;
          updated_at?: string | null;
          updated_by?: number | null;
        };
      };
      CakeFlavor: {
        Row: {
          id_cf: number;
          cf_CakeFlavor: string | null;
          cf_Color: any | null;
        };
        Insert: {
          id_cf?: number;
          cf_CakeFlavor?: string | null;
          cf_Color?: any | null;
        };
        Update: {
          id_cf?: number;
          cf_CakeFlavor?: string | null;
          cf_Color?: any | null;
        };
      };
      FrostingType: {
        Row: {
          id_ft: number;
          ft_FrostingName: string | null;
          ft_Color: any | null;
          ff_ColorChangeAllowed: boolean | null;
        };
        Insert: {
          id_ft?: number;
          ft_FrostingName?: string | null;
          ft_Color?: any | null;
          ff_ColorChangeAllowed?: boolean | null;
        };
        Update: {
          id_ft?: number;
          ft_FrostingName?: string | null;
          ft_Color?: any | null;
          ff_ColorChangeAllowed?: boolean | null;
        };
      };
      FrostingFlavor: {
        Row: {
          id_ff: number;
          ff_FlavorName: string | null;
        };
        Insert: {
          id_ff?: number;
          ff_FlavorName?: string | null;
        };
        Update: {
          id_ff?: number;
          ff_FlavorName?: string | null;
        };
      };
      ToppingType: {
        Row: {
          id_tt: number;
          tt_ToppingName: string | null;
          tt_Icon: string | null;
        };
        Insert: {
          id_tt?: number;
          tt_ToppingName?: string | null;
          tt_Icon?: string | null;
        };
        Update: {
          id_tt?: number;
          tt_ToppingName?: string | null;
          tt_Icon?: string | null;
        };
      };
      CakeDesign: {
        Row: {
          id_cd: number;
          cd_Name: string;
          id_ua: number | null;
          cd_TextOnCake: string | null;
          created_at: string | null;
          created_by: number | null;
          updated_by: number | null;
          updated_at: string | null;
        };
        Insert: {
          id_cd?: number;
          cd_Name: string;
          id_ua?: number | null;
          cd_TextOnCake?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          updated_by?: number | null;
          updated_at?: string | null;
        };
        Update: {
          id_cd?: number;
          cd_Name?: string;
          id_ua?: number | null;
          cd_TextOnCake?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          updated_by?: number | null;
          updated_at?: string | null;
        };
      };
      CakeTier: {
        Row: {
          id_ct: number;
          id_ua: number | null;
          id_cf: number | null;
          id_ft: number | null;
          id_ff: number | null;
          ct_FrostingColor: any | null;
          ct_CakeColor: any | null;
          created_by: number | null;
          created_at: string | null;
          updated_by: number | null;
          updated_at: string | null;
        };
        Insert: {
          id_ct?: number;
          id_ua?: number | null;
          id_cf?: number | null;
          id_ft?: number | null;
          id_ff?: number | null;
          ct_FrostingColor?: any | null;
          ct_CakeColor?: any | null;
          created_by?: number | null;
          created_at?: string | null;
          updated_by?: number | null;
          updated_at?: string | null;
        };
        Update: {
          id_ct?: number;
          id_ua?: number | null;
          id_cf?: number | null;
          id_ft?: number | null;
          id_ff?: number | null;
          ct_FrostingColor?: any | null;
          ct_CakeColor?: any | null;
          created_by?: number | null;
          created_at?: string | null;
          updated_by?: number | null;
          updated_at?: string | null;
        };
      };
      CakeDesignTier: {
        Row: {
          id_cdt: number;
          id_cd: number | null;
          id_ct: number | null;
          created_at: string | null;
          created_by: number | null;
          cdt_deleted: boolean | null;
        };
        Insert: {
          id_cdt?: number;
          id_cd?: number | null;
          id_ct?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          cdt_deleted?: boolean | null;
        };
        Update: {
          id_cdt?: number;
          id_cd?: number | null;
          id_ct?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          cdt_deleted?: boolean | null;
        };
      };
      Orders: {
        Row: {
          id_o: number;
          id_cd: number | null;
          baker_ua: number | null;
        };
        Insert: {
          id_o?: number;
          id_cd?: number | null;
          baker_ua?: number | null;
        };
        Update: {
          id_o?: number;
          id_cd?: number | null;
          baker_ua?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}