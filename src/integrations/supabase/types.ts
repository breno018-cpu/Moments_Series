export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anime_access_links: {
        Row: {
          access_link: string
          anime_id: string
          updated_at: string
        }
        Insert: {
          access_link?: string
          anime_id: string
          updated_at?: string
        }
        Update: {
          access_link?: string
          anime_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      anime_categories: {
        Row: {
          anime_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          anime_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          anime_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anime_categories_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "animes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      animes: {
        Row: {
          audio_type: Database["public"]["Enums"]["audio_type"] | null
          created_at: string
          description: string
          episodes: number
          featured: boolean
          genre: string
          id: string
          image: string
          long_description: string
          price: number
          rating: number
          seasons: number
          title: string
          trailer: string | null
          updated_at: string
          year: number
        }
        Insert: {
          audio_type?: Database["public"]["Enums"]["audio_type"] | null
          created_at?: string
          description?: string
          episodes?: number
          featured?: boolean
          genre?: string
          id?: string
          image?: string
          long_description?: string
          price?: number
          rating?: number
          seasons?: number
          title: string
          trailer?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          audio_type?: Database["public"]["Enums"]["audio_type"] | null
          created_at?: string
          description?: string
          episodes?: number
          featured?: boolean
          genre?: string
          id?: string
          image?: string
          long_description?: string
          price?: number
          rating?: number
          seasons?: number
          title?: string
          trailer?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          customer_email: string
          id: string
          order_id: string | null
          used_at: string
        }
        Insert: {
          coupon_id: string
          customer_email: string
          id?: string
          order_id?: string | null
          used_at?: string
        }
        Update: {
          coupon_id?: string
          customer_email?: string
          id?: string
          order_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          max_uses: number | null
          min_purchase: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          max_uses?: number | null
          min_purchase?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          min_purchase?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      crm_contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          landing_page: string | null
          last_contact_at: string | null
          last_order_at: string | null
          name: string | null
          newsletter_opt_in: boolean
          newsletter_opt_in_at: string | null
          orders_count: number
          phone: string | null
          referrer: string | null
          source: string
          stage_id: string | null
          total_spent: number
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          landing_page?: string | null
          last_contact_at?: string | null
          last_order_at?: string | null
          name?: string | null
          newsletter_opt_in?: boolean
          newsletter_opt_in_at?: string | null
          orders_count?: number
          phone?: string | null
          referrer?: string | null
          source?: string
          stage_id?: string | null
          total_spent?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          landing_page?: string | null
          last_contact_at?: string | null
          last_order_at?: string | null
          name?: string | null
          newsletter_opt_in?: boolean
          newsletter_opt_in_at?: string | null
          orders_count?: number
          phone?: string | null
          referrer?: string | null
          source?: string
          stage_id?: string | null
          total_spent?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_form: {
        Row: {
          created_at: string
          email: string
          id: string
          landing_page: string | null
          message: string | null
          name: string | null
          phone: string | null
          processed: boolean
          referrer: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          landing_page?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          processed?: boolean
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          landing_page?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          processed?: boolean
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      crm_notes: {
        Row: {
          author_id: string | null
          body: string
          contact_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          contact_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          contact_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          color: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      crm_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      meta_events: {
        Row: {
          client_ip: string | null
          created_at: string
          currency: string | null
          customer_email_hash: string | null
          customer_phone_hash: string | null
          error_message: string | null
          event_id: string
          event_name: string
          event_time: string
          fbc: string | null
          fbp: string | null
          id: string
          match_quality_score: number | null
          meta_response: Json | null
          order_id: string | null
          source: string
          status: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          value: number | null
        }
        Insert: {
          client_ip?: string | null
          created_at?: string
          currency?: string | null
          customer_email_hash?: string | null
          customer_phone_hash?: string | null
          error_message?: string | null
          event_id: string
          event_name: string
          event_time?: string
          fbc?: string | null
          fbp?: string | null
          id?: string
          match_quality_score?: number | null
          meta_response?: Json | null
          order_id?: string | null
          source?: string
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          value?: number | null
        }
        Update: {
          client_ip?: string | null
          created_at?: string
          currency?: string | null
          customer_email_hash?: string | null
          customer_phone_hash?: string | null
          error_message?: string | null
          event_id?: string
          event_name?: string
          event_time?: string
          fbc?: string | null
          fbp?: string | null
          id?: string
          match_quality_score?: number | null
          meta_response?: Json | null
          order_id?: string | null
          source?: string
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          body_html: string
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          recipients_count: number
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
        }
        Insert: {
          body_html: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          recipients_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
        }
        Update: {
          body_html?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          recipients_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cart_recovery_sent_at: string | null
          created_at: string
          customer_cpf: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          email_status: string | null
          id: string
          landing_page: string | null
          mp_payment_id: string | null
          order_token: string | null
          payment_method: string
          payment_status: string
          pix_code: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          referrer: string | null
          resend_email_id: string | null
          series_id: string
          total_amount: number
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          cart_recovery_sent_at?: string | null
          created_at?: string
          customer_cpf: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          email_status?: string | null
          id?: string
          landing_page?: string | null
          mp_payment_id?: string | null
          order_token?: string | null
          payment_method?: string
          payment_status?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          referrer?: string | null
          resend_email_id?: string | null
          series_id: string
          total_amount: number
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          cart_recovery_sent_at?: string | null
          created_at?: string
          customer_cpf?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          email_status?: string | null
          id?: string
          landing_page?: string | null
          mp_payment_id?: string | null
          order_token?: string | null
          payment_method?: string
          payment_status?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          referrer?: string | null
          resend_email_id?: string | null
          series_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          id: string
          os: string | null
          page_path: string
          referrer: string | null
          session_id: string | null
          time_on_page: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          os?: string | null
          page_path: string
          referrer?: string | null
          session_id?: string | null
          time_on_page?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          os?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          time_on_page?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          access_count: number | null
          access_link: string
          access_token: string | null
          accessed_at: string | null
          id: string
          order_id: string
          purchased_at: string
          series_id: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          access_link: string
          access_token?: string | null
          accessed_at?: string | null
          id?: string
          order_id: string
          purchased_at?: string
          series_id: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          access_link?: string
          access_token?: string | null
          accessed_at?: string | null
          id?: string
          order_id?: string
          purchased_at?: string
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          audio_type: Database["public"]["Enums"]["audio_type"] | null
          created_at: string
          description: string
          episodes: number
          featured: boolean
          genre: string
          id: string
          image: string
          long_description: string
          price: number
          rating: number
          seasons: number
          title: string
          trailer: string | null
          updated_at: string
          year: number
        }
        Insert: {
          audio_type?: Database["public"]["Enums"]["audio_type"] | null
          created_at?: string
          description: string
          episodes?: number
          featured?: boolean
          genre: string
          id: string
          image: string
          long_description: string
          price: number
          rating: number
          seasons?: number
          title: string
          trailer?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          audio_type?: Database["public"]["Enums"]["audio_type"] | null
          created_at?: string
          description?: string
          episodes?: number
          featured?: boolean
          genre?: string
          id?: string
          image?: string
          long_description?: string
          price?: number
          rating?: number
          seasons?: number
          title?: string
          trailer?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      series_access_links: {
        Row: {
          access_link: string
          series_id: string
          updated_at: string
        }
        Insert: {
          access_link?: string
          series_id: string
          updated_at?: string
        }
        Update: {
          access_link?: string
          series_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      series_categories: {
        Row: {
          category_id: string
          created_at: string
          series_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          series_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_categories_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_ratings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_views: {
        Row: {
          created_at: string
          id: string
          series_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          series_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          series_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_views_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_anime_access_link: { Args: { _anime_id: string }; Returns: string }
      get_order_by_token: {
        Args: { token: string }
        Returns: {
          cart_recovery_sent_at: string | null
          created_at: string
          customer_cpf: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          email_status: string | null
          id: string
          landing_page: string | null
          mp_payment_id: string | null
          order_token: string | null
          payment_method: string
          payment_status: string
          pix_code: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          referrer: string | null
          resend_email_id: string | null
          series_id: string
          total_amount: number
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_purchases_by_order_token: {
        Args: { token: string }
        Returns: {
          access_link: string
          access_token: string
          id: string
          order_id: string
          purchased_at: string
          series_id: string
          user_id: string
        }[]
      }
      get_series_access_link: { Args: { _series_id: string }; Returns: string }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      update_page_view_time: {
        Args: { _id: string; _seconds: number }
        Returns: undefined
      }
      validate_and_register_access: {
        Args: { token: string }
        Returns: {
          access_link: string
          message: string
          series_id: string
          series_title: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin"
      audio_type: "dublado" | "legendado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      audio_type: ["dublado", "legendado"],
    },
  },
} as const
