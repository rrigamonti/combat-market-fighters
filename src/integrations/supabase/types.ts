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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_rates: {
        Row: {
          created_at: string
          fighter_id: string | null
          id: string
          product_id: string | null
          rate_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fighter_id?: string | null
          id?: string
          product_id?: string | null
          rate_percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fighter_id?: string | null
          id?: string
          product_id?: string | null
          rate_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fighter_products: {
        Row: {
          created_at: string
          fighter_id: string
          id: string
          order_index: number
          product_id: string
        }
        Insert: {
          created_at?: string
          fighter_id: string
          id?: string
          order_index?: number
          product_id: string
        }
        Update: {
          created_at?: string
          fighter_id?: string
          id?: string
          order_index?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fighter_products_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fighters: {
        Row: {
          app_username: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          handle: string | null
          hero_image_url: string | null
          id: string
          is_featured: boolean
          pending_changes: Json | null
          profile_image_url: string | null
          short_bio: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_snapchat: string | null
          social_tapology: string | null
          social_tiktok: string | null
          social_twitter: string | null
          social_youtube: string | null
          sport: string | null
          status: Database["public"]["Enums"]["fighter_status"]
          storefront_password: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          app_username?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          handle?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          pending_changes?: Json | null
          profile_image_url?: string | null
          short_bio?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_snapchat?: string | null
          social_tapology?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          sport?: string | null
          status?: Database["public"]["Enums"]["fighter_status"]
          storefront_password?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          app_username?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          handle?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          pending_changes?: Json | null
          profile_image_url?: string | null
          short_bio?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_snapchat?: string | null
          social_tapology?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          sport?: string | null
          status?: Database["public"]["Enums"]["fighter_status"]
          storefront_password?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      float_ledger: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          idempotency_key: string | null
          merchant_id: string
          mission_id: string | null
          posted_at: string | null
          posted_by: string | null
          reference: string | null
          status: Database["public"]["Enums"]["ledger_entry_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          idempotency_key?: string | null
          merchant_id: string
          mission_id?: string | null
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["ledger_entry_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          idempotency_key?: string | null
          merchant_id?: string
          mission_id?: string | null
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["ledger_entry_status"]
        }
        Relationships: [
          {
            foreignKeyName: "float_ledger_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "float_ledger_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          status: Database["public"]["Enums"]["merchant_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      mission_participations: {
        Row: {
          assigned_by: string | null
          fighter_id: string
          id: string
          joined_at: string
          mission_id: string
          status: Database["public"]["Enums"]["participation_status"]
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          fighter_id: string
          id?: string
          joined_at?: string
          mission_id: string
          status?: Database["public"]["Enums"]["participation_status"]
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          fighter_id?: string
          id?: string
          joined_at?: string
          mission_id?: string
          status?: Database["public"]["Enums"]["participation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_participations_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_participations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          assignment_mode: string
          budget: number | null
          created_at: string
          created_by: string | null
          current_participants: number | null
          description: string | null
          end_date: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"] | null
          id: string
          image_url: string | null
          instructions: string | null
          max_participants: number | null
          merchant_id: string
          mission_type: Database["public"]["Enums"]["mission_type"]
          name: string
          reward_per_participant: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["mission_status"]
          targeting_criteria: Json | null
          updated_at: string
          validation_mode: Database["public"]["Enums"]["validation_mode"] | null
        }
        Insert: {
          assignment_mode?: string
          budget?: number | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          max_participants?: number | null
          merchant_id: string
          mission_type?: Database["public"]["Enums"]["mission_type"]
          name: string
          reward_per_participant?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          targeting_criteria?: Json | null
          updated_at?: string
          validation_mode?:
            | Database["public"]["Enums"]["validation_mode"]
            | null
        }
        Update: {
          assignment_mode?: string
          budget?: number | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          max_participants?: number | null
          merchant_id?: string
          mission_type?: Database["public"]["Enums"]["mission_type"]
          name?: string
          reward_per_participant?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          targeting_criteria?: Json | null
          updated_at?: string
          validation_mode?:
            | Database["public"]["Enums"]["validation_mode"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          clicked_at: string
          fighter_id: string
          id: string
          product_id: string
          referrer: string | null
        }
        Insert: {
          clicked_at?: string
          fighter_id: string
          id?: string
          product_id: string
          referrer?: string | null
        }
        Update: {
          clicked_at?: string
          fighter_id?: string
          id?: string
          product_id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_log: Json | null
          failed_count: number
          file_name: string | null
          id: string
          imported_count: number
          source_type: string
          status: string
          total_products: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          failed_count?: number
          file_name?: string | null
          id?: string
          imported_count?: number
          source_type: string
          status?: string
          total_products?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          failed_count?: number
          file_name?: string | null
          id?: string
          imported_count?: number
          source_type?: string
          status?: string
          total_products?: number
        }
        Relationships: []
      }
      product_requests: {
        Row: {
          admin_notes: string | null
          brand_name: string | null
          created_at: string
          fighter_id: string
          id: string
          linked_product_id: string | null
          product_name: string
          product_url: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          brand_name?: string | null
          created_at?: string
          fighter_id: string
          id?: string
          linked_product_id?: string | null
          product_name: string
          product_url?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          brand_name?: string | null
          created_at?: string
          fighter_id?: string
          id?: string
          linked_product_id?: string | null
          product_name?: string
          product_url?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_requests_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          affiliate_network: string | null
          brand: string
          brand_id: string | null
          category: string | null
          created_at: string
          default_commission_rate: number | null
          discount_percentage: number | null
          external_url: string
          id: string
          image_url: string | null
          last_synced_at: string | null
          long_description: string | null
          name: string
          network_product_id: string | null
          price: string
          short_description: string | null
          slug: string
          source_type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          affiliate_network?: string | null
          brand: string
          brand_id?: string | null
          category?: string | null
          created_at?: string
          default_commission_rate?: number | null
          discount_percentage?: number | null
          external_url: string
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          long_description?: string | null
          name: string
          network_product_id?: string | null
          price: string
          short_description?: string | null
          slug: string
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          affiliate_network?: string | null
          brand?: string
          brand_id?: string | null
          category?: string | null
          created_at?: string
          default_commission_rate?: number | null
          discount_percentage?: number | null
          external_url?: string
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          long_description?: string | null
          name?: string
          network_product_id?: string | null
          price?: string
          short_description?: string | null
          slug?: string
          source_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          affiliate_network: string | null
          commission_rate_used: number
          created_at: string
          currency: string
          external_order_id: string | null
          fighter_commission: number
          fighter_id: string
          id: string
          network_commission: number
          product_id: string | null
          raw_payload: Json | null
          sale_amount: number
          sale_date: string | null
          status: string
        }
        Insert: {
          affiliate_network?: string | null
          commission_rate_used: number
          created_at?: string
          currency?: string
          external_order_id?: string | null
          fighter_commission: number
          fighter_id: string
          id?: string
          network_commission: number
          product_id?: string | null
          raw_payload?: Json | null
          sale_amount: number
          sale_date?: string | null
          status?: string
        }
        Update: {
          affiliate_network?: string | null
          commission_rate_used?: number
          created_at?: string
          currency?: string
          external_order_id?: string | null
          fighter_commission?: number
          fighter_id?: string
          id?: string
          network_commission?: number
          product_id?: string | null
          raw_payload?: Json | null
          sale_amount?: number
          sale_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sovrn_merchants: {
        Row: {
          avg_order_value: number | null
          category: string | null
          commission_rate: number | null
          conversion_rate: number | null
          created_at: string
          domain: string | null
          enabled: boolean
          id: string
          last_synced_at: string | null
          merchant_id: number
          metadata: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          avg_order_value?: number | null
          category?: string | null
          commission_rate?: number | null
          conversion_rate?: number | null
          created_at?: string
          domain?: string | null
          enabled?: boolean
          id?: string
          last_synced_at?: string | null
          merchant_id: number
          metadata?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          avg_order_value?: number | null
          category?: string | null
          commission_rate?: number | null
          conversion_rate?: number | null
          created_at?: string
          domain?: string | null
          enabled?: boolean
          id?: string
          last_synced_at?: string | null
          merchant_id?: number
          metadata?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      storefront_views: {
        Row: {
          fighter_id: string
          id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          fighter_id: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          fighter_id?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_views_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string
          evidence_notes: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"] | null
          evidence_url: string | null
          fighter_id: string
          id: string
          mission_id: string
          paid_at: string | null
          participation_id: string
          payout_amount: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          created_at?: string
          evidence_notes?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          evidence_url?: string | null
          fighter_id: string
          id?: string
          mission_id: string
          paid_at?: string | null
          participation_id: string
          payout_amount?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          created_at?: string
          evidence_notes?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          evidence_url?: string | null
          fighter_id?: string
          id?: string
          mission_id?: string
          paid_at?: string | null
          participation_id?: string
          payout_amount?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "submissions_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: false
            referencedRelation: "mission_participations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          merchant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_storefront_password: { Args: never; Returns: string }
      get_merchant_balance: {
        Args: { _merchant_id: string }
        Returns: {
          available_balance: number
          reserved_balance: number
          total_balance: number
        }[]
      }
      get_user_merchant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      publish_mission: {
        Args: { _idempotency_key: string; _mission_id: string }
        Returns: boolean
      }
      user_belongs_to_merchant: {
        Args: { _merchant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "fighter" | "admin" | "merchant"
      evidence_type:
        | "photo"
        | "video"
        | "receipt"
        | "screenshot"
        | "link"
        | "text"
      fighter_status: "pending" | "approved" | "rejected"
      ledger_entry_status: "pending" | "posted" | "rejected"
      ledger_entry_type:
        | "topup"
        | "reserve"
        | "release"
        | "payout"
        | "adjustment"
        | "fee"
      merchant_status: "pending" | "active" | "suspended"
      mission_status: "draft" | "scheduled" | "active" | "paused" | "closed"
      mission_type:
        | "purchase"
        | "review"
        | "social"
        | "event"
        | "referral"
        | "custom"
      participation_status:
        | "joined"
        | "started"
        | "submitted"
        | "approved"
        | "rejected"
        | "paid"
      submission_status: "pending" | "approved" | "rejected"
      validation_mode: "manual" | "auto" | "hybrid"
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
      app_role: ["fighter", "admin", "merchant"],
      evidence_type: [
        "photo",
        "video",
        "receipt",
        "screenshot",
        "link",
        "text",
      ],
      fighter_status: ["pending", "approved", "rejected"],
      ledger_entry_status: ["pending", "posted", "rejected"],
      ledger_entry_type: [
        "topup",
        "reserve",
        "release",
        "payout",
        "adjustment",
        "fee",
      ],
      merchant_status: ["pending", "active", "suspended"],
      mission_status: ["draft", "scheduled", "active", "paused", "closed"],
      mission_type: [
        "purchase",
        "review",
        "social",
        "event",
        "referral",
        "custom",
      ],
      participation_status: [
        "joined",
        "started",
        "submitted",
        "approved",
        "rejected",
        "paid",
      ],
      submission_status: ["pending", "approved", "rejected"],
      validation_mode: ["manual", "auto", "hybrid"],
    },
  },
} as const
