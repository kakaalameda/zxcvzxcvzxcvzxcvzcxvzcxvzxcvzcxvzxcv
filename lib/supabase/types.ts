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
      lookbook_sections: {
        Row: {
          id: number;
          eyebrow: string;
          title: string;
          text: string;
          product_id: number | null;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          eyebrow?: string;
          title: string;
          text?: string;
          product_id?: number | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lookbook_sections"]["Insert"]>;
        Relationships: [];
      };
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
          stock_count: number;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          name: string;
          hex: string;
          bg_class: string;
          stock_count?: number;
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
          color_id: number | null;
          alt: string;
          bg_class: string;
          icon_path: string;
          image_url: string | null;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          color_id?: number | null;
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
          color_id: number | null;
          size: "S" | "M" | "L" | "XL" | "XXL";
          available: boolean;
          position: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          color_id?: number | null;
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
      categories: {
        Row: {
          id: number;
          slug: string;
          name: string;
          parent_id: number | null;
          sort_order: number;
          visible_frontend: boolean;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          slug: string;
          name: string;
          parent_id?: number | null;
          sort_order?: number;
          visible_frontend?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      product_attributes: {
        Row: {
          id: number;
          product_id: number;
          key: string;
          value: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          key: string;
          value: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_attributes"]["Insert"]>;
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
          slug: string | null;
          category_id: number | null;
          is_active: boolean;
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
          slug?: string | null;
          category_id?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      shipping_api_configs: {
        Row: {
          provider: string;
          base_url: string;
          api_token: string;
          client_source: string;
          pick_name: string;
          pick_address_id: string | null;
          pick_address: string;
          pick_province: string;
          pick_district: string;
          pick_ward: string | null;
          pick_tel: string;
          transport: "road" | "fly";
          default_product_weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          provider: string;
          base_url: string;
          api_token: string;
          client_source: string;
          pick_name: string;
          pick_address_id?: string | null;
          pick_address: string;
          pick_province: string;
          pick_district: string;
          pick_ward?: string | null;
          pick_tel: string;
          transport?: "road" | "fly";
          default_product_weight?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["shipping_api_configs"]["Insert"]
        >;
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
    Functions: {
      admin_upsert_product: {
        Args: {
          p_product_id: number | null;
          p_name: string;
          p_subtitle: string;
          p_category: "Tee" | "Hoodie" | "Pants";
          p_description: string;
          p_price: number;
          p_old_price: number | null;
          p_tag: string | null;
          p_tag_variant: "gold" | "white" | "red" | "outline" | null;
          p_rating: number;
          p_review_count: number;
          p_featured: boolean;
          p_sort_order: number;
          p_specs: Json;
          p_features: Json;
          p_color_variants: Json;
          p_general_images: Json;
        };
        Returns: number;
      };
      create_guest_order_with_stock: {
        Args: {
          p_order_number: string;
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email: string | null;
          p_province: string;
          p_district: string | null;
          p_ward: string | null;
          p_address: string;
          p_note: string | null;
          p_payment_method: "cod" | "qr";
          p_voucher_code: string | null;
          p_discount_pct: number;
          p_discount_label: string | null;
          p_subtotal: number;
          p_discount_amount: number;
          p_shipping_fee: number;
          p_total: number;
          p_items: Json;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
