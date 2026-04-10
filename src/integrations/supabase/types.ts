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
      accounts_payable: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string
          cost_center_id: string | null
          created_at: string
          description: string
          discount_amount: number | null
          due_date: string
          expense_type: string | null
          id: string
          installment_number: number | null
          interest: number | null
          invoice_number: string | null
          notes: string | null
          open_amount: number | null
          original_amount: number | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          penalty: number | null
          status: string
          supplier: string
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          category?: string
          cost_center_id?: string | null
          created_at?: string
          description: string
          discount_amount?: number | null
          due_date: string
          expense_type?: string | null
          id?: string
          installment_number?: number | null
          interest?: number | null
          invoice_number?: string | null
          notes?: string | null
          open_amount?: number | null
          original_amount?: number | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          penalty?: number | null
          status?: string
          supplier: string
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          discount_amount?: number | null
          due_date?: string
          expense_type?: string | null
          id?: string
          installment_number?: number | null
          interest?: number | null
          invoice_number?: string | null
          notes?: string | null
          open_amount?: number | null
          original_amount?: number | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          penalty?: number | null
          status?: string
          supplier?: string
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          client_name: string
          created_at: string
          description: string
          discount_amount: number | null
          due_date: string
          id: string
          installment_number: number | null
          interest: number | null
          invoice_number: string | null
          issue_date: string | null
          nfe_id: string | null
          notes: string | null
          open_amount: number | null
          order_id: string | null
          original_amount: number | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          penalty: number | null
          status: string
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          client_id?: string | null
          client_name: string
          created_at?: string
          description: string
          discount_amount?: number | null
          due_date: string
          id?: string
          installment_number?: number | null
          interest?: number | null
          invoice_number?: string | null
          issue_date?: string | null
          nfe_id?: string | null
          notes?: string | null
          open_amount?: number | null
          order_id?: string | null
          original_amount?: number | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          penalty?: number | null
          status?: string
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          description?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          installment_number?: number | null
          interest?: number | null
          invoice_number?: string | null
          issue_date?: string | null
          nfe_id?: string | null
          notes?: string | null
          open_amount?: number | null
          order_id?: string | null
          original_amount?: number | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          penalty?: number | null
          status?: string
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_daily_actions: {
        Row: {
          action_date: string
          action_type: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_value: number | null
          explanation: string | null
          id: string
          priority: number
          result: string | null
          sales_rep_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          action_date?: string
          action_type?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          explanation?: string | null
          id?: string
          priority?: number
          result?: string | null
          sales_rep_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          action_date?: string
          action_type?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          explanation?: string | null
          id?: string
          priority?: number
          result?: string | null
          sales_rep_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_daily_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_executive_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          description: string | null
          id: string
          metric_name: string | null
          metric_value: number | null
          module: string | null
          resolved_at: string | null
          severity: string
          status: string
          threshold_value: number | null
          title: string
          trend: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string | null
          metric_value?: number | null
          module?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title: string
          trend?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string | null
          metric_value?: number | null
          module?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title?: string
          trend?: string | null
        }
        Relationships: []
      }
      ai_executive_chat: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_executive_insights: {
        Row: {
          category: string
          created_at: string
          data_points: Json | null
          description: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          expires_at: string | null
          explanation: string | null
          id: string
          impact_estimate: string | null
          insight_type: string
          module: string | null
          recommended_actions: Json | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          data_points?: Json | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          explanation?: string | null
          id?: string
          impact_estimate?: string | null
          insight_type?: string
          module?: string | null
          recommended_actions?: Json | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          data_points?: Json | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          explanation?: string | null
          id?: string
          impact_estimate?: string | null
          insight_type?: string
          module?: string | null
          recommended_actions?: Json | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_executive_scenarios: {
        Row: {
          assumptions: Json | null
          created_at: string
          generated_at: string
          id: string
          optimistic: Json | null
          period: string
          pessimistic: Json | null
          realistic: Json | null
          recommendations: Json | null
          scenario_type: string
        }
        Insert: {
          assumptions?: Json | null
          created_at?: string
          generated_at?: string
          id?: string
          optimistic?: Json | null
          period?: string
          pessimistic?: Json | null
          realistic?: Json | null
          recommendations?: Json | null
          scenario_type?: string
        }
        Update: {
          assumptions?: Json | null
          created_at?: string
          generated_at?: string
          id?: string
          optimistic?: Json | null
          period?: string
          pessimistic?: Json | null
          realistic?: Json | null
          recommendations?: Json | null
          scenario_type?: string
        }
        Relationships: []
      }
      ai_forecast_snapshots: {
        Row: {
          best_case: number | null
          by_region: Json | null
          by_rep: Json | null
          by_segment: Json | null
          confidence: number | null
          created_at: string
          factors: Json | null
          forecast_date: string
          id: string
          period: string
          predicted_revenue: number | null
          worst_case: number | null
        }
        Insert: {
          best_case?: number | null
          by_region?: Json | null
          by_rep?: Json | null
          by_segment?: Json | null
          confidence?: number | null
          created_at?: string
          factors?: Json | null
          forecast_date?: string
          id?: string
          period?: string
          predicted_revenue?: number | null
          worst_case?: number | null
        }
        Update: {
          best_case?: number | null
          by_region?: Json | null
          by_rep?: Json | null
          by_segment?: Json | null
          confidence?: number | null
          created_at?: string
          factors?: Json | null
          forecast_date?: string
          id?: string
          period?: string
          predicted_revenue?: number | null
          worst_case?: number | null
        }
        Relationships: []
      }
      ai_opportunity_predictions: {
        Row: {
          client_id: string | null
          close_probability: number
          computed_at: string
          created_at: string
          explanation: string | null
          funnel_id: string | null
          id: string
          key_factors: Json | null
          loss_risk: number
          model_version: string | null
          order_id: string | null
          predicted_close_date: string | null
          predicted_value: number | null
          recommended_action: string | null
        }
        Insert: {
          client_id?: string | null
          close_probability?: number
          computed_at?: string
          created_at?: string
          explanation?: string | null
          funnel_id?: string | null
          id?: string
          key_factors?: Json | null
          loss_risk?: number
          model_version?: string | null
          order_id?: string | null
          predicted_close_date?: string | null
          predicted_value?: number | null
          recommended_action?: string | null
        }
        Update: {
          client_id?: string | null
          close_probability?: number
          computed_at?: string
          created_at?: string
          explanation?: string | null
          funnel_id?: string | null
          id?: string
          key_factors?: Json | null
          loss_risk?: number
          model_version?: string | null
          order_id?: string | null
          predicted_close_date?: string | null
          predicted_value?: number | null
          recommended_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_opportunity_predictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_opportunity_predictions_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_opportunity_predictions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          acted_at: string | null
          acted_by: string | null
          client_id: string
          confidence: number | null
          created_at: string
          description: string | null
          estimated_value: number | null
          expires_at: string | null
          explanation: string | null
          id: string
          priority: string | null
          recommendation_type: string
          result: string | null
          sales_rep_id: string | null
          status: string | null
          suggested_products: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          acted_at?: string | null
          acted_by?: string | null
          client_id: string
          confidence?: number | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          expires_at?: string | null
          explanation?: string | null
          id?: string
          priority?: string | null
          recommendation_type?: string
          result?: string | null
          sales_rep_id?: string | null
          status?: string | null
          suggested_products?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          acted_at?: string | null
          acted_by?: string | null
          client_id?: string
          confidence?: number | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          expires_at?: string | null
          explanation?: string | null
          id?: string
          priority?: string | null
          recommendation_type?: string
          result?: string | null
          sales_rep_id?: string | null
          status?: string | null
          suggested_products?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_insights: {
        Row: {
          created_at: string
          data_points: Json | null
          description: string
          dismissed_at: string | null
          dismissed_by: string | null
          expires_at: string | null
          explanation: string | null
          id: string
          insight_type: string
          related_entity_id: string | null
          related_entity_type: string | null
          severity: string | null
          status: string | null
          suggested_actions: Json | null
          target_role: string
          title: string
        }
        Insert: {
          created_at?: string
          data_points?: Json | null
          description: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          explanation?: string | null
          id?: string
          insight_type?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string | null
          status?: string | null
          suggested_actions?: Json | null
          target_role?: string
          title: string
        }
        Update: {
          created_at?: string
          data_points?: Json | null
          description?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          explanation?: string | null
          id?: string
          insight_type?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string | null
          status?: string | null
          suggested_actions?: Json | null
          target_role?: string
          title?: string
        }
        Relationships: []
      }
      ai_sales_scores: {
        Row: {
          churn_probability: number | null
          client_id: string
          computed_at: string
          created_at: string
          days_since_purchase: number | null
          engagement_score: number | null
          explanation: string | null
          frequency_score: number | null
          growth_score: number | null
          id: string
          monetary_score: number | null
          priority_level: string
          purchase_trend: string | null
          recency_score: number | null
          recompra_probability: number | null
          risk_score: number | null
          score_grade: string
          score_numeric: number
          updated_at: string
        }
        Insert: {
          churn_probability?: number | null
          client_id: string
          computed_at?: string
          created_at?: string
          days_since_purchase?: number | null
          engagement_score?: number | null
          explanation?: string | null
          frequency_score?: number | null
          growth_score?: number | null
          id?: string
          monetary_score?: number | null
          priority_level?: string
          purchase_trend?: string | null
          recency_score?: number | null
          recompra_probability?: number | null
          risk_score?: number | null
          score_grade?: string
          score_numeric?: number
          updated_at?: string
        }
        Update: {
          churn_probability?: number | null
          client_id?: string
          computed_at?: string
          created_at?: string
          days_since_purchase?: number | null
          engagement_score?: number | null
          explanation?: string | null
          frequency_score?: number | null
          growth_score?: number | null
          id?: string
          monetary_score?: number | null
          priority_level?: string
          purchase_trend?: string | null
          recency_score?: number | null
          recompra_probability?: number | null
          risk_score?: number | null
          score_grade?: string
          score_numeric?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          active: boolean
          agency: string | null
          balance: number
          bank_code: string | null
          bank_name: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string
          active?: boolean
          agency?: string | null
          balance?: number
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          active?: boolean
          agency?: string | null
          balance?: number
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          date: string
          description: string
          id: string
          matched_entry_id: string | null
          status: string
          type: string
        }
        Insert: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          matched_entry_id?: string | null
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          matched_entry_id?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      billing_queue: {
        Row: {
          amount: number
          billed_amount: number
          billed_at: string | null
          billed_by: string | null
          billing_type: string
          created_at: string
          id: string
          invoice_number: string | null
          nfe_id: string | null
          notes: string | null
          order_id: string
          pending_amount: number
          status: string
          updated_at: string
          validated_at: string | null
          validation_errors: string[] | null
        }
        Insert: {
          amount?: number
          billed_amount?: number
          billed_at?: string | null
          billed_by?: string | null
          billing_type?: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          nfe_id?: string | null
          notes?: string | null
          order_id: string
          pending_amount?: number
          status?: string
          updated_at?: string
          validated_at?: string | null
          validation_errors?: string[] | null
        }
        Update: {
          amount?: number
          billed_amount?: number
          billed_at?: string | null
          billed_by?: string | null
          billing_type?: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          nfe_id?: string | null
          notes?: string | null
          order_id?: string
          pending_amount?: number
          status?: string
          updated_at?: string
          validated_at?: string | null
          validation_errors?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_queue_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_entries: {
        Row: {
          account: string
          amount: number
          balance: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        Insert: {
          account?: string
          amount?: number
          balance?: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          reference?: string | null
          type?: string
        }
        Update: {
          account?: string
          amount?: number
          balance?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          reference?: string | null
          type?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          active: boolean
          balance: number
          code: string
          created_at: string
          id: string
          is_analytical: boolean
          level: number
          name: string
          nature: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          balance?: number
          code: string
          created_at?: string
          id?: string
          is_analytical?: boolean
          level?: number
          name: string
          nature?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          balance?: number
          code?: string
          created_at?: string
          id?: string
          is_analytical?: boolean
          level?: number
          name?: string
          nature?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_timeline: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          abc_classification: string | null
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          avg_ticket: number | null
          cellphone: string | null
          client_score: string | null
          code: string
          commercial_notes: string | null
          created_at: string
          credit_limit: number
          current_balance: number
          default_payment_condition: string | null
          document: string
          document_type: string
          email: string
          estimated_potential: number | null
          id: string
          last_purchase_date: string | null
          micro_region: string | null
          municipal_registration: string | null
          name: string
          phone: string
          price_table: string | null
          purchase_frequency: number | null
          region: string | null
          sales_rep_id: string | null
          segment: string | null
          state_registration: string | null
          status: string
          total_purchases: number | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          abc_classification?: string | null
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          avg_ticket?: number | null
          cellphone?: string | null
          client_score?: string | null
          code: string
          commercial_notes?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          default_payment_condition?: string | null
          document: string
          document_type?: string
          email: string
          estimated_potential?: number | null
          id?: string
          last_purchase_date?: string | null
          micro_region?: string | null
          municipal_registration?: string | null
          name: string
          phone: string
          price_table?: string | null
          purchase_frequency?: number | null
          region?: string | null
          sales_rep_id?: string | null
          segment?: string | null
          state_registration?: string | null
          status?: string
          total_purchases?: number | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          abc_classification?: string | null
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          avg_ticket?: number | null
          cellphone?: string | null
          client_score?: string | null
          code?: string
          commercial_notes?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          default_payment_condition?: string | null
          document?: string
          document_type?: string
          email?: string
          estimated_potential?: number | null
          id?: string
          last_purchase_date?: string | null
          micro_region?: string | null
          municipal_registration?: string | null
          name?: string
          phone?: string
          price_table?: string | null
          purchase_frequency?: number | null
          region?: string | null
          sales_rep_id?: string | null
          segment?: string | null
          state_registration?: string | null
          status?: string
          total_purchases?: number | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_actions: {
        Row: {
          action_type: string
          client_id: string
          contact_method: string | null
          created_at: string
          description: string
          id: string
          next_action_date: string | null
          next_action_description: string | null
          promise_amount: number | null
          promise_date: string | null
          promise_status: string | null
          receivable_id: string | null
          responsible: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          client_id: string
          contact_method?: string | null
          created_at?: string
          description: string
          id?: string
          next_action_date?: string | null
          next_action_description?: string | null
          promise_amount?: number | null
          promise_date?: string | null
          promise_status?: string | null
          receivable_id?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          client_id?: string
          contact_method?: string | null
          created_at?: string
          description?: string
          id?: string
          next_action_date?: string | null
          next_action_description?: string | null
          promise_amount?: number | null
          promise_date?: string | null
          promise_status?: string | null
          receivable_id?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_actions_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_alerts: {
        Row: {
          alert_type: string
          client_id: string | null
          created_at: string | null
          description: string | null
          funnel_id: string | null
          id: string
          order_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          sales_rep_id: string | null
          severity: string | null
          status: string | null
          title: string
        }
        Insert: {
          alert_type: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          funnel_id?: string | null
          id?: string
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sales_rep_id?: string | null
          severity?: string | null
          status?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          funnel_id?: string | null
          id?: string
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sales_rep_id?: string | null
          severity?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_alerts_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_alerts_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commissions_count: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          period: string
          sales_rep_id: string
          sales_rep_name: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commissions_count?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          period: string
          sales_rep_id: string
          sales_rep_name: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commissions_count?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          period?: string
          sales_rep_id?: string
          sales_rep_name?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_policies: {
        Row: {
          active: boolean
          applies_to: string
          applies_to_entity_id: string | null
          base_percentage: number
          calculation_type: string
          created_at: string
          description: string | null
          discount_reduction_pct: number | null
          extra_percentage: number | null
          id: string
          margin_reduction_pct: number | null
          max_discount_pct: number | null
          min_margin_pct: number | null
          name: string
          requires_invoicing: boolean
          requires_payment: boolean
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          applies_to?: string
          applies_to_entity_id?: string | null
          base_percentage?: number
          calculation_type?: string
          created_at?: string
          description?: string | null
          discount_reduction_pct?: number | null
          extra_percentage?: number | null
          id?: string
          margin_reduction_pct?: number | null
          max_discount_pct?: number | null
          min_margin_pct?: number | null
          name: string
          requires_invoicing?: boolean
          requires_payment?: boolean
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          applies_to?: string
          applies_to_entity_id?: string | null
          base_percentage?: number
          calculation_type?: string
          created_at?: string
          description?: string | null
          discount_reduction_pct?: number | null
          extra_percentage?: number | null
          id?: string
          margin_reduction_pct?: number | null
          max_discount_pct?: number | null
          min_margin_pct?: number | null
          name?: string
          requires_invoicing?: boolean
          requires_payment?: boolean
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          max_value: number | null
          min_value: number | null
          percentage: number
          policy_id: string
          priority: number
          rule_label: string | null
          rule_type: string
          rule_value: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          max_value?: number | null
          min_value?: number | null
          percentage?: number
          policy_id: string
          priority?: number
          rule_label?: string | null
          rule_type?: string
          rule_value?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          max_value?: number | null
          min_value?: number | null
          percentage?: number
          policy_id?: string
          priority?: number
          rule_label?: string | null
          rule_type?: string
          rule_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "commission_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          adjusted_value: number | null
          adjustment_reason: string | null
          applied_percentage: number
          approved_at: string | null
          approved_by: string | null
          base_value: number
          block_reason: string | null
          calculated_value: number
          client_id: string | null
          client_name: string | null
          created_at: string
          discount_value: number | null
          id: string
          invoice_date: string | null
          margin_pct: number | null
          net_value: number
          order_id: string | null
          order_item_id: string | null
          order_number: string | null
          paid_at: string | null
          payment_date: string | null
          period: string | null
          policy_id: string | null
          policy_name: string | null
          rule_id: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adjusted_value?: number | null
          adjustment_reason?: string | null
          applied_percentage?: number
          approved_at?: string | null
          approved_by?: string | null
          base_value?: number
          block_reason?: string | null
          calculated_value?: number
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          discount_value?: number | null
          id?: string
          invoice_date?: string | null
          margin_pct?: number | null
          net_value?: number
          order_id?: string | null
          order_item_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_date?: string | null
          period?: string | null
          policy_id?: string | null
          policy_name?: string | null
          rule_id?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adjusted_value?: number | null
          adjustment_reason?: string | null
          applied_percentage?: number
          approved_at?: string | null
          approved_by?: string | null
          base_value?: number
          block_reason?: string | null
          calculated_value?: number
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          discount_value?: number | null
          id?: string
          invoice_date?: string | null
          margin_pct?: number | null
          net_value?: number
          order_id?: string | null
          order_item_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_date?: string | null
          period?: string | null
          policy_id?: string | null
          policy_name?: string | null
          rule_id?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "commission_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          cnpj: string
          created_at: string
          email: string | null
          id: string
          is_headquarters: boolean
          municipal_registration: string | null
          name: string
          parent_company_id: string | null
          phone: string | null
          state_registration: string | null
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          cnpj: string
          created_at?: string
          email?: string | null
          id?: string
          is_headquarters?: boolean
          municipal_registration?: string | null
          name: string
          parent_company_id?: string | null
          phone?: string | null
          state_registration?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: string
          is_headquarters?: boolean
          municipal_registration?: string | null
          name?: string
          parent_company_id?: string | null
          phone?: string | null
          state_registration?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_record_items: {
        Row: {
          checked_qty: number
          conference_id: string
          divergence: number
          expected_qty: number
          id: string
          notes: string | null
          order_item_id: string | null
          product_code: string
          product_name: string
          status: string
        }
        Insert: {
          checked_qty?: number
          conference_id: string
          divergence?: number
          expected_qty?: number
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_code: string
          product_name: string
          status?: string
        }
        Update: {
          checked_qty?: number
          conference_id?: string
          divergence?: number
          expected_qty?: number
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_code?: string
          product_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_record_items_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conference_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_record_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_records: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          checked_items: number
          completed_at: string | null
          conferee: string | null
          conferee_user_id: string | null
          conference_number: string
          created_at: string
          divergent_items: number
          id: string
          notes: string | null
          order_id: string
          started_at: string | null
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          checked_items?: number
          completed_at?: string | null
          conferee?: string | null
          conferee_user_id?: string | null
          conference_number: string
          created_at?: string
          divergent_items?: number
          id?: string
          notes?: string | null
          order_id: string
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          checked_items?: number
          completed_at?: string | null
          conferee?: string | null
          conferee_user_id?: string | null
          conference_number?: string
          created_at?: string
          divergent_items?: number
          id?: string
          notes?: string | null
          order_id?: string
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_audit_logs: {
        Row: {
          action: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          justification: string | null
          new_value: Json | null
          old_value: Json | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          action: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          justification?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          justification?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      credit_policies: {
        Row: {
          active: boolean
          allow_new_client_credit: boolean | null
          auto_block_overdue_amount: number | null
          auto_block_overdue_days: number | null
          created_at: string
          description: string | null
          id: string
          max_discount_pct: number | null
          max_payment_days: number | null
          max_score: number | null
          min_score: number | null
          name: string
          requires_approval_above: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_new_client_credit?: boolean | null
          auto_block_overdue_amount?: number | null
          auto_block_overdue_days?: number | null
          created_at?: string
          description?: string | null
          id?: string
          max_discount_pct?: number | null
          max_payment_days?: number | null
          max_score?: number | null
          min_score?: number | null
          name: string
          requires_approval_above?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_new_client_credit?: boolean | null
          auto_block_overdue_amount?: number | null
          auto_block_overdue_days?: number | null
          created_at?: string
          description?: string | null
          id?: string
          max_discount_pct?: number | null
          max_payment_days?: number | null
          max_score?: number | null
          min_score?: number | null
          name?: string
          requires_approval_above?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_credit_profiles: {
        Row: {
          analysis_notes: string | null
          analysis_valid_until: string | null
          analyst_id: string | null
          analyst_name: string | null
          available_limit: number | null
          avg_delay_days: number | null
          client_id: string
          created_at: string
          credit_limit: number
          credit_status: string
          id: string
          last_analysis_date: string | null
          overdue_amount: number | null
          overdue_count: number | null
          risk_classification: string
          score_grade: string | null
          score_numeric: number
          total_open_amount: number | null
          updated_at: string
          used_limit: number
        }
        Insert: {
          analysis_notes?: string | null
          analysis_valid_until?: string | null
          analyst_id?: string | null
          analyst_name?: string | null
          available_limit?: number | null
          avg_delay_days?: number | null
          client_id: string
          created_at?: string
          credit_limit?: number
          credit_status?: string
          id?: string
          last_analysis_date?: string | null
          overdue_amount?: number | null
          overdue_count?: number | null
          risk_classification?: string
          score_grade?: string | null
          score_numeric?: number
          total_open_amount?: number | null
          updated_at?: string
          used_limit?: number
        }
        Update: {
          analysis_notes?: string | null
          analysis_valid_until?: string | null
          analyst_id?: string | null
          analyst_name?: string | null
          available_limit?: number | null
          avg_delay_days?: number | null
          client_id?: string
          created_at?: string
          credit_limit?: number
          credit_status?: string
          id?: string
          last_analysis_date?: string | null
          overdue_amount?: number | null
          overdue_count?: number | null
          risk_classification?: string
          score_grade?: string | null
          score_numeric?: number
          total_open_amount?: number | null
          updated_at?: string
          used_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          location: string | null
          occurred_at: string
          registered_by: string | null
          shipment_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type?: string
          id?: string
          location?: string | null
          occurred_at?: string
          registered_by?: string | null
          shipment_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          location?: string | null
          occurred_at?: string
          registered_by?: string | null
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      fiscal_reports: {
        Row: {
          created_at: string
          end_date: string
          file_url: string | null
          generated_at: string | null
          id: string
          name: string
          period: string
          start_date: string
          status: string
          total_cofins: number
          total_icms: number
          total_ipi: number
          total_nfce: number
          total_nfe: number
          total_pis: number
          total_value: number
          type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          file_url?: string | null
          generated_at?: string | null
          id?: string
          name: string
          period: string
          start_date: string
          status?: string
          total_cofins?: number
          total_icms?: number
          total_ipi?: number
          total_nfce?: number
          total_nfe?: number
          total_pis?: number
          total_value?: number
          type: string
        }
        Update: {
          created_at?: string
          end_date?: string
          file_url?: string | null
          generated_at?: string | null
          id?: string
          name?: string
          period?: string
          start_date?: string
          status?: string
          total_cofins?: number
          total_icms?: number
          total_ipi?: number
          total_nfce?: number
          total_nfe?: number
          total_pis?: number
          total_value?: number
          type?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          funnel_id: string | null
          id: string
          next_action: string | null
          order_id: string | null
          result: string | null
          sales_rep_id: string | null
          scheduled_date: string
          status: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          funnel_id?: string | null
          id?: string
          next_action?: string | null
          order_id?: string | null
          result?: string | null
          sales_rep_id?: string | null
          scheduled_date: string
          status?: string
          subject: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          funnel_id?: string | null
          id?: string
          next_action?: string | null
          order_id?: string | null
          result?: string | null
          sales_rep_id?: string | null
          scheduled_date?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          number: string
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          id?: string
          number: string
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          number?: string
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_code: string
          account_id: string | null
          account_name: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_code: string
          account_id?: string | null
          account_name: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_code?: string
          account_id?: string | null
          account_name?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      material_consumptions: {
        Row: {
          batch: string | null
          component_code: string
          component_name: string
          consumed_at: string | null
          consumed_by: string | null
          consumed_quantity: number
          created_at: string
          expected_quantity: number
          id: string
          location: string | null
          order_number: string
          production_order_id: string | null
          unit: string
        }
        Insert: {
          batch?: string | null
          component_code: string
          component_name: string
          consumed_at?: string | null
          consumed_by?: string | null
          consumed_quantity?: number
          created_at?: string
          expected_quantity?: number
          id?: string
          location?: string | null
          order_number: string
          production_order_id?: string | null
          unit?: string
        }
        Update: {
          batch?: string | null
          component_code?: string
          component_name?: string
          consumed_at?: string | null
          consumed_by?: string | null
          consumed_quantity?: number
          created_at?: string
          expected_quantity?: number
          id?: string
          location?: string | null
          order_number?: string
          production_order_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_consumptions_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce: {
        Row: {
          access_key: string | null
          amount_paid: number
          authorization_date: string | null
          cancellation_date: string | null
          change_amount: number
          created_at: string
          customer_document: string | null
          customer_name: string | null
          discount: number
          id: string
          issue_date: string
          number: string
          operator_id: string | null
          operator_name: string | null
          payment_method: string
          protocol: string | null
          qr_code: string | null
          series: string
          status: string
          subtotal: number
          terminal_id: string | null
          total: number
        }
        Insert: {
          access_key?: string | null
          amount_paid?: number
          authorization_date?: string | null
          cancellation_date?: string | null
          change_amount?: number
          created_at?: string
          customer_document?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          issue_date?: string
          number: string
          operator_id?: string | null
          operator_name?: string | null
          payment_method?: string
          protocol?: string | null
          qr_code?: string | null
          series?: string
          status?: string
          subtotal?: number
          terminal_id?: string | null
          total?: number
        }
        Update: {
          access_key?: string | null
          amount_paid?: number
          authorization_date?: string | null
          cancellation_date?: string | null
          change_amount?: number
          created_at?: string
          customer_document?: string | null
          customer_name?: string | null
          discount?: number
          id?: string
          issue_date?: string
          number?: string
          operator_id?: string | null
          operator_name?: string | null
          payment_method?: string
          protocol?: string | null
          qr_code?: string | null
          series?: string
          status?: string
          subtotal?: number
          terminal_id?: string | null
          total?: number
        }
        Relationships: []
      }
      nfce_items: {
        Row: {
          cfop: string | null
          discount: number
          id: string
          ncm: string | null
          nfce_id: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          cfop?: string | null
          discount?: number
          id?: string
          ncm?: string | null
          nfce_id: string
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          cfop?: string | null
          discount?: number
          id?: string
          ncm?: string | null
          nfce_id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfce_items_nfce_id_fkey"
            columns: ["nfce_id"]
            isOneToOne: false
            referencedRelation: "nfce"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe: {
        Row: {
          access_key: string | null
          authorization_date: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          client_document: string | null
          client_id: string | null
          client_name: string
          cofins: number
          created_at: string
          discount: number
          icms: number
          id: string
          ipi: number
          issue_date: string
          number: string
          operation_type: string
          order_id: string | null
          pis: number
          protocol: string | null
          series: string
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          access_key?: string | null
          authorization_date?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          client_document?: string | null
          client_id?: string | null
          client_name: string
          cofins?: number
          created_at?: string
          discount?: number
          icms?: number
          id?: string
          ipi?: number
          issue_date?: string
          number: string
          operation_type?: string
          order_id?: string | null
          pis?: number
          protocol?: string | null
          series?: string
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          access_key?: string | null
          authorization_date?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          client_document?: string | null
          client_id?: string | null
          client_name?: string
          cofins?: number
          created_at?: string
          discount?: number
          icms?: number
          id?: string
          ipi?: number
          issue_date?: string
          number?: string
          operation_type?: string
          order_id?: string | null
          pis?: number
          protocol?: string | null
          series?: string
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfe_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_items: {
        Row: {
          cfop: string | null
          cofins_rate: number
          cofins_value: number
          discount: number
          icms_base: number
          icms_rate: number
          icms_value: number
          id: string
          ipi_rate: number
          ipi_value: number
          ncm: string | null
          nfe_id: string
          pis_rate: number
          pis_value: number
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          cfop?: string | null
          cofins_rate?: number
          cofins_value?: number
          discount?: number
          icms_base?: number
          icms_rate?: number
          icms_value?: number
          id?: string
          ipi_rate?: number
          ipi_value?: number
          ncm?: string | null
          nfe_id: string
          pis_rate?: number
          pis_value?: number
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          cfop?: string | null
          cofins_rate?: number
          cofins_value?: number
          discount?: number
          icms_base?: number
          icms_rate?: number
          icms_value?: number
          id?: string
          ipi_rate?: number
          ipi_value?: number
          ncm?: string | null
          nfe_id?: string
          pis_rate?: number
          pis_value?: number
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfe_items_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          module: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          module?: string
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_approvals: {
        Row: {
          approval_type: string
          approved_at: string | null
          approved_by: string | null
          block_id: string | null
          created_at: string
          id: string
          justification: string | null
          notes: string | null
          order_id: string
          requested_at: string
          requested_by: string | null
          status: string
        }
        Insert: {
          approval_type?: string
          approved_at?: string | null
          approved_by?: string | null
          block_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          notes?: string | null
          order_id: string
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          approval_type?: string
          approved_at?: string | null
          approved_by?: string | null
          block_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          notes?: string | null
          order_id?: string
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_approvals_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "order_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_approvals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_blocks: {
        Row: {
          approval_level: string | null
          block_reason: string
          block_type: string
          blocked_at: string
          blocked_by: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          release_justification: string | null
          released_at: string | null
          released_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_level?: string | null
          block_reason: string
          block_type?: string
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          release_justification?: string | null
          released_at?: string | null
          released_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_level?: string | null
          block_reason?: string
          block_type?: string
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          release_justification?: string | null
          released_at?: string | null
          released_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_blocks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number
          id: string
          order_id: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: string
          order_id: string
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          discount?: number
          id?: string
          order_id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          block_reason: string | null
          changed_by: string | null
          changed_by_user_id: string | null
          created_at: string
          from_status: string | null
          id: string
          observation: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          block_reason?: string | null
          changed_by?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          observation?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          block_reason?: string | null
          changed_by?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          observation?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billing_status: string | null
          client_id: string | null
          client_name: string
          commercial_approval: string | null
          commission_rate: number | null
          commission_value: number | null
          conference_status: string | null
          created_at: string
          date: string
          delivery_date: string | null
          discount: number
          expected_billing_date: string | null
          financial_approval: string | null
          fulfillment_status: string | null
          id: string
          internal_notes: string | null
          max_discount_pct: number | null
          notes: string | null
          number: string
          payment_condition: string
          payment_method: string
          priority: string
          production_status: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          separation_status: string | null
          shipment_status: string | null
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billing_status?: string | null
          client_id?: string | null
          client_name: string
          commercial_approval?: string | null
          commission_rate?: number | null
          commission_value?: number | null
          conference_status?: string | null
          created_at?: string
          date?: string
          delivery_date?: string | null
          discount?: number
          expected_billing_date?: string | null
          financial_approval?: string | null
          fulfillment_status?: string | null
          id?: string
          internal_notes?: string | null
          max_discount_pct?: number | null
          notes?: string | null
          number: string
          payment_condition?: string
          payment_method?: string
          priority?: string
          production_status?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          separation_status?: string | null
          shipment_status?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billing_status?: string | null
          client_id?: string | null
          client_name?: string
          commercial_approval?: string | null
          commission_rate?: number | null
          commission_value?: number | null
          conference_status?: string | null
          created_at?: string
          date?: string
          delivery_date?: string | null
          discount?: number
          expected_billing_date?: string | null
          financial_approval?: string | null
          fulfillment_status?: string | null
          id?: string
          internal_notes?: string | null
          max_discount_pct?: number | null
          notes?: string | null
          number?: string
          payment_condition?: string
          payment_method?: string
          priority?: string
          production_status?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          separation_status?: string | null
          shipment_status?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          created_by: string | null
          discount: number
          id: string
          interest: number
          notes: string | null
          payable_id: string | null
          payment_date: string
          payment_method: string
          penalty: number
          receivable_id: string | null
          total_paid: number
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          interest?: number
          notes?: string | null
          payable_id?: string | null
          payment_date?: string
          payment_method?: string
          penalty?: number
          receivable_id?: string | null
          total_paid?: number
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          interest?: number
          notes?: string | null
          payable_id?: string | null
          payment_date?: string
          payment_method?: string
          penalty?: number
          receivable_id?: string | null
          total_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          feature_label: string
          id: string
          limit_value: number | null
          plan_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          feature_label: string
          id?: string
          limit_value?: number | null
          plan_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          feature_label?: string
          id?: string
          limit_value?: number | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          allowed_modules: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_orders_month: number
          max_users: number
          name: string
          price_annual: number
          price_monthly: number
          slug: string
          sort_order: number
          storage_mb: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          allowed_modules?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_orders_month?: number
          max_users?: number
          name: string
          price_annual?: number
          price_monthly?: number
          slug: string
          sort_order?: number
          storage_mb?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          allowed_modules?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_orders_month?: number
          max_users?: number
          name?: string
          price_annual?: number
          price_monthly?: number
          slug?: string
          sort_order?: number
          storage_mb?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      production_orders: {
        Row: {
          bom_id: string | null
          completed_date: string | null
          created_at: string
          due_date: string | null
          estimated_time_minutes: number | null
          id: string
          notes: string | null
          operator: string | null
          order_item_id: string | null
          order_number: string
          priority: string
          produced_quantity: number
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          realized_time_minutes: number | null
          route_id: string | null
          sales_order_id: string | null
          sector: string | null
          start_date: string | null
          status: string
          unit: string
          updated_at: string
          work_center: string | null
        }
        Insert: {
          bom_id?: string | null
          completed_date?: string | null
          created_at?: string
          due_date?: string | null
          estimated_time_minutes?: number | null
          id?: string
          notes?: string | null
          operator?: string | null
          order_item_id?: string | null
          order_number: string
          priority?: string
          produced_quantity?: number
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          realized_time_minutes?: number | null
          route_id?: string | null
          sales_order_id?: string | null
          sector?: string | null
          start_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          work_center?: string | null
        }
        Update: {
          bom_id?: string | null
          completed_date?: string | null
          created_at?: string
          due_date?: string | null
          estimated_time_minutes?: number | null
          id?: string
          notes?: string | null
          operator?: string | null
          order_item_id?: string | null
          order_number?: string
          priority?: string
          produced_quantity?: number
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          realized_time_minutes?: number | null
          route_id?: string | null
          sales_order_id?: string | null
          sector?: string | null
          start_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          code: string
          cost_price: number
          created_at: string
          depth: number | null
          description: string | null
          height: number | null
          id: string
          image_url: string | null
          lead_time_days: number
          location: string | null
          max_stock: number
          min_stock: number
          name: string
          reorder_point: number
          sale_price: number
          status: string
          subcategory: string | null
          supplier: string | null
          type: string
          unit: string
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          code: string
          cost_price?: number
          created_at?: string
          depth?: number | null
          description?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          lead_time_days?: number
          location?: string | null
          max_stock?: number
          min_stock?: number
          name: string
          reorder_point?: number
          sale_price?: number
          status?: string
          subcategory?: string | null
          supplier?: string | null
          type?: string
          unit?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          code?: string
          cost_price?: number
          created_at?: string
          depth?: number | null
          description?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          lead_time_days?: number
          location?: string | null
          max_stock?: number
          min_stock?: number
          name?: string
          reorder_point?: number
          sale_price?: number
          status?: string
          subcategory?: string | null
          supplier?: string | null
          type?: string
          unit?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          discount: number
          id: string
          product_code: string
          product_id: string | null
          product_name: string
          purchase_order_id: string
          quantity: number
          received_quantity: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: string
          product_code: string
          product_id?: string | null
          product_name: string
          purchase_order_id: string
          quantity?: number
          received_quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          discount?: number
          id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          buyer_id: string | null
          buyer_name: string | null
          created_at: string
          date: string
          discount: number
          expected_delivery: string | null
          id: string
          notes: string | null
          number: string
          payment_condition: string | null
          payment_terms: string | null
          priority: string
          shipping: number
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          taxes: number
          total: number
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          buyer_name?: string | null
          created_at?: string
          date?: string
          discount?: number
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          number: string
          payment_condition?: string | null
          payment_terms?: string | null
          priority?: string
          shipping?: number
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name: string
          taxes?: number
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          buyer_name?: string | null
          created_at?: string
          date?: string
          discount?: number
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          number?: string
          payment_condition?: string | null
          payment_terms?: string | null
          priority?: string
          shipping?: number
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          taxes?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          discount: number
          id: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          quotation_id: string
          total: number
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: string
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          quotation_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          discount?: number
          id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          quotation_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          date: string
          discount: number
          id: string
          notes: string | null
          number: string
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          valid_until: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          date?: string
          discount?: number
          id?: string
          notes?: string | null
          number: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          date?: string
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      renegotiation_items: {
        Row: {
          id: string
          original_amount: number
          receivable_id: string | null
          renegotiation_id: string
        }
        Insert: {
          id?: string
          original_amount?: number
          receivable_id?: string | null
          renegotiation_id: string
        }
        Update: {
          id?: string
          original_amount?: number
          receivable_id?: string | null
          renegotiation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renegotiation_items_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renegotiation_items_renegotiation_id_fkey"
            columns: ["renegotiation_id"]
            isOneToOne: false
            referencedRelation: "renegotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      renegotiations: {
        Row: {
          client_id: string
          client_name: string
          created_at: string
          created_by: string | null
          first_due_date: string | null
          id: string
          installments: number
          interest_rate: number
          new_total: number
          notes: string | null
          original_total: number
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string
          created_by?: string | null
          first_due_date?: string | null
          id?: string
          installments?: number
          interest_rate?: number
          new_total?: number
          notes?: string | null
          original_total?: number
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          first_due_date?: string | null
          id?: string
          installments?: number
          interest_rate?: number
          new_total?: number
          notes?: string | null
          original_total?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renegotiations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      rfid_events: {
        Row: {
          action_taken: string | null
          antenna: number | null
          created_at: string
          event_type: string
          id: string
          location: string | null
          metadata: Json | null
          processed: boolean
          processed_at: string | null
          reader_code: string
          reader_id: string | null
          rssi: number | null
          tag_epc: string
          tag_id: string | null
          zone: string | null
        }
        Insert: {
          action_taken?: string | null
          antenna?: number | null
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          processed?: boolean
          processed_at?: string | null
          reader_code: string
          reader_id?: string | null
          rssi?: number | null
          tag_epc: string
          tag_id?: string | null
          zone?: string | null
        }
        Update: {
          action_taken?: string | null
          antenna?: number | null
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          processed?: boolean
          processed_at?: string | null
          reader_code?: string
          reader_id?: string | null
          rssi?: number | null
          tag_epc?: string
          tag_id?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfid_events_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "rfid_readers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfid_events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "rfid_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      rfid_readers: {
        Row: {
          antenna_count: number | null
          code: string
          created_at: string
          id: string
          ip_address: string | null
          last_heartbeat: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          port: number | null
          status: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          antenna_count?: number | null
          code: string
          created_at?: string
          id?: string
          ip_address?: string | null
          last_heartbeat?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          port?: number | null
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          antenna_count?: number | null
          code?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          last_heartbeat?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          port?: number | null
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      rfid_tags: {
        Row: {
          batch: string | null
          created_at: string
          epc: string
          id: string
          last_read_at: string | null
          location: string | null
          pallet_id: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          registered_at: string
          status: string
          tag_type: string
          updated_at: string
        }
        Insert: {
          batch?: string | null
          created_at?: string
          epc: string
          id?: string
          last_read_at?: string | null
          location?: string | null
          pallet_id?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          registered_at?: string
          status?: string
          tag_type?: string
          updated_at?: string
        }
        Update: {
          batch?: string | null
          created_at?: string
          epc?: string
          id?: string
          last_read_at?: string | null
          location?: string | null
          pallet_id?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          registered_at?: string
          status?: string
          tag_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfid_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rfid_wms_rules: {
        Row: {
          auto_complete: boolean
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          priority: number
          trigger_event_type: string
          trigger_reader_code: string | null
          trigger_zone: string | null
          updated_at: string
          wms_action: string
          wms_target_location: string | null
        }
        Insert: {
          auto_complete?: boolean
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          priority?: number
          trigger_event_type: string
          trigger_reader_code?: string | null
          trigger_zone?: string | null
          updated_at?: string
          wms_action: string
          wms_target_location?: string | null
        }
        Update: {
          auto_complete?: boolean
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          priority?: number
          trigger_event_type?: string
          trigger_reader_code?: string | null
          trigger_zone?: string | null
          updated_at?: string
          wms_action?: string
          wms_target_location?: string | null
        }
        Relationships: []
      }
      saas_invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          description: string | null
          due_date: string
          external_payment_id: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          description?: string | null
          due_date: string
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          discount: number
          id: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: string
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          discount?: number
          id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          date: string
          discount: number
          id: string
          notes: string | null
          number: string
          payment_method: string
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          date?: string
          discount?: number
          id?: string
          notes?: string | null
          number: string
          payment_method?: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          date?: string
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          payment_method?: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          current_value: number
          description: string | null
          end_date: string
          goal_type: string
          goal_value: number
          id: string
          incentive_description: string | null
          name: string
          start_date: string
          status: string
          target_products: Json | null
          target_segments: Json | null
          updated_at: string
        }
        Insert: {
          campaign_type?: string
          created_at?: string
          current_value?: number
          description?: string | null
          end_date: string
          goal_type?: string
          goal_value?: number
          id?: string
          incentive_description?: string | null
          name: string
          start_date: string
          status?: string
          target_products?: Json | null
          target_segments?: Json | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          current_value?: number
          description?: string | null
          end_date?: string
          goal_type?: string
          goal_value?: number
          id?: string
          incentive_description?: string | null
          name?: string
          start_date?: string
          status?: string
          target_products?: Json | null
          target_segments?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_contact_logs: {
        Row: {
          client_id: string | null
          contact_type: string
          created_at: string
          duration_minutes: number | null
          funnel_id: string | null
          id: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          response_time_minutes: number | null
          result: string
          sales_rep_id: string | null
        }
        Insert: {
          client_id?: string | null
          contact_type?: string
          created_at?: string
          duration_minutes?: number | null
          funnel_id?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          response_time_minutes?: number | null
          result?: string
          sales_rep_id?: string | null
        }
        Update: {
          client_id?: string | null
          contact_type?: string
          created_at?: string
          duration_minutes?: number | null
          funnel_id?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          response_time_minutes?: number | null
          result?: string
          sales_rep_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_contact_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_contact_logs_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_contact_logs_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_daily_goals: {
        Row: {
          achieved_contacts: number
          achieved_proposals: number
          achieved_value: number
          created_at: string
          goal_date: string
          id: string
          sales_rep_id: string
          target_contacts: number
          target_proposals: number
          target_value: number
          updated_at: string
        }
        Insert: {
          achieved_contacts?: number
          achieved_proposals?: number
          achieved_value?: number
          created_at?: string
          goal_date?: string
          id?: string
          sales_rep_id: string
          target_contacts?: number
          target_proposals?: number
          target_value?: number
          updated_at?: string
        }
        Update: {
          achieved_contacts?: number
          achieved_proposals?: number
          achieved_value?: number
          created_at?: string
          goal_date?: string
          id?: string
          sales_rep_id?: string
          target_contacts?: number
          target_proposals?: number
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_daily_goals_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_forecasts: {
        Row: {
          confirmed_value: number
          conservative_value: number
          conversion_rate: number | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          historical_avg: number | null
          id: string
          notes: string | null
          optimistic_value: number
          period: string
          pipeline_value: number
          realistic_value: number
          snapshot_date: string
          weighted_value: number
        }
        Insert: {
          confirmed_value?: number
          conservative_value?: number
          conversion_rate?: number | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          historical_avg?: number | null
          id?: string
          notes?: string | null
          optimistic_value?: number
          period: string
          pipeline_value?: number
          realistic_value?: number
          snapshot_date?: string
          weighted_value?: number
        }
        Update: {
          confirmed_value?: number
          conservative_value?: number
          conversion_rate?: number | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          historical_avg?: number | null
          id?: string
          notes?: string | null
          optimistic_value?: number
          period?: string
          pipeline_value?: number
          realistic_value?: number
          snapshot_date?: string
          weighted_value?: number
        }
        Relationships: []
      }
      sales_funnel: {
        Row: {
          client_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lost_date: string | null
          lost_reason: string | null
          notes: string | null
          order_id: string | null
          probability: number | null
          sales_rep_id: string | null
          source: string | null
          stage: string
          status: string | null
          title: string
          updated_at: string | null
          value: number | null
          won_date: string | null
        }
        Insert: {
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_date?: string | null
          lost_reason?: string | null
          notes?: string | null
          order_id?: string | null
          probability?: number | null
          sales_rep_id?: string | null
          source?: string | null
          stage?: string
          status?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
          won_date?: string | null
        }
        Update: {
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_date?: string | null
          lost_reason?: string | null
          notes?: string | null
          order_id?: string | null
          probability?: number | null
          sales_rep_id?: string | null
          source?: string | null
          stage?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_funnel_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_opportunities: {
        Row: {
          client_id: string
          contacted_at: string | null
          created_at: string
          description: string | null
          estimated_value: number
          id: string
          opportunity_type: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          sales_rep_id: string | null
          status: string
          suggested_products: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          contacted_at?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number
          id?: string
          opportunity_type?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sales_rep_id?: string | null
          status?: string
          suggested_products?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          contacted_at?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number
          id?: string
          opportunity_type?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sales_rep_id?: string | null
          status?: string
          suggested_products?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunities_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_reps: {
        Row: {
          code: string
          commission_rate: number | null
          created_at: string | null
          email: string | null
          id: string
          micro_region: string | null
          monthly_target: number | null
          name: string
          phone: string | null
          region: string | null
          status: string | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          micro_region?: string | null
          monthly_target?: number | null
          name: string
          phone?: string | null
          region?: string | null
          status?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          micro_region?: string | null
          monthly_target?: number | null
          name?: string
          phone?: string | null
          region?: string | null
          status?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sales_targets: {
        Row: {
          achieved_value: number
          achievement_pct: number | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          name: string
          notes: string | null
          period: string
          period_type: string
          projection: number | null
          status: string
          target_type: string
          target_value: number
          updated_at: string
        }
        Insert: {
          achieved_value?: number
          achievement_pct?: number | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          name: string
          notes?: string | null
          period: string
          period_type?: string
          projection?: number | null
          status?: string
          target_type?: string
          target_value?: number
          updated_at?: string
        }
        Update: {
          achieved_value?: number
          achievement_pct?: number | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          name?: string
          notes?: string | null
          period?: string
          period_type?: string
          projection?: number | null
          status?: string
          target_type?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      seller_daily_targets: {
        Row: {
          achieved_value: number
          contacts_made: number
          created_at: string
          daily_target: number
          id: string
          opportunities_converted: number
          orders_count: number
          sales_rep_id: string
          target_date: string
          updated_at: string
        }
        Insert: {
          achieved_value?: number
          contacts_made?: number
          created_at?: string
          daily_target?: number
          id?: string
          opportunities_converted?: number
          orders_count?: number
          sales_rep_id: string
          target_date?: string
          updated_at?: string
        }
        Update: {
          achieved_value?: number
          contacts_made?: number
          created_at?: string
          daily_target?: number
          id?: string
          opportunities_converted?: number
          orders_count?: number
          sales_rep_id?: string
          target_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_daily_targets_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          id: string
          notes: string | null
          order_item_id: string | null
          product_code: string
          product_name: string
          quantity: number
          shipment_id: string
          volume_number: number | null
          weight: number
        }
        Insert: {
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_code: string
          product_name: string
          quantity?: number
          shipment_id: string
          volume_number?: number | null
          weight?: number
        }
        Update: {
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_code?: string
          product_name?: string
          quantity?: number
          shipment_id?: string
          volume_number?: number | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_orders: {
        Row: {
          carrier: string | null
          carrier_document: string | null
          created_at: string
          delivered_at: string | null
          delivery_confirmed_by: string | null
          departure_date: string | null
          driver_name: string | null
          expected_delivery: string | null
          freight_cost: number
          freight_type: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_number: string
          status: string
          total_value: number
          total_weight: number
          tracking_code: string | null
          updated_at: string
          vehicle_plate: string | null
          volumes: number
        }
        Insert: {
          carrier?: string | null
          carrier_document?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_confirmed_by?: string | null
          departure_date?: string | null
          driver_name?: string | null
          expected_delivery?: string | null
          freight_cost?: number
          freight_type?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_number: string
          status?: string
          total_value?: number
          total_weight?: number
          tracking_code?: string | null
          updated_at?: string
          vehicle_plate?: string | null
          volumes?: number
        }
        Update: {
          carrier?: string | null
          carrier_document?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_confirmed_by?: string | null
          departure_date?: string | null
          driver_name?: string | null
          expected_delivery?: string | null
          freight_cost?: number
          freight_type?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_number?: string
          status?: string
          total_value?: number
          total_weight?: number
          tracking_code?: string | null
          updated_at?: string
          vehicle_plate?: string | null
          volumes?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch: string | null
          created_at: string
          direction: string
          document_number: string
          from_warehouse: string | null
          id: string
          notes: string | null
          operator: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          reference: string | null
          source: string | null
          to_warehouse: string | null
          total_cost: number
          type: string
          unit_cost: number
          wms_movement_id: string | null
        }
        Insert: {
          batch?: string | null
          created_at?: string
          direction?: string
          document_number?: string
          from_warehouse?: string | null
          id?: string
          notes?: string | null
          operator?: string
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          reference?: string | null
          source?: string | null
          to_warehouse?: string | null
          total_cost?: number
          type?: string
          unit_cost?: number
          wms_movement_id?: string | null
        }
        Update: {
          batch?: string | null
          created_at?: string
          direction?: string
          document_number?: string
          from_warehouse?: string | null
          id?: string
          notes?: string | null
          operator?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          reference?: string | null
          source?: string | null
          to_warehouse?: string | null
          total_cost?: number
          type?: string
          unit_cost?: number
          wms_movement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_wms_movement_id_fkey"
            columns: ["wms_movement_id"]
            isOneToOne: false
            referencedRelation: "wms_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          created_at: string
          id: string
          location: string | null
          order_id: string
          order_item_id: string | null
          picked_qty: number
          product_code: string
          product_id: string | null
          product_name: string
          released_at: string | null
          requested_qty: number
          reserved_at: string | null
          reserved_by: string | null
          reserved_qty: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          order_id: string
          order_item_id?: string | null
          picked_qty?: number
          product_code: string
          product_id?: string | null
          product_name: string
          released_at?: string | null
          requested_qty?: number
          reserved_at?: string | null
          reserved_by?: string | null
          reserved_qty?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          order_id?: string
          order_item_id?: string | null
          picked_qty?: number
          product_code?: string
          product_id?: string | null
          product_name?: string
          released_at?: string | null
          requested_qty?: number
          reserved_at?: string | null
          reserved_by?: string | null
          reserved_qty?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          company_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          external_gateway: string | null
          external_subscription_id: string | null
          id: string
          plan_id: string
          status: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_gateway?: string | null
          external_subscription_id?: string | null
          id?: string
          plan_id: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_gateway?: string | null
          external_subscription_id?: string | null
          id?: string
          plan_id?: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          category: string | null
          cellphone: string | null
          code: string
          created_at: string
          delivery_time: number
          document: string
          document_type: string
          email: string | null
          id: string
          name: string
          payment_terms: string | null
          phone: string | null
          rating: number
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          category?: string | null
          cellphone?: string | null
          code: string
          created_at?: string
          delivery_time?: number
          document: string
          document_type?: string
          email?: string | null
          id?: string
          name: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          category?: string | null
          cellphone?: string | null
          code?: string
          created_at?: string
          delivery_time?: number
          document?: string
          document_type?: string
          email?: string | null
          id?: string
          name?: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_parameters: {
        Row: {
          category: string
          code: string
          created_at: string
          default_value: string | null
          description: string | null
          id: string
          name: string
          options: Json | null
          required: boolean
          sensitive: boolean
          type: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          default_value?: string | null
          description?: string | null
          id?: string
          name: string
          options?: Json | null
          required?: boolean
          sensitive?: boolean
          type?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          default_value?: string | null
          description?: string | null
          id?: string
          name?: string
          options?: Json | null
          required?: boolean
          sensitive?: boolean
          type?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          operation_id: string | null
          operation_name: string
          operator: string
          order_number: string
          paused_time: number
          produced_quantity: number
          production_order_id: string | null
          rejected_quantity: number
          start_time: string
          status: string
          work_center: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          operation_id?: string | null
          operation_name: string
          operator: string
          order_number: string
          paused_time?: number
          produced_quantity?: number
          production_order_id?: string | null
          rejected_quantity?: number
          start_time: string
          status?: string
          work_center?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          operation_id?: string | null
          operation_name?: string
          operator?: string
          order_number?: string
          paused_time?: number
          produced_quantity?: number
          production_order_id?: string | null
          rejected_quantity?: number
          start_time?: string
          status?: string
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          company_id: string
          current_value: number
          id: string
          limit_value: number | null
          metric: string
          period: string
          updated_at: string
        }
        Insert: {
          company_id: string
          current_value?: number
          id?: string
          limit_value?: number | null
          metric: string
          period: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          current_value?: number
          id?: string
          limit_value?: number | null
          metric?: string
          period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wms_inventory_counts: {
        Row: {
          completed_at: string | null
          count_number: string
          created_at: string
          discrepancies: number
          id: string
          items_count: number
          operator: string | null
          scheduled_date: string
          started_at: string | null
          status: string
          zone: string | null
        }
        Insert: {
          completed_at?: string | null
          count_number: string
          created_at?: string
          discrepancies?: number
          id?: string
          items_count?: number
          operator?: string | null
          scheduled_date: string
          started_at?: string | null
          status?: string
          zone?: string | null
        }
        Update: {
          completed_at?: string | null
          count_number?: string
          created_at?: string
          discrepancies?: number
          id?: string
          items_count?: number
          operator?: string | null
          scheduled_date?: string
          started_at?: string | null
          status?: string
          zone?: string | null
        }
        Relationships: []
      }
      wms_inventory_items: {
        Row: {
          available_qty: number
          batch: string | null
          category: string | null
          created_at: string
          expiration_date: string | null
          id: string
          last_movement: string | null
          location: string | null
          max_stock: number
          min_stock: number
          product_code: string
          product_name: string
          quantity: number
          reserved_qty: number
          status: string
          unit: string
          value: number
        }
        Insert: {
          available_qty?: number
          batch?: string | null
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          last_movement?: string | null
          location?: string | null
          max_stock?: number
          min_stock?: number
          product_code: string
          product_name: string
          quantity?: number
          reserved_qty?: number
          status?: string
          unit?: string
          value?: number
        }
        Update: {
          available_qty?: number
          batch?: string | null
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          last_movement?: string | null
          location?: string | null
          max_stock?: number
          min_stock?: number
          product_code?: string
          product_name?: string
          quantity?: number
          reserved_qty?: number
          status?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      wms_inventory_movements: {
        Row: {
          created_at: string
          from_location: string | null
          id: string
          operator: string | null
          product_code: string
          product_name: string
          quantity: number
          reason: string | null
          to_location: string | null
          type: string
        }
        Insert: {
          created_at?: string
          from_location?: string | null
          id?: string
          operator?: string | null
          product_code: string
          product_name: string
          quantity?: number
          reason?: string | null
          to_location?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          from_location?: string | null
          id?: string
          operator?: string | null
          product_code?: string
          product_name?: string
          quantity?: number
          reason?: string | null
          to_location?: string | null
          type?: string
        }
        Relationships: []
      }
      wms_movements: {
        Row: {
          created_at: string
          from_location: string | null
          id: string
          operator: string | null
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          reason: string
          reference: string | null
          to_location: string | null
          type: string
        }
        Insert: {
          created_at?: string
          from_location?: string | null
          id?: string
          operator?: string | null
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          reason?: string
          reference?: string | null
          to_location?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          from_location?: string | null
          id?: string
          operator?: string | null
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string
          reference?: string | null
          to_location?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_packing_orders: {
        Row: {
          carrier: string | null
          completed_at: string | null
          created_at: string
          customer_name: string
          id: string
          operator: string | null
          order_number: string
          picking_order_id: string | null
          sales_order_id: string | null
          shipped_at: string | null
          started_at: string | null
          status: string
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name: string
          id?: string
          operator?: string | null
          order_number: string
          picking_order_id?: string | null
          sales_order_id?: string | null
          shipped_at?: string | null
          started_at?: string | null
          status?: string
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          operator?: string | null
          order_number?: string
          picking_order_id?: string | null
          sales_order_id?: string | null
          shipped_at?: string | null
          started_at?: string | null
          status?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_packing_orders_picking_order_id_fkey"
            columns: ["picking_order_id"]
            isOneToOne: false
            referencedRelation: "wms_picking_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_picking_items: {
        Row: {
          id: string
          location: string
          picked: boolean
          picked_qty: number
          picking_order_id: string
          product_code: string
          product_name: string
          requested_qty: number
          unit: string
        }
        Insert: {
          id?: string
          location: string
          picked?: boolean
          picked_qty?: number
          picking_order_id: string
          product_code: string
          product_name: string
          requested_qty?: number
          unit?: string
        }
        Update: {
          id?: string
          location?: string
          picked?: boolean
          picked_qty?: number
          picking_order_id?: string
          product_code?: string
          product_name?: string
          requested_qty?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_picking_items_picking_order_id_fkey"
            columns: ["picking_order_id"]
            isOneToOne: false
            referencedRelation: "wms_picking_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_picking_orders: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          customer_name: string
          id: string
          items_count: number
          order_number: string
          picked_items: number
          priority: string
          sales_order_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name: string
          id?: string
          items_count?: number
          order_number: string
          picked_items?: number
          priority?: string
          sales_order_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          items_count?: number
          order_number?: string
          picked_items?: number
          priority?: string
          sales_order_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      wms_receiving_items: {
        Row: {
          batch: string | null
          expected_qty: number
          expiration_date: string | null
          id: string
          product_code: string
          product_name: string
          received_qty: number
          receiving_order_id: string
          unit: string
        }
        Insert: {
          batch?: string | null
          expected_qty?: number
          expiration_date?: string | null
          id?: string
          product_code: string
          product_name: string
          received_qty?: number
          receiving_order_id: string
          unit?: string
        }
        Update: {
          batch?: string | null
          expected_qty?: number
          expiration_date?: string | null
          id?: string
          product_code?: string
          product_name?: string
          received_qty?: number
          receiving_order_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_receiving_items_receiving_order_id_fkey"
            columns: ["receiving_order_id"]
            isOneToOne: false
            referencedRelation: "wms_receiving_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_receiving_orders: {
        Row: {
          created_at: string
          dock: string | null
          expected_date: string | null
          id: string
          operator: string | null
          order_number: string
          purchase_order_id: string | null
          received_date: string | null
          status: string
          supplier: string
        }
        Insert: {
          created_at?: string
          dock?: string | null
          expected_date?: string | null
          id?: string
          operator?: string | null
          order_number: string
          purchase_order_id?: string | null
          received_date?: string | null
          status?: string
          supplier: string
        }
        Update: {
          created_at?: string
          dock?: string | null
          expected_date?: string | null
          id?: string
          operator?: string | null
          order_number?: string
          purchase_order_id?: string | null
          received_date?: string | null
          status?: string
          supplier?: string
        }
        Relationships: []
      }
      wms_storage_locations: {
        Row: {
          active: boolean
          aisle: string
          capacity: number
          code: string
          created_at: string
          id: string
          level: string
          occupied: number
          position: string
          rack: string
          type: string
          zone: string
        }
        Insert: {
          active?: boolean
          aisle: string
          capacity?: number
          code: string
          created_at?: string
          id?: string
          level: string
          occupied?: number
          position?: string
          rack: string
          type?: string
          zone: string
        }
        Update: {
          active?: boolean
          aisle?: string
          capacity?: number
          code?: string
          created_at?: string
          id?: string
          level?: string
          occupied?: number
          position?: string
          rack?: string
          type?: string
          zone?: string
        }
        Relationships: []
      }
      work_centers: {
        Row: {
          capacity: number
          code: string
          created_at: string
          current_load: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          code: string
          created_at?: string
          current_load?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          code?: string
          created_at?: string
          current_load?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "manager" | "operator" | "viewer"
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
      app_role: ["admin", "manager", "operator", "viewer"],
    },
  },
} as const
