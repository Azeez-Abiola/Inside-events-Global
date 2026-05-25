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
      commission_config: {
        Row: {
          cookie_window_days: number
          created_at: string
          exclusive_partner_rate: number
          id: string
          igb_partner_rate: number
          min_payout_usd: number
          payout_schedule: string
          standard_rate: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cookie_window_days?: number
          created_at?: string
          exclusive_partner_rate?: number
          id?: string
          igb_partner_rate?: number
          min_payout_usd?: number
          payout_schedule?: string
          standard_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cookie_window_days?: number
          created_at?: string
          exclusive_partner_rate?: number
          id?: string
          igb_partner_rate?: number
          min_payout_usd?: number
          payout_schedule?: string
          standard_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      commitment_forms: {
        Row: {
          budget_indicated: number | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          message: string | null
          referral_link_id: string | null
          sponsor_id: string
          status: string
          submitted_at: string
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          budget_indicated?: number | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          message?: string | null
          referral_link_id?: string | null
          sponsor_id: string
          status?: string
          submitted_at?: string
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          budget_indicated?: number | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          message?: string | null
          referral_link_id?: string | null
          sponsor_id?: string
          status?: string
          submitted_at?: string
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number
          amount_usd: number | null
          commission_amount_usd: number | null
          commission_rate: number | null
          commitment_form_id: string | null
          contract_url: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          notes: string | null
          organiser_id: string
          paid_at: string | null
          payout_at: string | null
          referral_link_id: string | null
          referral_partner_id: string | null
          signed_at: string | null
          sponsor_id: string
          status: string
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_usd?: number | null
          commission_amount_usd?: number | null
          commission_rate?: number | null
          commitment_form_id?: string | null
          contract_url?: string | null
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          notes?: string | null
          organiser_id: string
          paid_at?: string | null
          payout_at?: string | null
          referral_link_id?: string | null
          referral_partner_id?: string | null
          signed_at?: string | null
          sponsor_id: string
          status?: string
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_usd?: number | null
          commission_amount_usd?: number | null
          commission_rate?: number | null
          commitment_form_id?: string | null
          contract_url?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          notes?: string | null
          organiser_id?: string
          paid_at?: string | null
          payout_at?: string | null
          referral_link_id?: string | null
          referral_partner_id?: string | null
          signed_at?: string | null
          sponsor_id?: string
          status?: string
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_sponsorship_tiers: {
        Row: {
          assets: string | null
          created_at: string
          currency: string
          custom_options: string | null
          event_id: string
          id: string
          is_exclusive: boolean
          price: number
          price_usd: number | null
          slot_count: number
          sort_order: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          assets?: string | null
          created_at?: string
          currency?: string
          custom_options?: string | null
          event_id: string
          id?: string
          is_exclusive?: boolean
          price: number
          price_usd?: number | null
          slot_count?: number
          sort_order?: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          assets?: string | null
          created_at?: string
          currency?: string
          custom_options?: string | null
          event_id?: string
          id?: string
          is_exclusive?: boolean
          price?: number
          price_usd?: number | null
          slot_count?: number
          sort_order?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsorship_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          abw_management_requested: boolean
          admin_notes: string | null
          attendance_size: number | null
          audience_seniority: string | null
          banner_image_url: string | null
          city: string | null
          consent_given: boolean
          consent_given_at: string | null
          country: string | null
          created_at: string
          currency: string
          decision_makers_pct: number | null
          end_date: string | null
          event_theme: string | null
          event_type: string | null
          exposure_channels: Json
          floor_plan_url: string | null
          form_data_draft: Json | null
          form_step_completed: number
          format: string | null
          geographic_mix: Json
          id: string
          ige_vetted: boolean
          inquiries_count: number
          lead_capture: boolean
          media_partners: Json
          min_sponsorship_spend: number | null
          name: string
          organiser_contact_email: string | null
          organiser_contact_name: string | null
          organiser_contact_phone: string | null
          organiser_contact_role: string | null
          organiser_id: string
          past_editions: number | null
          payment_terms: string | null
          post_event_report: boolean
          primary_audience: Json
          primary_sector: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_notes: string | null
          saves_count: number
          secondary_sector: string | null
          slug: string | null
          speaking_opps: boolean
          speaking_slots: number | null
          sponsorship_deadline: string | null
          sponsorship_deck_url: string | null
          start_date: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          venue: string | null
          views_count: number
          website: string | null
          years_running_event: number | null
        }
        Insert: {
          abw_management_requested?: boolean
          admin_notes?: string | null
          attendance_size?: number | null
          audience_seniority?: string | null
          banner_image_url?: string | null
          city?: string | null
          consent_given?: boolean
          consent_given_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          decision_makers_pct?: number | null
          end_date?: string | null
          event_theme?: string | null
          event_type?: string | null
          exposure_channels?: Json
          floor_plan_url?: string | null
          form_data_draft?: Json | null
          form_step_completed?: number
          format?: string | null
          geographic_mix?: Json
          id?: string
          ige_vetted?: boolean
          inquiries_count?: number
          lead_capture?: boolean
          media_partners?: Json
          min_sponsorship_spend?: number | null
          name: string
          organiser_contact_email?: string | null
          organiser_contact_name?: string | null
          organiser_contact_phone?: string | null
          organiser_contact_role?: string | null
          organiser_id: string
          past_editions?: number | null
          payment_terms?: string | null
          post_event_report?: boolean
          primary_audience?: Json
          primary_sector?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_notes?: string | null
          saves_count?: number
          secondary_sector?: string | null
          slug?: string | null
          speaking_opps?: boolean
          speaking_slots?: number | null
          sponsorship_deadline?: string | null
          sponsorship_deck_url?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          venue?: string | null
          views_count?: number
          website?: string | null
          years_running_event?: number | null
        }
        Update: {
          abw_management_requested?: boolean
          admin_notes?: string | null
          attendance_size?: number | null
          audience_seniority?: string | null
          banner_image_url?: string | null
          city?: string | null
          consent_given?: boolean
          consent_given_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          decision_makers_pct?: number | null
          end_date?: string | null
          event_theme?: string | null
          event_type?: string | null
          exposure_channels?: Json
          floor_plan_url?: string | null
          form_data_draft?: Json | null
          form_step_completed?: number
          format?: string | null
          geographic_mix?: Json
          id?: string
          ige_vetted?: boolean
          inquiries_count?: number
          lead_capture?: boolean
          media_partners?: Json
          min_sponsorship_spend?: number | null
          name?: string
          organiser_contact_email?: string | null
          organiser_contact_name?: string | null
          organiser_contact_phone?: string | null
          organiser_contact_role?: string | null
          organiser_id?: string
          past_editions?: number | null
          payment_terms?: string | null
          post_event_report?: boolean
          primary_audience?: Json
          primary_sector?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_notes?: string | null
          saves_count?: number
          secondary_sector?: string | null
          slug?: string | null
          speaking_opps?: boolean
          speaking_slots?: number | null
          sponsorship_deadline?: string | null
          sponsorship_deck_url?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          venue?: string | null
          views_count?: number
          website?: string | null
          years_running_event?: number | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          fetched_at: string
          id: string
          quote_currency: string
          rate: number
          source: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          fetched_at?: string
          id?: string
          quote_currency: string
          rate: number
          source?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          fetched_at?: string
          id?: string
          quote_currency?: string
          rate?: number
          source?: string
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          details: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          deal_id: string | null
          event_id: string | null
          id: string
          read: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deal_id?: string | null
          event_id?: string | null
          id?: string
          read?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deal_id?: string | null
          event_id?: string | null
          id?: string
          read?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link_url: string | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organiser_profiles: {
        Row: {
          bio: string | null
          created_at: string
          event_history: string | null
          id: string
          logo_url: string | null
          org_name: string
          past_sponsor_logos: Json
          track_record: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          event_history?: string | null
          id?: string
          logo_url?: string | null
          org_name: string
          past_sponsor_logos?: Json
          track_record?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          event_history?: string | null
          id?: string
          logo_url?: string | null
          org_name?: string
          past_sponsor_logos?: Json
          track_record?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          email_domain: string | null
          google_id: string | null
          id: string
          is_active: boolean
          is_suspended: boolean
          last_login_at: string | null
          linkedin_employer: string | null
          linkedin_id: string | null
          linkedin_url: string | null
          profile_complete: number
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_domain?: string | null
          google_id?: string | null
          id: string
          is_active?: boolean
          is_suspended?: boolean
          last_login_at?: string | null
          linkedin_employer?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          profile_complete?: number
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_domain?: string | null
          google_id?: string | null
          id?: string
          is_active?: boolean
          is_suspended?: boolean
          last_login_at?: string | null
          linkedin_employer?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          profile_complete?: number
          suspension_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_links: {
        Row: {
          clicks_count: number
          conversions_count: number
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          referral_partner_id: string
          short_code: string
          updated_at: string
        }
        Insert: {
          clicks_count?: number
          conversions_count?: number
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          referral_partner_id: string
          short_code: string
          updated_at?: string
        }
        Update: {
          clicks_count?: number
          conversions_count?: number
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          referral_partner_id?: string
          short_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_partner_profiles: {
        Row: {
          commission_tier: string
          created_at: string
          deals_closed: number
          full_name: string
          id: string
          igb_partner_badge: boolean
          payout_currency: string
          professional_bg: string | null
          professional_title: string | null
          sector_expertise: Json
          sponsor_network_desc: string | null
          total_earned_usd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_tier?: string
          created_at?: string
          deals_closed?: number
          full_name: string
          id?: string
          igb_partner_badge?: boolean
          payout_currency?: string
          professional_bg?: string | null
          professional_title?: string | null
          sector_expertise?: Json
          sponsor_network_desc?: string | null
          total_earned_usd?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_tier?: string
          created_at?: string
          deals_closed?: number
          full_name?: string
          id?: string
          igb_partner_badge?: boolean
          payout_currency?: string
          professional_bg?: string | null
          professional_title?: string | null
          sector_expertise?: Json
          sponsor_network_desc?: string | null
          total_earned_usd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsor_profiles: {
        Row: {
          audience_types: Json
          brand_name: string
          budget_range_max: number | null
          budget_range_min: number | null
          company_size: string | null
          created_at: string
          hq_city: string | null
          hq_country: string | null
          id: string
          industry: string | null
          past_sponsorships: Json
          preferred_currency: string
          sponsorship_sectors: Json
          target_geographies: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_types?: Json
          brand_name: string
          budget_range_max?: number | null
          budget_range_min?: number | null
          company_size?: string | null
          created_at?: string
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industry?: string | null
          past_sponsorships?: Json
          preferred_currency?: string
          sponsorship_sectors?: Json
          target_geographies?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          audience_types?: Json
          brand_name?: string
          budget_range_max?: number | null
          budget_range_min?: number | null
          company_size?: string | null
          created_at?: string
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industry?: string | null
          past_sponsorships?: Json
          preferred_currency?: string
          sponsorship_sectors?: Json
          target_geographies?: Json
          updated_at?: string
          user_id?: string
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "organiser"
        | "sponsor"
        | "referral_partner"
        | "media_partner"
        | "abw_admin"
        | "super_admin"
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
      app_role: [
        "organiser",
        "sponsor",
        "referral_partner",
        "media_partner",
        "abw_admin",
        "super_admin",
      ],
    },
  },
} as const
