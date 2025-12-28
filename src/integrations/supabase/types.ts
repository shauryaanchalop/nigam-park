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
      anpr_detections: {
        Row: {
          camera_id: string | null
          confidence_score: number | null
          detected_at: string
          detection_type: string
          id: string
          image_url: string | null
          lot_id: string
          processed: boolean | null
          vehicle_number: string
        }
        Insert: {
          camera_id?: string | null
          confidence_score?: number | null
          detected_at?: string
          detection_type?: string
          id?: string
          image_url?: string | null
          lot_id: string
          processed?: boolean | null
          vehicle_number: string
        }
        Update: {
          camera_id?: string | null
          confidence_score?: number | null
          detected_at?: string
          detection_type?: string
          id?: string
          image_url?: string | null
          lot_id?: string
          processed?: boolean | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "anpr_detections_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anpr_detections_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in_location: Json | null
          check_in_time: string | null
          check_out_location: Json | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          shift_id: string
          status: string
          user_id: string
        }
        Insert: {
          check_in_location?: Json | null
          check_in_time?: string | null
          check_out_location?: Json | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id: string
          status?: string
          user_id: string
        }
        Update: {
          check_in_location?: Json | null
          check_in_time?: string | null
          check_out_location?: Json | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "attendant_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      attendant_performance: {
        Row: {
          avg_transaction_time: number | null
          created_at: string
          id: string
          lot_id: string | null
          performance_date: string
          shift_hours: number | null
          total_collections: number
          transaction_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_transaction_time?: number | null
          created_at?: string
          id?: string
          lot_id?: string | null
          performance_date: string
          shift_hours?: number | null
          total_collections?: number
          transaction_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_transaction_time?: number | null
          created_at?: string
          id?: string
          lot_id?: string | null
          performance_date?: string
          shift_hours?: number | null
          total_collections?: number
          transaction_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendant_performance_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      attendant_shifts: {
        Row: {
          created_at: string
          end_time: string
          id: string
          lot_id: string
          shift_date: string
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          lot_id: string
          shift_date: string
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          lot_id?: string
          shift_date?: string
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendant_shifts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["camera_status"]
          stream_url: string | null
          zone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["camera_status"]
          stream_url?: string | null
          zone: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["camera_status"]
          stream_url?: string | null
          zone?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          created_at: string
          description: string
          id: string
          location: string
          metadata: Json | null
          severity: Database["public"]["Enums"]["fraud_severity"]
          status: Database["public"]["Enums"]["fraud_status"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          location: string
          metadata?: Json | null
          severity?: Database["public"]["Enums"]["fraud_severity"]
          status?: Database["public"]["Enums"]["fraud_status"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          location?: string
          metadata?: Json | null
          severity?: Database["public"]["Enums"]["fraud_severity"]
          status?: Database["public"]["Enums"]["fraud_status"]
        }
        Relationships: []
      }
      fraud_patterns: {
        Row: {
          created_at: string
          description: string
          detection_rules: Json
          id: string
          is_active: boolean | null
          pattern_type: string
          severity: string
        }
        Insert: {
          created_at?: string
          description: string
          detection_rules?: Json
          id?: string
          is_active?: boolean | null
          pattern_type: string
          severity?: string
        }
        Update: {
          created_at?: string
          description?: string
          detection_rules?: Json
          id?: string
          is_active?: boolean | null
          pattern_type?: string
          severity?: string
        }
        Relationships: []
      }
      lot_usage_stats: {
        Row: {
          avg_occupancy: number
          created_at: string
          hour_of_day: number
          id: string
          lot_id: string
          peak_occupancy: number
          revenue: number
          stat_date: string
          total_vehicles: number
        }
        Insert: {
          avg_occupancy?: number
          created_at?: string
          hour_of_day: number
          id?: string
          lot_id: string
          peak_occupancy?: number
          revenue?: number
          stat_date: string
          total_vehicles?: number
        }
        Update: {
          avg_occupancy?: number
          created_at?: string
          hour_of_day?: number
          id?: string
          lot_id?: string
          peak_occupancy?: number
          revenue?: number
          stat_date?: string
          total_vehicles?: number
        }
        Relationships: [
          {
            foreignKeyName: "lot_usage_stats_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          created_at: string
          current_tier_id: string | null
          id: string
          lifetime_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_tier_id?: string | null
          id?: string
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_tier_id?: string | null
          id?: string
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          color: string | null
          created_at: string
          discount_percentage: number
          icon: string | null
          id: string
          min_points: number
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          discount_percentage?: number
          icon?: string | null
          id?: string
          min_points?: number
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          discount_percentage?: number
          icon?: string | null
          id?: string
          min_points?: number
          name?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_passes: {
        Row: {
          amount: number
          created_at: string
          end_date: string
          id: string
          lot_id: string | null
          pass_type: string
          start_date: string
          status: string
          user_id: string
          vehicle_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          end_date: string
          id?: string
          lot_id?: string | null
          pass_type?: string
          start_date: string
          status?: string
          user_id: string
          vehicle_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string
          id?: string
          lot_id?: string | null
          pass_type?: string
          start_date?: string
          status?: string
          user_id?: string
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_passes_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          message: string
          notification_type: string
          recipient: string
          reservation_id: string | null
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message: string
          notification_type: string
          recipient: string
          reservation_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message?: string
          notification_type?: string
          recipient?: string
          reservation_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      occupancy_forecasts: {
        Row: {
          confidence_score: number
          created_at: string
          forecast_time: string
          id: string
          parking_lot_id: string
          predicted_occupancy: number
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          forecast_time: string
          id?: string
          parking_lot_id: string
          predicted_occupancy: number
        }
        Update: {
          confidence_score?: number
          created_at?: string
          forecast_time?: string
          id?: string
          parking_lot_id?: string
          predicted_occupancy?: number
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_forecasts_parking_lot_id_fkey"
            columns: ["parking_lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      overstay_alerts: {
        Row: {
          created_at: string
          entry_time: string
          expected_exit_time: string | null
          fine_id: string | null
          id: string
          lot_id: string
          overstay_minutes: number
          resolved_at: string | null
          status: string
          vehicle_number: string
        }
        Insert: {
          created_at?: string
          entry_time: string
          expected_exit_time?: string | null
          fine_id?: string | null
          id?: string
          lot_id: string
          overstay_minutes?: number
          resolved_at?: string | null
          status?: string
          vehicle_number: string
        }
        Update: {
          created_at?: string
          entry_time?: string
          expected_exit_time?: string | null
          fine_id?: string | null
          id?: string
          lot_id?: string
          overstay_minutes?: number
          resolved_at?: string | null
          status?: string
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "overstay_alerts_fine_id_fkey"
            columns: ["fine_id"]
            isOneToOne: false
            referencedRelation: "user_fines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overstay_alerts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_lots: {
        Row: {
          capacity: number
          created_at: string
          current_occupancy: number
          has_covered_parking: boolean | null
          has_ev_charging: boolean | null
          hourly_rate: number
          id: string
          lat: number
          lng: number
          metro_station: string | null
          name: string
          near_metro: boolean | null
          status: string
          zone: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          has_covered_parking?: boolean | null
          has_ev_charging?: boolean | null
          hourly_rate?: number
          id?: string
          lat: number
          lng: number
          metro_station?: string | null
          name: string
          near_metro?: boolean | null
          status?: string
          zone: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          has_covered_parking?: boolean | null
          has_ev_charging?: boolean | null
          hourly_rate?: number
          id?: string
          lat?: number
          lng?: number
          metro_station?: string | null
          name?: string
          near_metro?: boolean | null
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
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_points: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_points?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_points?: number | null
          status?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          amount: number
          checked_in_at: string | null
          created_at: string
          end_time: string
          fine_applied: boolean | null
          id: string
          lot_id: string
          notification_15_sent: boolean | null
          notification_30_sent: boolean | null
          reservation_date: string
          start_time: string
          status: string
          updated_at: string
          user_id: string
          vehicle_number: string
        }
        Insert: {
          amount: number
          checked_in_at?: string | null
          created_at?: string
          end_time: string
          fine_applied?: boolean | null
          id?: string
          lot_id: string
          notification_15_sent?: boolean | null
          notification_30_sent?: boolean | null
          reservation_date: string
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
          vehicle_number: string
        }
        Update: {
          amount?: number
          checked_in_at?: string | null
          created_at?: string
          end_time?: string
          fine_applied?: boolean | null
          id?: string
          lot_id?: string
          notification_15_sent?: boolean | null
          notification_30_sent?: boolean | null
          reservation_date?: string
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string
          forecast_date: string
          id: string
          lot_id: string | null
          model_version: string | null
          predicted_revenue: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          forecast_date: string
          id?: string
          lot_id?: string | null
          model_version?: string | null
          predicted_revenue: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          forecast_date?: string
          id?: string
          lot_id?: string | null
          model_version?: string | null
          predicted_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_forecasts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lot_id: string | null
          target_amount: number
          target_date: string
          target_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lot_id?: string | null
          target_amount: number
          target_date: string
          target_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lot_id?: string | null
          target_amount?: number
          target_date?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_targets_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_vehicles: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          user_id: string
          vehicle_name: string | null
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          user_id: string
          vehicle_name?: string | null
          vehicle_number: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          user_id?: string
          vehicle_name?: string | null
          vehicle_number?: string
          vehicle_type?: string
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
      shift_templates: {
        Row: {
          created_at: string
          end_time: string
          id: string
          name: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          name: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          start_time?: string
        }
        Relationships: []
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
      user_fines: {
        Row: {
          amount: number
          applied_to_transaction_id: string | null
          created_at: string
          id: string
          reason: string
          reservation_id: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          applied_to_transaction_id?: string | null
          created_at?: string
          id?: string
          reason: string
          reservation_id?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          applied_to_transaction_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          reservation_id?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fines_applied_to_transaction_id_fkey"
            columns: ["applied_to_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_fines_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          push_notifications: boolean
          reminder_before_expiry: number
          sms_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          reminder_before_expiry?: number
          sms_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          reminder_before_expiry?: number
          sms_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      violation_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          lot_id: string | null
          photo_url: string | null
          reporter_id: string
          resolved_at: string | null
          status: string
          vehicle_number: string
          violation_type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          lot_id?: string | null
          photo_url?: string | null
          reporter_id: string
          resolved_at?: string | null
          status?: string
          vehicle_number: string
          violation_type: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          lot_id?: string | null
          photo_url?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          vehicle_number?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_reports_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "parking_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_events: {
        Row: {
          bounding_box: Json
          camera_id: string
          detected_at: string
          id: string
          object_type: string
        }
        Insert: {
          bounding_box?: Json
          camera_id: string
          detected_at?: string
          id?: string
          object_type?: string
        }
        Update: {
          bounding_box?: Json
          camera_id?: string
          detected_at?: string
          id?: string
          object_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_events_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
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
      camera_status: "ONLINE" | "OFFLINE" | "OCCLUDED"
      fraud_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      fraud_status: "NEW" | "INVESTIGATING" | "RESOLVED"
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
      camera_status: ["ONLINE", "OFFLINE", "OCCLUDED"],
      fraud_severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      fraud_status: ["NEW", "INVESTIGATING", "RESOLVED"],
    },
  },
} as const
