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

// Database types for the new simplified schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string;
          username: string;
          password: string;
          full_name: string;
          user_type: 'buyer' | 'baker' | 'admin';
          profile_picture: string | null;
          location: string | null;
          zip_code: string | null;
          phone: string | null;
          address: string | null;
          cancellation_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          email: string;
          username: string;
          password: string;
          full_name: string;
          user_type: 'buyer' | 'baker' | 'admin';
          profile_picture?: string | null;
          location?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          address?: string | null;
          cancellation_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          email?: string;
          username?: string;
          password?: string;
          full_name?: string;
          user_type?: 'buyer' | 'baker' | 'admin';
          profile_picture?: string | null;
          location?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          address?: string | null;
          cancellation_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cake_designs: {
        Row: {
          id: number;
          user_id: number;
          name: string;
          shape: 'round' | 'square';
          buttercream: any;
          toppings: any;
          top_text: string | null;
          preview_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: number;
          name: string;
          shape?: 'round' | 'square';
          buttercream?: any;
          toppings?: any;
          top_text?: string | null;
          preview_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: number;
          name?: string;
          shape?: 'round' | 'square';
          buttercream?: any;
          toppings?: any;
          top_text?: string | null;
          preview_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cake_tiers: {
        Row: {
          id: number;
          design_id: number;
          tier_order: number;
          flavor: string;
          color: string;
          frosting: string;
          frosting_color: string;
          top_design: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          design_id: number;
          tier_order: number;
          flavor: string;
          color: string;
          frosting?: string;
          frosting_color?: string;
          top_design?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          design_id?: number;
          tier_order?: number;
          flavor?: string;
          color?: string;
          frosting?: string;
          frosting_color?: string;
          top_design?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          buyer_id: number;
          baker_id: number | null;
          design_id: number;
          delivery_address: string | null;
          delivery_zip_code: string;
          expected_delivery_date: string;
          status: 'posted' | 'baker-assigned' | 'in-progress' | 'out-for-delivery' | 'delivered' | 'cancelled';
          price: number | null;
          modification_requests: string | null;
          otp_code: string | null;
          assigned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          buyer_id: number;
          baker_id?: number | null;
          design_id: number;
          delivery_address?: string | null;
          delivery_zip_code: string;
          expected_delivery_date: string;
          status?: 'posted' | 'baker-assigned' | 'in-progress' | 'out-for-delivery' | 'delivered' | 'cancelled';
          price?: number | null;
          modification_requests?: string | null;
          otp_code?: string | null;
          assigned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          buyer_id?: number;
          baker_id?: number | null;
          design_id?: number;
          delivery_address?: string | null;
          delivery_zip_code?: string;
          expected_delivery_date?: string;
          status?: 'posted' | 'baker-assigned' | 'in-progress' | 'out-for-delivery' | 'delivered' | 'cancelled';
          price?: number | null;
          modification_requests?: string | null;
          otp_code?: string | null;
          assigned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: number;
          order_id: number;
          baker_id: number;
          price: number;
          modification_requests: string | null;
          message: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_id: number;
          baker_id: number;
          price: number;
          modification_requests?: string | null;
          message: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_id?: number;
          baker_id?: number;
          price?: number;
          modification_requests?: string | null;
          message?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: number;
          order_id: number;
          sender_id: number;
          sender_type: 'buyer' | 'baker';
          message: string;
          image_url: string | null;
          price: number | null;
          is_quote: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: number;
          sender_id: number;
          sender_type: 'buyer' | 'baker';
          message: string;
          image_url?: string | null;
          price?: number | null;
          is_quote?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: number;
          sender_id?: number;
          sender_type?: 'buyer' | 'baker';
          message?: string;
          image_url?: string | null;
          price?: number | null;
          is_quote?: boolean | null;
          created_at?: string;
        };
      };
      portfolio_items: {
        Row: {
          id: number;
          baker_id: number;
          image_url: string;
          caption: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          baker_id: number;
          image_url: string;
          caption: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          baker_id?: number;
          image_url?: string;
          caption?: string;
          created_at?: string;
          updated_at?: string;
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