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
          abw_platform_rate: number
          event_type_category: string
          id: string
          premium_rate: number
          standard_rate: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          abw_platform_rate?: number
          event_type_category: string
          id?: string
          premium_rate: number
          standard_rate: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          abw_platform_rate?: number
          event_type_category?: string
          id?: string
          premium_rate?: number
          standard_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      commitment_forms: {
        Row: {
          brand_region: string | null
          budget_range_max: number | null
          budget_range_min: number | null
          company_linkedin_url: string | null
          company_name: string
          contact_name: string
          contact_title: string | null
          created_at: string
          currency: string
          custom_requirements: string | null
          eur_usd_rate_locked: number | null
          event_id: string
          expected_roi: string | null
          fraud_flags: Json
          gbp_usd_rate_locked: number | null
          id: string
          ip_address: string | null
          ngn_usd_rate_locked: number | null
          partnership_type: string | null
          proposed_start_date: string | null
          rate_locked_at: string | null
          readiness_confirmed: boolean
          referral_link_id: string | null
          referral_partner_id: string | null
          sponsor_user_id: string | null
          submitted_at: string
          tier_id: string | null
        }
        Insert: {
          brand_region?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          company_linkedin_url?: string | null
          company_name: string
          contact_name: string
          contact_title?: string | null
          created_at?: string
          currency: string
          custom_requirements?: string | null
          eur_usd_rate_locked?: number | null
          event_id: string
          expected_roi?: string | null
          fraud_flags?: Json
          gbp_usd_rate_locked?: number | null
          id?: string
          ip_address?: string | null
          ngn_usd_rate_locked?: number | null
          partnership_type?: string | null
          proposed_start_date?: string | null
          rate_locked_at?: string | null
          readiness_confirmed?: boolean
          referral_link_id?: string | null
          referral_partner_id?: string | null
          sponsor_user_id?: string | null
          submitted_at?: string
          tier_id?: string | null
        }
        Update: {
          brand_region?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          company_linkedin_url?: string | null
          company_name?: string
          contact_name?: string
          contact_title?: string | null
          created_at?: string
          currency?: string
          custom_requirements?: string | null
          eur_usd_rate_locked?: number | null
          event_id?: string
          expected_roi?: string | null
          fraud_flags?: Json
          gbp_usd_rate_locked?: number | null
          id?: string
          ip_address?: string | null
          ngn_usd_rate_locked?: number | null
          partnership_type?: string | null
          proposed_start_date?: string | null
          rate_locked_at?: string | null
          readiness_confirmed?: boolean
          referral_link_id?: string | null
          referral_partner_id?: string | null
          sponsor_user_id?: string | null
          submitted_at?: string
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commitment_forms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitment_forms_referral_link_id_fkey"
            columns: ["referral_link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitment_forms_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "event_sponsorship_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          deal_id: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_status_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          abw_commission_native: number | null
          abw_commission_rate: number
          abw_commission_usd: number | null
          abw_notes: string | null
          assigned_to: string | null
          commitment_form_id: string
          created_at: string
          deal_currency: string
          deal_value_native: number | null
          deal_value_usd: number | null
          event_id: string
          id: string
          organiser_id: string
          organiser_payout_native: number | null
          paid_at: string | null
          paystack_reference: string | null
          referral_commission_native: number | null
          referral_commission_paid: boolean
          referral_commission_paid_at: string | null
          referral_commission_rate: number
          referral_commission_usd: number | null
          referral_partner_id: string | null
          sponsor_user_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          abw_commission_native?: number | null
          abw_commission_rate?: number
          abw_commission_usd?: number | null
          abw_notes?: string | null
          assigned_to?: string | null
          commitment_form_id: string
          created_at?: string
          deal_currency: string
          deal_value_native?: number | null
          deal_value_usd?: number | null
          event_id: string
          id?: string
          organiser_id: string
          organiser_payout_native?: number | null
          paid_at?: string | null
          paystack_reference?: string | null
          referral_commission_native?: number | null
          referral_commission_paid?: boolean
          referral_commission_paid_at?: string | null
          referral_commission_rate?: number
          referral_commission_usd?: number | null
          referral_partner_id?: string | null
          sponsor_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          abw_commission_native?: number | null
          abw_commission_rate?: number
          abw_commission_usd?: number | null
          abw_notes?: string | null
          assigned_to?: string | null
          commitment_form_id?: string
          created_at?: string
          deal_currency?: string
          deal_value_native?: number | null
          deal_value_usd?: number | null
          event_id?: string
          id?: string
          organiser_id?: string
          organiser_payout_native?: number | null
          paid_at?: string | null
          paystack_reference?: string | null
          referral_commission_native?: number | null
          referral_commission_paid?: boolean
          referral_commission_paid_at?: string | null
          referral_commission_rate?: number
          referral_commission_usd?: number | null
          referral_partner_id?: string | null
          sponsor_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_commitment_form_id_fkey"
            columns: ["commitment_form_id"]
            isOneToOne: false
            referencedRelation: "commitment_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_saves: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_saves_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsorship_tiers: {
        Row: {
          assets: Json | null
          created_at: string
          currency: string
          custom_options: string | null
          display_order: number
          event_id: string
          id: string
          is_exclusive: boolean
          price: number
          price_usd: number | null
          slots_remaining: number | null
          slots_total: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          assets?: Json | null
          created_at?: string
          currency?: string
          custom_options?: string | null
          display_order?: number
          event_id: string
          id?: string
          is_exclusive?: boolean
          price: number
          price_usd?: number | null
          slots_remaining?: number | null
          slots_total?: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          assets?: Json | null
          created_at?: string
          currency?: string
          custom_options?: string | null
          display_order?: number
          event_id?: string
          id?: string
          is_exclusive?: boolean
          price?: number
          price_usd?: number | null
          slots_remaining?: number | null
          slots_total?: number
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
          inquiry_count: number
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
          save_count: number
          secondary_sector: string | null
          slug: string | null
          speaking_opps: boolean
          speaking_slots: number | null
          sponsorship_deadline: string | null
          sponsorship_deck_url: string | null
          start_date: string | null
          status: string
          updated_at: string
          venue: string | null
          vetted_at: string | null
          vetted_by: string | null
          vetting_notes: string | null
          view_count: number
          website: string | null
          years_running_event: number | null
        }
        Insert: {
          abw_management_requested?: boolean
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
          inquiry_count?: number
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
          save_count?: number
          secondary_sector?: string | null
          slug?: string | null
          speaking_opps?: boolean
          speaking_slots?: number | null
          sponsorship_deadline?: string | null
          sponsorship_deck_url?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
          vetted_at?: string | null
          vetted_by?: string | null
          vetting_notes?: string | null
          view_count?: number
          website?: string | null
          years_running_event?: number | null
        }
        Update: {
          abw_management_requested?: boolean
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
          inquiry_count?: number
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
          save_count?: number
          secondary_sector?: string | null
          slug?: string | null
          speaking_opps?: boolean
          speaking_slots?: number | null
          sponsorship_deadline?: string | null
          sponsorship_deck_url?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
          vetted_at?: string | null
          vetted_by?: string | null
          vetting_notes?: string | null
          view_count?: number
          website?: string | null
          years_running_event?: number | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          eur_rate: number
          fetched_at: string
          gbp_rate: number
          id: string
          ngn_rate: number
          source: string
        }
        Insert: {
          base_currency?: string
          eur_rate: number
          fetched_at?: string
          gbp_rate: number
          id?: string
          ngn_rate: number
          source?: string
        }
        Update: {
          base_currency?: string
          eur_rate?: number
          fetched_at?: string
          gbp_rate?: number
          id?: string
          ngn_rate?: number
          source?: string
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_type: string
          flagged_by: string
          flagged_user_id: string | null
          id: string
          related_deal_id: string | null
          related_referral_link_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_type: string
          flagged_by?: string
          flagged_user_id?: string | null
          id?: string
          related_deal_id?: string | null
          related_referral_link_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_type?: string
          flagged_by?: string
          flagged_user_id?: string | null
          id?: string
          related_deal_id?: string | null
          related_referral_link_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_related_referral_link_id_fkey"
            columns: ["related_referral_link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
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
          thread_id: string
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
          thread_id: string
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
          thread_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
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
      referral_link_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_address: string | null
          referral_link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referral_link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referral_link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_link_clicks_referral_link_id_fkey"
            columns: ["referral_link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          click_count: number
          commission_rate: number
          conversion_count: number
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          last_clicked_at: string | null
          referral_partner_id: string
          short_code: string | null
          status: string
          unique_click_count: number
          vouch_link_id: string | null
          vouch_link_url: string
        }
        Insert: {
          click_count?: number
          commission_rate: number
          conversion_count?: number
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          last_clicked_at?: string | null
          referral_partner_id: string
          short_code?: string | null
          status?: string
          unique_click_count?: number
          vouch_link_id?: string | null
          vouch_link_url: string
        }
        Update: {
          click_count?: number
          commission_rate?: number
          conversion_count?: number
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          last_clicked_at?: string | null
          referral_partner_id?: string
          short_code?: string | null
          status?: string
          unique_click_count?: number
          vouch_link_id?: string | null
          vouch_link_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
