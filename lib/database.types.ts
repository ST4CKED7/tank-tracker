export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      dose_logs: {
        Row: {
          amount: number
          dosed_at: string
          id: string
          product: string
          tank_id: string
          target_parameter: string | null
          unit: string
          user_id: string
        }
        Insert: {
          amount: number
          dosed_at?: string
          id?: string
          product: string
          tank_id: string
          target_parameter?: string | null
          unit: string
          user_id: string
        }
        Update: {
          amount?: number
          dosed_at?: string
          id?: string
          product?: string
          tank_id?: string
          target_parameter?: string | null
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dose_logs_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          equipment_type: string
          id: string
          installed_at: string | null
          last_serviced_at: string | null
          name: string
          notes: string | null
          service_every_days: number
          tank_id: string
          user_id: string
        }
        Insert: {
          equipment_type: string
          id?: string
          installed_at?: string | null
          last_serviced_at?: string | null
          name: string
          notes?: string | null
          service_every_days: number
          tank_id: string
          user_id: string
        }
        Update: {
          equipment_type?: string
          id?: string
          installed_at?: string | null
          last_serviced_at?: string | null
          name?: string
          notes?: string | null
          service_every_days?: number
          tank_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          added_on: string
          coral_size: Database["public"]["Enums"]["coral_size"] | null
          current_length_inches: number | null
          id: string
          nickname: string | null
          quantity: number
          species_id: string
          tank_id: string
          user_id: string
        }
        Insert: {
          added_on?: string
          coral_size?: Database["public"]["Enums"]["coral_size"] | null
          current_length_inches?: number | null
          id?: string
          nickname?: string | null
          quantity?: number
          species_id: string
          tank_id: string
          user_id: string
        }
        Update: {
          added_on?: string
          coral_size?: Database["public"]["Enums"]["coral_size"] | null
          current_length_inches?: number | null
          id?: string
          nickname?: string | null
          quantity?: number
          species_id?: string
          tank_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      species_catalog: {
        Row: {
          adult_length_inches: number | null
          aggression_tags: string[]
          alk_max: number | null
          alk_min: number | null
          bioload_factor: number
          ca_max: number | null
          ca_min: number | null
          common_name: string
          diet: string | null
          flow: string | null
          id: string
          image_url: string | null
          invert_points: number
          kind: Database["public"]["Enums"]["species_kind"]
          lighting: string | null
          min_tank_gallons: number | null
          no3_max: number | null
          no3_min: number | null
          notes: string | null
          owner_id: string | null
          ph_max: number | null
          ph_min: number | null
          po4_max: number | null
          po4_min: number | null
          reef_safe: Database["public"]["Enums"]["reef_safe"]
          salinity_max: number | null
          salinity_min: number | null
          scientific_name: string | null
          slug: string | null
          temp_max: number | null
          temp_min: number | null
          temperament: Database["public"]["Enums"]["temperament"] | null
          water_type: Database["public"]["Enums"]["water_type"]
        }
        Insert: {
          adult_length_inches?: number | null
          aggression_tags?: string[]
          alk_max?: number | null
          alk_min?: number | null
          bioload_factor?: number
          ca_max?: number | null
          ca_min?: number | null
          common_name: string
          diet?: string | null
          flow?: string | null
          id?: string
          image_url?: string | null
          invert_points?: number
          kind: Database["public"]["Enums"]["species_kind"]
          lighting?: string | null
          min_tank_gallons?: number | null
          no3_max?: number | null
          no3_min?: number | null
          notes?: string | null
          owner_id?: string | null
          ph_max?: number | null
          ph_min?: number | null
          po4_max?: number | null
          po4_min?: number | null
          reef_safe?: Database["public"]["Enums"]["reef_safe"]
          salinity_max?: number | null
          salinity_min?: number | null
          scientific_name?: string | null
          slug?: string | null
          temp_max?: number | null
          temp_min?: number | null
          temperament?: Database["public"]["Enums"]["temperament"] | null
          water_type?: Database["public"]["Enums"]["water_type"]
        }
        Update: Partial<Database["public"]["Tables"]["species_catalog"]["Insert"]>
        Relationships: []
      }
      tanks: {
        Row: {
          created_at: string
          gallons: number
          has_sump: boolean
          id: string
          name: string
          sump_gallons: number
          sump_media: string[]
          tank_type: Database["public"]["Enums"]["tank_type"]
          timezone: string
          unit_system: Database["public"]["Enums"]["unit_system"]
          user_id: string
          volume_unit: string
          temp_unit: string
          length_unit: string
          water_change_interval_days: number
          water_change_percent: number
          water_type: Database["public"]["Enums"]["water_type"]
        }
        Insert: {
          created_at?: string
          gallons: number
          has_sump?: boolean
          id?: string
          name: string
          sump_gallons?: number
          sump_media?: string[]
          tank_type?: Database["public"]["Enums"]["tank_type"]
          timezone?: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          user_id: string
          volume_unit?: string
          temp_unit?: string
          length_unit?: string
          water_change_interval_days?: number
          water_change_percent?: number
          water_type?: Database["public"]["Enums"]["water_type"]
        }
        Update: Partial<Database["public"]["Tables"]["tanks"]["Insert"]>
        Relationships: []
      }
      test_logs: {
        Row: {
          id: string
          notes: string | null
          parameter: string
          source_kit: string | null
          tank_id: string
          tested_at: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          notes?: string | null
          parameter: string
          source_kit?: string | null
          tank_id: string
          tested_at?: string
          unit: string
          user_id: string
          value: number
        }
        Update: Partial<Database["public"]["Tables"]["test_logs"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "test_logs_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      water_changes: {
        Row: {
          changed_at: string
          gallons: number
          id: string
          notes: string | null
          percent: number
          tank_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          gallons: number
          id?: string
          notes?: string | null
          percent: number
          tank_id: string
          user_id: string
        }
        Update: Partial<Database["public"]["Tables"]["water_changes"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "water_changes_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_species_image: {
        Args: { p_id: string; p_url: string }
        Returns: undefined
      }
    }
    Enums: {
      coral_size: "frag" | "small" | "colony"
      reef_safe: "yes" | "caution" | "no"
      species_kind: "fish" | "coral" | "invert" | "plant"
      tank_type: "fowlr" | "mixed_reef" | "sps_reef" | "lps_reef" | "softie_reef" | "nano_reef" | "community" | "planted" | "aquascape" | "african_cichlid" | "discus" | "shrimp" | "goldfish"
      temperament: "peaceful" | "semi_aggressive" | "aggressive"
      unit_system: "imperial" | "metric"
      water_type: "saltwater" | "freshwater"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
