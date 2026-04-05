export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      order_items: {
        Row: {
          id: number;
          order_id: string;
          product_id: number;
          product_name: string;
          product_href: string;
          variant_label: string;
          qty: number;
          unit_price: number;
          line_total: number;
          bg_class: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: string;
          product_id: number;
          product_name: string;
          product_href: string;
          variant_label: string;
          qty: number;
          unit_price: number;
          line_total: number;
          bg_class: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          province: string;
          district: string | null;
          ward: string | null;
          address: string;
          note: string | null;
          payment_method: "cod" | "qr";
          voucher_code: string | null;
          discount_pct: number;
          discount_label: string | null;
          subtotal: number;
          discount_amount: number;
          shipping_fee: number;
          total: number;
          status: "pending" | "confirmed" | "shipped" | "cancelled";
          tracking_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          province: string;
          district?: string | null;
          ward?: string | null;
          address: string;
          note?: string | null;
          payment_method: "cod" | "qr";
          voucher_code?: string | null;
          discount_pct?: number;
          discount_label?: string | null;
          subtotal: number;
          discount_amount: number;
          shipping_fee: number;
          total: number;
          status?: "pending" | "confirmed" | "shipped" | "cancelled";
          tracking_code?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      product_colors: {
        Row: {
          id: number;
          product_id: number;
          name: string;
          hex: string;
          bg_class: string;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          name: string;
          hex: string;
          bg_class: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_colors"]["Insert"]>;
        Relationships: [];
      };
      product_features: {
        Row: {
          id: number;
          product_id: number;
          value: string;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          value: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_features"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: number;
          product_id: number;
          alt: string;
          bg_class: string;
          icon_path: string;
          image_url: string | null;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          alt: string;
          bg_class: string;
          icon_path: string;
          image_url?: string | null;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_sizes: {
        Row: {
          id: number;
          product_id: number;
          size: "S" | "M" | "L" | "XL" | "XXL";
          available: boolean;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          size: "S" | "M" | "L" | "XL" | "XXL";
          available?: boolean;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_sizes"]["Insert"]>;
        Relationships: [];
      };
      product_specs: {
        Row: {
          id: number;
          product_id: number;
          label: string;
          value: string;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          label: string;
          value: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_specs"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          name: string;
          subtitle: string;
          category: "Tee" | "Hoodie" | "Pants";
          description: string;
          price: number;
          old_price: number | null;
          tag: string | null;
          tag_variant: "gold" | "white" | "red" | "outline" | null;
          rating: number;
          review_count: number;
          stock_count: number;
          featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          subtitle: string;
          category: "Tee" | "Hoodie" | "Pants";
          description: string;
          price: number;
          old_price?: number | null;
          tag?: string | null;
          tag_variant?: "gold" | "white" | "red" | "outline" | null;
          rating?: number;
          review_count?: number;
          stock_count?: number;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      vouchers: {
        Row: {
          code: string;
          pct: number;
          label: string;
          description: string;
          active: boolean;
          max_uses: number | null;
          used_count: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          pct: number;
          label: string;
          description: string;
          active?: boolean;
          max_uses?: number | null;
          used_count?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vouchers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
