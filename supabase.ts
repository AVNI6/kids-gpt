export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_templates: {
        Row: {
          activity_type: string | null;
          base_prompt: string | null;
          category: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          updated_at: string | null;
          visual_layout_type: string | null;
        };
        Insert: {
          activity_type?: string | null;
          base_prompt?: string | null;
          category?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string | null;
          visual_layout_type?: string | null;
        };
        Update: {
          activity_type?: string | null;
          base_prompt?: string | null;
          category?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string | null;
          visual_layout_type?: string | null;
        };
        Relationships: [];
      };
      ai_request_logs: {
        Row: {
          api_model: string | null;
          api_provider: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          provider_status: Database["public"]["Enums"]["provider_status"] | null;
          safety_ratings: Json | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          api_model?: string | null;
          api_provider?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          provider_status?: Database["public"]["Enums"]["provider_status"] | null;
          safety_ratings?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          api_model?: string | null;
          api_provider?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          provider_status?: Database["public"]["Enums"]["provider_status"] | null;
          safety_ratings?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_request_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          attachment_url: string | null;
          content: string | null;
          created_at: string | null;
          deleted_at: string | null;
          generated_by_model: string | null;
          id: string;
          is_flagged: boolean | null;
          response_time_ms: number | null;
          sender_role: Database["public"]["Enums"]["sender_role"] | null;
          session_id: string | null;
          status: string | null;
          token_used: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          attachment_url?: string | null;
          content?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          generated_by_model?: string | null;
          id?: string;
          is_flagged?: boolean | null;
          response_time_ms?: number | null;
          sender_role?: Database["public"]["Enums"]["sender_role"] | null;
          session_id?: string | null;
          status?: string | null;
          token_used?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          attachment_url?: string | null;
          content?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          generated_by_model?: string | null;
          id?: string;
          is_flagged?: boolean | null;
          response_time_ms?: number | null;
          sender_role?: Database["public"]["Enums"]["sender_role"] | null;
          session_id?: string | null;
          status?: string | null;
          token_used?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          is_active: boolean | null;
          session_type: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          session_type?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          session_type?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      daily_usage_tracking: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          messages_sent: number | null;
          pdfs_generated: number | null;
          subscription_id: string | null;
          token_used: number | null;
          updated_at: string | null;
          usage_date: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          messages_sent?: number | null;
          pdfs_generated?: number | null;
          subscription_id?: string | null;
          token_used?: number | null;
          updated_at?: string | null;
          usage_date?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          messages_sent?: number | null;
          pdfs_generated?: number | null;
          subscription_id?: string | null;
          token_used?: number | null;
          updated_at?: string | null;
          usage_date?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_usage_tracking_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_usage_tracking_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      demos: {
        Row: {
          created_at: string;
          id: number;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      generated_materials: {
        Row: {
          chat_session_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          file_url: string | null;
          format: string | null;
          id: string;
          type: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          chat_session_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          file_url?: string | null;
          format?: string | null;
          id?: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          chat_session_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          file_url?: string | null;
          format?: string | null;
          id?: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generated_materials_chat_session_id_fkey";
            columns: ["chat_session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_materials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      kid_permissions: {
        Row: {
          created_at: string | null;
          default_id: string | null;
          deleted_at: string | null;
          granted_by_user_id: string | null;
          id: string;
          is_allowed: boolean | null;
          kid_user_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_id?: string | null;
          deleted_at?: string | null;
          granted_by_user_id?: string | null;
          id?: string;
          is_allowed?: boolean | null;
          kid_user_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_id?: string | null;
          deleted_at?: string | null;
          granted_by_user_id?: string | null;
          id?: string;
          is_allowed?: boolean | null;
          kid_user_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kid_permissions_default_id_fkey";
            columns: ["default_id"];
            isOneToOne: false;
            referencedRelation: "kid_permissions_default";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kid_permissions_granted_by_user_id_fkey";
            columns: ["granted_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "kid_permissions_kid_user_id_fkey";
            columns: ["kid_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      kid_permissions_default: {
        Row: {
          category: Database["public"]["Enums"]["permission_category"] | null;
          created_at: string | null;
          default_allowed: boolean | null;
          deleted_at: string | null;
          granted_by_user_id: string | null;
          id: string;
          is_allowed: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          category?: Database["public"]["Enums"]["permission_category"] | null;
          created_at?: string | null;
          default_allowed?: boolean | null;
          deleted_at?: string | null;
          granted_by_user_id?: string | null;
          id?: string;
          is_allowed?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          category?: Database["public"]["Enums"]["permission_category"] | null;
          created_at?: string | null;
          default_allowed?: boolean | null;
          deleted_at?: string | null;
          granted_by_user_id?: string | null;
          id?: string;
          is_allowed?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kid_permissions_default_granted_by_user_id_fkey";
            columns: ["granted_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      parent_child_link: {
        Row: {
          child_user_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          is_approved: boolean | null;
          parent_user_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          child_user_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          parent_user_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          child_user_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          parent_user_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parent_child_link_child_user_id_fkey";
            columns: ["child_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "parent_child_link_parent_user_id_fkey";
            columns: ["parent_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      profile: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          current_streak: number | null;
          date_of_birth: string | null;
          deleted_at: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          longest_streak: number | null;
          mobile_no: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          standard: string | null;
          total_experience_points: number | null;
          updated_at: string | null;
          user_id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          current_streak?: number | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          longest_streak?: number | null;
          mobile_no?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          standard?: string | null;
          total_experience_points?: number | null;
          updated_at?: string | null;
          user_id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          current_streak?: number | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          longest_streak?: number | null;
          mobile_no?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          standard?: string | null;
          total_experience_points?: number | null;
          updated_at?: string | null;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          rewards_amount: number | null;
          source_id: string | null;
          source_type: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          rewards_amount?: number | null;
          source_id?: string | null;
          source_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          rewards_amount?: number | null;
          source_id?: string | null;
          source_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      safety_alerts: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          notification: string | null;
          reason: string | null;
          resolved: boolean | null;
          source_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          notification?: string | null;
          reason?: string | null;
          resolved?: boolean | null;
          source_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          notification?: string | null;
          reason?: string | null;
          resolved?: boolean | null;
          source_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "safety_alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          expired_at: string | null;
          id: string;
          plan_id: string | null;
          plan_type: string | null;
          price: number | null;
          status: Database["public"]["Enums"]["subscription_status"] | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          expired_at?: string | null;
          id?: string;
          plan_id?: string | null;
          plan_type?: string | null;
          price?: number | null;
          status?: Database["public"]["Enums"]["subscription_status"] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          expired_at?: string | null;
          id?: string;
          plan_id?: string | null;
          plan_type?: string | null;
          price?: number | null;
          status?: Database["public"]["Enums"]["subscription_status"] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      subscriptions_plans: {
        Row: {
          created_at: string | null;
          daily_token_limit: number | null;
          deleted_at: string | null;
          id: string;
          is_active: boolean | null;
          max_messages_per_day: number | null;
          max_pdfs_per_day: number | null;
          monthly_token_limit: number | null;
          plan_name: string | null;
          plan_type: string | null;
          price: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          daily_token_limit?: number | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_messages_per_day?: number | null;
          max_pdfs_per_day?: number | null;
          monthly_token_limit?: number | null;
          plan_name?: string | null;
          plan_type?: string | null;
          price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          daily_token_limit?: number | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_messages_per_day?: number | null;
          max_pdfs_per_day?: number | null;
          monthly_token_limit?: number | null;
          plan_name?: string | null;
          plan_type?: string | null;
          price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      teacher_student_links: {
        Row: {
          class_code: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          student_user_id: string | null;
          teacher_user_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          class_code?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          student_user_id?: string | null;
          teacher_user_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          class_code?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          student_user_id?: string | null;
          teacher_user_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_student_links_student_user_id_fkey";
            columns: ["student_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "teacher_student_links_teacher_user_id_fkey";
            columns: ["teacher_user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
      whole_usage_tracking: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          limit_reached: boolean | null;
          messages_sent: number | null;
          pdfs_generated: number | null;
          subscription_id: string | null;
          tokens_remaining: number | null;
          total_session_duration_ms: number | null;
          total_token_used: number | null;
          updated_at: string | null;
          usage_date: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          limit_reached?: boolean | null;
          messages_sent?: number | null;
          pdfs_generated?: number | null;
          subscription_id?: string | null;
          tokens_remaining?: number | null;
          total_session_duration_ms?: number | null;
          total_token_used?: number | null;
          updated_at?: string | null;
          usage_date?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          limit_reached?: boolean | null;
          messages_sent?: number | null;
          pdfs_generated?: number | null;
          subscription_id?: string | null;
          tokens_remaining?: number | null;
          total_session_duration_ms?: number | null;
          total_token_used?: number | null;
          updated_at?: string | null;
          usage_date?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "whole_usage_tracking_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whole_usage_tracking_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      permission_category: "chat" | "learn" | "game" | "social" | "account" | "safety";
      provider_status: "success" | "failed" | "fallback_used";
      sender_role: "user" | "model";
      subscription_status: "active" | "cancelled" | "expired" | "trial";
      user_role: "kid" | "parent" | "teacher";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      permission_category: ["chat", "learn", "game", "social", "account", "safety"],
      provider_status: ["success", "failed", "fallback_used"],
      sender_role: ["user", "model"],
      subscription_status: ["active", "cancelled", "expired", "trial"],
      user_role: ["kid", "parent", "teacher"],
    },
  },
} as const;
