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
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean
          lot_id: string | null
          message: string
          sensor_log_id: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          lot_id?: string | null
          message: string
          sensor_log_id?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          lot_id?: string | null
          message?: string
          sensor_log_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_sensor_log_id_fkey"
            columns: ["sensor_log_id"]
            isOneToOne: false
            referencedRelation: "sensor_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_lots: {
        Row: {
          capacity: number
          created_at: string
          current_occupancy: number
          hourly_rate: number
          id: string
          lat: number
          lng: number
          name: string
          status: string
          zone: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          hourly_rate?: number
          id?: string
          lat: number
          lng: number
          name: string
          status?: string
          zone: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          hourly_rate?: number
          id?: string
          lat?: number
          lng?: number
          name?: string
          status?: string
          zone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sensor_logs: {
        Row: {
          created_at: string
          event_type: string
          has_payment: boolean
          id: string
          lot_id: string
          vehicle_detected: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          has_payment?: boolean
          id?: string
          lot_id: string
          vehicle_detected?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          has_payment?: boolean
          id?: string
          lot_id?: string
          vehicle_detected?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_logs_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          entry_time: string
          exit_time: string | null
          id: string
          lot_id: string
          payment_method: string
          status: string
          vehicle_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          lot_id: string
          payment_method: string
          status?: string
          vehicle_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          lot_id?: string
          payment_method?: string
          status?: string
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_lot_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_lot_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_lot_id?: string | null
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
      get_demo_credentials: {
        Args: never
        Returns: {
          demo_email: string
          demo_password: string
          demo_role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "attendant" | "citizen"
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
      app_role: ["admin", "attendant", "citizen"],
    },
  },
} as const
