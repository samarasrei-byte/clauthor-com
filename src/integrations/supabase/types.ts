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
      agent_credentials: {
        Row: {
          access_count: number
          agent_id: string
          created_at: string
          credential_key: string
          credential_value: string
          expires_at: string | null
          id: string
          integration_name: string
          is_secret: boolean
          last_accessed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number
          agent_id: string
          created_at?: string
          credential_key: string
          credential_value: string
          expires_at?: string | null
          id?: string
          integration_name: string
          is_secret?: boolean
          last_accessed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number
          agent_id?: string
          created_at?: string
          credential_key?: string
          credential_value?: string
          expires_at?: string | null
          id?: string
          integration_name?: string
          is_secret?: boolean
          last_accessed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_credentials_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_meetings: {
        Row: {
          agent_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          meeting_date: string
          meeting_time: string
          meeting_type: string | null
          notes: string | null
          participants: string[] | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_date: string
          meeting_time: string
          meeting_type?: string | null
          notes?: string | null
          participants?: string[] | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_date?: string
          meeting_time?: string
          meeting_type?: string | null
          notes?: string | null
          participants?: string[] | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_meetings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_meetings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memory: {
        Row: {
          agent_id: string
          content: Json
          created_at: string
          id: string
          memory_type: string
          squad_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          content?: Json
          created_at?: string
          id?: string
          memory_type?: string
          squad_id?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: Json
          created_at?: string
          id?: string
          memory_type?: string
          squad_id?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reports: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          period: string | null
          report_type: string
          sections: Json | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          period?: string | null
          report_type?: string
          sections?: Json | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          period?: string | null
          report_type?: string
          sections?: Json | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string | null
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          created_at: string
          default_actions: Json | null
          default_channels: Json | null
          default_integrations: Json | null
          description: string | null
          id: string
          instructions: string
          is_active: boolean
          name: string
          slug: string
          system_prompt: string
          tags: string[] | null
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_actions?: Json | null
          default_channels?: Json | null
          default_integrations?: Json | null
          description?: string | null
          id?: string
          instructions: string
          is_active?: boolean
          name: string
          slug: string
          system_prompt: string
          tags?: string[] | null
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_actions?: Json | null
          default_channels?: Json | null
          default_integrations?: Json | null
          description?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          name?: string
          slug?: string
          system_prompt?: string
          tags?: string[] | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_tools: {
        Row: {
          agent_id: string
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          actions: Json | null
          channels: Json | null
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          integrations: Json | null
          knowledge_base: Json | null
          monthly_price: number
          name: string
          objective: string | null
          status: Database["public"]["Enums"]["agent_status"]
          tier: Database["public"]["Enums"]["agent_tier"]
          total_executions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          channels?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          integrations?: Json | null
          knowledge_base?: Json | null
          monthly_price?: number
          name: string
          objective?: string | null
          status?: Database["public"]["Enums"]["agent_status"]
          tier?: Database["public"]["Enums"]["agent_tier"]
          total_executions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          channels?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          integrations?: Json | null
          knowledge_base?: Json | null
          monthly_price?: number
          name?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["agent_status"]
          tier?: Database["public"]["Enums"]["agent_tier"]
          total_executions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          agent_tier: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          squad_id: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          agent_tier?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          squad_id?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          agent_tier?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          squad_id?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: Database["public"]["Enums"]["community_category"]
          comments_count: number
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          likes_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["community_category"]
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["community_category"]
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_board: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credential_audit_logs: {
        Row: {
          action: string
          agent_id: string
          created_at: string
          credential_key: string
          id: string
          integration_name: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action?: string
          agent_id: string
          created_at?: string
          credential_key: string
          id?: string
          integration_name: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          agent_id?: string
          created_at?: string
          credential_key?: string
          id?: string
          integration_name?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_audit_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          monthly_credits: number
          name: string
          price_cents: number
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          monthly_credits: number
          name: string
          price_cents?: number
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          monthly_credits?: number
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      department_suggestions: {
        Row: {
          created_at: string
          department_name: string
          email: string | null
          id: string
          reason: string | null
          votes: number
        }
        Insert: {
          created_at?: string
          department_name: string
          email?: string | null
          id?: string
          reason?: string | null
          votes?: number
        }
        Update: {
          created_at?: string
          department_name?: string
          email?: string | null
          id?: string
          reason?: string | null
          votes?: number
        }
        Relationships: []
      }
      execution_logs: {
        Row: {
          action: string
          agent_id: string
          created_at: string
          details: Json | null
          execution_time_ms: number | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          agent_id: string
          created_at?: string
          details?: Json | null
          execution_time_ms?: number | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          agent_id?: string
          created_at?: string
          details?: Json | null
          execution_time_ms?: number | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_agents: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          long_description: string | null
          monthly_price: number
          publisher_id: string
          rating: number | null
          short_description: string | null
          tags: string[] | null
          tier: Database["public"]["Enums"]["agent_tier"]
          title: string
          total_reviews: number | null
          total_subscribers: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          long_description?: string | null
          monthly_price: number
          publisher_id: string
          rating?: number | null
          short_description?: string | null
          tags?: string[] | null
          tier: Database["public"]["Enums"]["agent_tier"]
          title: string
          total_reviews?: number | null
          total_subscribers?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          long_description?: string | null
          monthly_price?: number
          publisher_id?: string
          rating?: number | null
          short_description?: string | null
          tags?: string[] | null
          tier?: Database["public"]["Enums"]["agent_tier"]
          title?: string
          total_reviews?: number | null
          total_subscribers?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      openclaw_registrations: {
        Row: {
          agent_id: string
          created_at: string
          error_message: string | null
          id: string
          last_webhook_at: string | null
          metadata: Json | null
          openclaw_agent_id: string | null
          status: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_webhook_at?: string | null
          metadata?: Json | null
          openclaw_agent_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_webhook_at?: string | null
          metadata?: Json | null
          openclaw_agent_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_registrations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          item_id: string
          item_name: string
          metadata: Json | null
          paypal_order_id: string | null
          status: string
          tokens_amount: number
          type: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          item_id: string
          item_name: string
          metadata?: Json | null
          paypal_order_id?: string | null
          status?: string
          tokens_amount?: number
          type?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          item_id?: string
          item_name?: string
          metadata?: Json | null
          paypal_order_id?: string | null
          status?: string
          tokens_amount?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          max_agents: number
          max_monthly_executions: number
          max_squads: number
          max_team_members: number
          max_tools_per_agent: number
          plan_type: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          max_agents?: number
          max_monthly_executions?: number
          max_squads?: number
          max_team_members?: number
          max_tools_per_agent?: number
          plan_type: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          max_agents?: number
          max_monthly_executions?: number
          max_squads?: number
          max_team_members?: number
          max_tools_per_agent?: number
          plan_type?: string
        }
        Relationships: []
      }
      platform_credentials: {
        Row: {
          created_at: string
          credential_key: string
          credential_value: string
          description: string | null
          id: string
          integration_name: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_key: string
          credential_value: string
          description?: string | null
          id?: string
          integration_name: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_key?: string
          credential_value?: string
          description?: string | null
          id?: string
          integration_name?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      squad_agents: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          squad_id: string
          tenant_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          squad_id: string
          tenant_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          squad_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_agents_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          agent_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          marketplace_agent_id: string | null
          monthly_price: number
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          marketplace_agent_id?: string | null
          monthly_price: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          marketplace_agent_id?: string | null
          monthly_price?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_marketplace_agent_id_fkey"
            columns: ["marketplace_agent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_type: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_type?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_type?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          action_type: string
          agent_id: string | null
          created_at: string
          id: string
          model: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          action_type: string
          agent_id?: string | null
          created_at?: string
          id?: string
          model?: string
          tokens_used: number
          user_id: string
        }
        Update: {
          action_type?: string
          agent_id?: string | null
          created_at?: string
          id?: string
          model?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_tier_requirements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          min_plan: string
          min_tier: string
          monthly_limit: number | null
          tool_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          min_plan?: string
          min_tier?: string
          monthly_limit?: number | null
          tool_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          min_plan?: string
          min_tier?: string
          monthly_limit?: number | null
          tool_name?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string
          created_at: string
          credential_fields: Json | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          name: string
          requires_credential: boolean
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          credential_fields?: Json | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          requires_credential?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          credential_fields?: Json | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          requires_credential?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_reset_at: string
          id: string
          plan_type: string
          total_credits: number
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_reset_at?: string
          id?: string
          plan_type?: string
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits_reset_at?: string
          id?: string
          plan_type?: string
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          position: number
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          position?: number
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          position?: number
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_agent_executions: {
        Args: { p_agent_id: string }
        Returns: undefined
      }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "draft" | "active" | "paused" | "archived"
      agent_tier: "basic" | "intermediate" | "advanced" | "enterprise"
      app_role: "admin" | "customer"
      community_category:
        | "duvidas"
        | "templates"
        | "showcase"
        | "anuncios"
        | "geral"
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
      agent_status: ["draft", "active", "paused", "archived"],
      agent_tier: ["basic", "intermediate", "advanced", "enterprise"],
      app_role: ["admin", "customer"],
      community_category: [
        "duvidas",
        "templates",
        "showcase",
        "anuncios",
        "geral",
      ],
    },
  },
} as const
