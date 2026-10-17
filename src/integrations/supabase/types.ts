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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      carousel_sections: {
        Row: {
          created_at: string
          filter_category: string | null
          id: string
          is_visible: boolean
          layout_mode: string
          max_items: number
          posicao: number
          section_type: string
          show_rank: boolean
          sort_by: string
          sort_order: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          filter_category?: string | null
          id?: string
          is_visible?: boolean
          layout_mode?: string
          max_items?: number
          posicao?: number
          section_type?: string
          show_rank?: boolean
          sort_by?: string
          sort_order?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          filter_category?: string | null
          id?: string
          is_visible?: boolean
          layout_mode?: string
          max_items?: number
          posicao?: number
          section_type?: string
          show_rank?: boolean
          sort_by?: string
          sort_order?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          email_sent_at: string | null
          email_status: string | null
          id: string
          items: Json
          payment_method: string
          status: string
          total: number
          updated_at: string
          user_email: string
          user_name: string
        }
        Insert: {
          created_at?: string
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          items?: Json
          payment_method?: string
          status?: string
          total?: number
          updated_at?: string
          user_email: string
          user_name?: string
        }
        Update: {
          created_at?: string
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          items?: Json
          payment_method?: string
          status?: string
          total?: number
          updated_at?: string
          user_email?: string
          user_name?: string
        }
        Relationships: []
      }
      packs: {
        Row: {
          capa_url: string
          created_at: string
          descricao: string
          id: string
          is_active: boolean
          posicao: number
          preco_original: number
          preco_pack: number
          series_ids: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          capa_url?: string
          created_at?: string
          descricao?: string
          id?: string
          is_active?: boolean
          posicao?: number
          preco_original?: number
          preco_pack?: number
          series_ids?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          capa_url?: string
          created_at?: string
          descricao?: string
          id?: string
          is_active?: boolean
          posicao?: number
          preco_original?: number
          preco_pack?: number
          series_ids?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          capa_url: string
          categoria: string[]
          created_at: string
          data_adicao: string
          elenco: string[]
          fundo_url: string
          id: string
          is_adult: boolean
          is_hero: boolean
          link_acesso: string | null
          posicao: number
          preco: number
          rating: number
          resumo: string
          status: string
          stream_url: string | null
          temporadas: number
          titulo: string
          updated_at: string
          vendas_count: number
        }
        Insert: {
          capa_url?: string
          categoria?: string[]
          created_at?: string
          data_adicao?: string
          elenco?: string[]
          fundo_url?: string
          id?: string
          is_adult?: boolean
          is_hero?: boolean
          link_acesso?: string | null
          posicao?: number
          preco?: number
          rating?: number
          resumo?: string
          status?: string
          stream_url?: string | null
          temporadas?: number
          titulo: string
          updated_at?: string
          vendas_count?: number
        }
        Update: {
          capa_url?: string
          categoria?: string[]
          created_at?: string
          data_adicao?: string
          elenco?: string[]
          fundo_url?: string
          id?: string
          is_adult?: boolean
          is_hero?: boolean
          link_acesso?: string | null
          posicao?: number
          preco?: number
          rating?: number
          resumo?: string
          status?: string
          stream_url?: string | null
          temporadas?: number
          titulo?: string
          updated_at?: string
          vendas_count?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
