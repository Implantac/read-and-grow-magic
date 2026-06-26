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
      accounting_accounts: {
        Row: {
          code: string
          company_id: string
          created_at: string | null
          id: string
          level: number
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string | null
          id?: string
          level: number
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string | null
          id?: string
          level?: number
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_entries: {
        Row: {
          company_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      accounting_items: {
        Row: {
          account_id: string | null
          amount: number
          cost_center_id: string | null
          created_at: string | null
          entry_id: string | null
          id: string
          type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          cost_center_id?: string | null
          created_at?: string | null
          entry_id?: string | null
          id?: string
          type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          cost_center_id?: string | null
          created_at?: string | null
          entry_id?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "accounting_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          company_id: string
          created_at: string
          id: string
          month: number
          notes: string | null
          result_amount: number | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          result_amount?: number | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          result_amount?: number | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      accounts_payable: {
        Row: {
          amount: number
          bank_account_id: string | null
          branch_id: string | null
          category: string
          category_id: string | null
          company_id: string
          cost_center_id: string | null
          created_at: string
          description: string
          discount_amount: number | null
          due_date: string
          expected_payment_date: string | null
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
          priority: string | null
          recurrence: string | null
          source_id: string | null
          source_type: string | null
          status: string
          supplier: string
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          branch_id?: string | null
          category?: string
          category_id?: string | null
          company_id: string
          cost_center_id?: string | null
          created_at?: string
          description: string
          discount_amount?: number | null
          due_date: string
          expected_payment_date?: string | null
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
          priority?: string | null
          recurrence?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          supplier: string
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          branch_id?: string | null
          category?: string
          category_id?: string | null
          company_id?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          discount_amount?: number | null
          due_date?: string
          expected_payment_date?: string | null
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
          priority?: string | null
          recurrence?: string | null
          source_id?: string | null
          source_type?: string | null
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
            foreignKeyName: "accounts_payable_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          bank_account_id: string | null
          branch_id: string | null
          category: string
          category_id: string | null
          client_id: string | null
          client_name: string
          company_id: string
          created_at: string
          description: string
          discount_amount: number | null
          due_date: string
          expected_date: string | null
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
          recurrence: string | null
          source_id: string | null
          source_type: string | null
          status: string
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          branch_id?: string | null
          category?: string
          category_id?: string | null
          client_id?: string | null
          client_name: string
          company_id: string
          created_at?: string
          description: string
          discount_amount?: number | null
          due_date: string
          expected_date?: string | null
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
          recurrence?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          branch_id?: string | null
          category?: string
          category_id?: string | null
          client_id?: string | null
          client_name?: string
          company_id?: string
          created_at?: string
          description?: string
          discount_amount?: number | null
          due_date?: string
          expected_date?: string | null
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
          recurrence?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      ai_action_logs: {
        Row: {
          action_name: string
          action_type: string
          company_id: string | null
          context: string | null
          created_at: string
          id: string
          module: string
          parameters: Json | null
          result: string | null
          user_id: string | null
        }
        Insert: {
          action_name: string
          action_type: string
          company_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          module: string
          parameters?: Json | null
          result?: string | null
          user_id?: string | null
        }
        Update: {
          action_name?: string
          action_type?: string
          company_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          module?: string
          parameters?: Json | null
          result?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_brain_decisions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_executable: boolean
          company_id: string | null
          confidence: number
          created_at: string
          decision_type: string
          evidence: Json
          executed_at: string | null
          execution_result: Json | null
          id: string
          impact_level: string
          module: string
          proposed_action: Json
          rationale: string
          requires_approval: boolean
          risk_level: string
          run_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_executable?: boolean
          company_id?: string | null
          confidence?: number
          created_at?: string
          decision_type: string
          evidence?: Json
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          impact_level?: string
          module: string
          proposed_action?: Json
          rationale: string
          requires_approval?: boolean
          risk_level?: string
          run_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_executable?: boolean
          company_id?: string | null
          confidence?: number
          created_at?: string
          decision_type?: string
          evidence?: Json
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          impact_level?: string
          module?: string
          proposed_action?: Json
          rationale?: string
          requires_approval?: boolean
          risk_level?: string
          run_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_brain_memory: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          embedding_summary: string | null
          expires_at: string | null
          id: string
          importance: number
          key: string
          scope: string
          source: string | null
          updated_at: string
          user_id: string | null
          value: Json
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string
          embedding_summary?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          key: string
          scope?: string
          source?: string | null
          updated_at?: string
          user_id?: string | null
          value: Json
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          embedding_summary?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          key?: string
          scope?: string
          source?: string | null
          updated_at?: string
          user_id?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_brain_runs: {
        Row: {
          agents_used: string[]
          company_id: string | null
          created_at: string
          decisions_count: number
          duration_ms: number | null
          error: string | null
          id: string
          input: Json | null
          mode: string
          status: string
          structured: Json | null
          synthesis: string | null
          trigger: string
          user_id: string | null
        }
        Insert: {
          agents_used?: string[]
          company_id?: string | null
          created_at?: string
          decisions_count?: number
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          mode?: string
          status?: string
          structured?: Json | null
          synthesis?: string | null
          trigger: string
          user_id?: string | null
        }
        Update: {
          agents_used?: string[]
          company_id?: string | null
          created_at?: string
          decisions_count?: number
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          mode?: string
          status?: string
          structured?: Json | null
          synthesis?: string | null
          trigger?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_daily_actions: {
        Row: {
          action_date: string
          action_type: string
          client_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      ai_enterprise_memory: {
        Row: {
          company_id: string
          context_key: string
          context_value: Json
          created_at: string | null
          id: string
          importance_score: number | null
          module: string
        }
        Insert: {
          company_id: string
          context_key: string
          context_value: Json
          created_at?: string | null
          id?: string
          importance_score?: number | null
          module: string
        }
        Update: {
          company_id?: string
          context_key?: string
          context_value?: Json
          created_at?: string | null
          id?: string
          importance_score?: number | null
          module?: string
        }
        Relationships: []
      }
      ai_executive_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_executive_decisions: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          impact_prediction: Json | null
          problem_description: string
          rationale: string | null
          status: string | null
          suggestion: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          impact_prediction?: Json | null
          problem_description: string
          rationale?: string | null
          status?: string | null
          suggestion: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          impact_prediction?: Json | null
          problem_description?: string
          rationale?: string | null
          status?: string | null
          suggestion?: string
        }
        Relationships: []
      }
      ai_executive_insights: {
        Row: {
          category: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      ai_kpis: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          current_value: number | null
          explanation: string | null
          id: string
          kpi_name: string
          metadata: Json | null
          snapshot_date: string
          status: string
          target_value: number | null
          trend: string | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          current_value?: number | null
          explanation?: string | null
          id?: string
          kpi_name: string
          metadata?: Json | null
          snapshot_date?: string
          status?: string
          target_value?: number | null
          trend?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          current_value?: number | null
          explanation?: string | null
          id?: string
          kpi_name?: string
          metadata?: Json | null
          snapshot_date?: string
          status?: string
          target_value?: number | null
          trend?: string | null
        }
        Relationships: []
      }
      ai_learning: {
        Row: {
          company_id: string | null
          created_at: string
          frequency: number
          id: string
          last_updated: string
          metadata: Json | null
          pattern_key: string
          pattern_type: string
          value: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          frequency?: number
          id?: string
          last_updated?: string
          metadata?: Json | null
          pattern_key: string
          pattern_type: string
          value?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          frequency?: number
          id?: string
          last_updated?: string
          metadata?: Json | null
          pattern_key?: string
          pattern_type?: string
          value?: number | null
        }
        Relationships: []
      }
      ai_opportunity_predictions: {
        Row: {
          client_id: string | null
          close_probability: number
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      ai_production_insights: {
        Row: {
          affected_order_id: string | null
          affected_sector: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          impact_estimate: string | null
          insight_type: string
          recommended_action: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_order_id?: string | null
          affected_sector?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_estimate?: string | null
          insight_type?: string
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_order_id?: string | null
          affected_sector?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_estimate?: string | null
          insight_type?: string
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_production_insights_affected_order_id_fkey"
            columns: ["affected_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_audit_logs: {
        Row: {
          company_id: string | null
          function_name: string
          id: string
          metadata: Json | null
          persona: string
          prompt_version: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          function_name: string
          id?: string
          metadata?: Json | null
          persona: string
          prompt_version: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          function_name?: string
          id?: string
          metadata?: Json | null
          persona?: string
          prompt_version?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          acted_at: string | null
          acted_by: string | null
          client_id: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      automation_rules: {
        Row: {
          actions: Json
          company_id: string
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          company_id: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          company_id?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          company_id: string
          created_at: string
          error: string | null
          id: string
          input: Json
          output: Json
          rule_id: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json
          rule_id: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json
          rule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          bank_reference: string | null
          company_id: string
          created_at: string
          date: string
          description: string
          id: string
          imported_at: string | null
          matched_entry_id: string | null
          source: string | null
          status: string
          type: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          bank_reference?: string | null
          company_id?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          imported_at?: string | null
          matched_entry_id?: string | null
          source?: string | null
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          bank_reference?: string | null
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          imported_at?: string | null
          matched_entry_id?: string | null
          source?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfers: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          fees: number | null
          from_account_id: string
          id: string
          inflow_ledger_id: string | null
          outflow_ledger_id: string | null
          status: string
          to_account_id: string
          transfer_date: string
        }
        Insert: {
          amount: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fees?: number | null
          from_account_id: string
          id?: string
          inflow_ledger_id?: string | null
          outflow_ledger_id?: string | null
          status?: string
          to_account_id: string
          transfer_date?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fees?: number | null
          from_account_id?: string
          id?: string
          inflow_ledger_id?: string | null
          outflow_ledger_id?: string | null
          status?: string
          to_account_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_inflow_ledger_id_fkey"
            columns: ["inflow_ledger_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_outflow_ledger_id_fkey"
            columns: ["outflow_ledger_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_queue: {
        Row: {
          amount: number
          billed_amount: number
          billed_at: string | null
          billed_by: string | null
          billing_type: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      branches: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string | null
          code: string
          company_id: string
          created_at: string
          email: string | null
          id: string
          ie: string | null
          im: string | null
          is_active: boolean
          is_headquarters: boolean
          name: string
          phone: string | null
          tax_regime: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          code: string
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          is_active?: boolean
          is_headquarters?: boolean
          name: string
          phone?: string | null
          tax_regime?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          code?: string
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          is_active?: boolean
          is_headquarters?: boolean
          name?: string
          phone?: string | null
          tax_regime?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          active: boolean
          address: string | null
          code: string
          company_id: string
          contact_name: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          service_types: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          code: string
          company_id?: string
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          service_types?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          code?: string
          company_id?: string
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service_types?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_flow_entries: {
        Row: {
          account: string
          amount: number
          balance: number
          category: string
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      checking_tasks: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          assigned_to: string | null
          blind_check: boolean | null
          check_type: string
          checked_items: number | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          customer_name: string | null
          divergent_items: number | null
          expected_items: number | null
          id: string
          notes: string | null
          order_number: string | null
          reference_id: string
          reference_type: string
          started_at: string | null
          status: string
          task_number: string
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          assigned_to?: string | null
          blind_check?: boolean | null
          check_type?: string
          checked_items?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          divergent_items?: number | null
          expected_items?: number | null
          id?: string
          notes?: string | null
          order_number?: string | null
          reference_id: string
          reference_type: string
          started_at?: string | null
          status?: string
          task_number: string
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          assigned_to?: string | null
          blind_check?: boolean | null
          check_type?: string
          checked_items?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          divergent_items?: number | null
          expected_items?: number | null
          id?: string
          notes?: string | null
          order_number?: string | null
          reference_id?: string
          reference_type?: string
          started_at?: string | null
          status?: string
          task_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_timeline: {
        Row: {
          client_id: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string
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
          company_id: string
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
          company_id?: string
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
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_actions: {
        Row: {
          action_type: string
          client_id: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          {
            foreignKeyName: "collection_actions_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
        ]
      }
      commercial_alerts: {
        Row: {
          alert_type: string
          client_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_size: string | null
          created_at: string
          email: string | null
          enterprise_group_id: string | null
          group_id: string | null
          id: string
          is_headquarters: boolean
          municipal_registration: string | null
          name: string
          operation_types: Json | null
          parent_company_id: string | null
          phone: string | null
          segment: string | null
          segment_id: string | null
          settings: Json | null
          state_registration: string | null
          status: string
          sub_segment: string | null
          tax_regime: Database["public"]["Enums"]["tax_regime"] | null
          tenant_id: string | null
          tier: Database["public"]["Enums"]["enterprise_tier"] | null
          trade_name: string | null
          type: Database["public"]["Enums"]["org_type"] | null
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
          company_size?: string | null
          created_at?: string
          email?: string | null
          enterprise_group_id?: string | null
          group_id?: string | null
          id?: string
          is_headquarters?: boolean
          municipal_registration?: string | null
          name: string
          operation_types?: Json | null
          parent_company_id?: string | null
          phone?: string | null
          segment?: string | null
          segment_id?: string | null
          settings?: Json | null
          state_registration?: string | null
          status?: string
          sub_segment?: string | null
          tax_regime?: Database["public"]["Enums"]["tax_regime"] | null
          tenant_id?: string | null
          tier?: Database["public"]["Enums"]["enterprise_tier"] | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["org_type"] | null
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
          company_size?: string | null
          created_at?: string
          email?: string | null
          enterprise_group_id?: string | null
          group_id?: string | null
          id?: string
          is_headquarters?: boolean
          municipal_registration?: string | null
          name?: string
          operation_types?: Json | null
          parent_company_id?: string | null
          phone?: string | null
          segment?: string | null
          segment_id?: string | null
          settings?: Json | null
          state_registration?: string | null
          status?: string
          sub_segment?: string | null
          tax_regime?: Database["public"]["Enums"]["tax_regime"] | null
          tenant_id?: string | null
          tier?: Database["public"]["Enums"]["enterprise_tier"] | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["org_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_enterprise_group_id_fkey"
            columns: ["enterprise_group_id"]
            isOneToOne: false
            referencedRelation: "enterprise_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "enterprise_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "enterprise_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_record_items: {
        Row: {
          checked_qty: number
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          company_id?: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          company_id?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "credit_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_policies: {
        Row: {
          active: boolean
          allow_new_client_credit: boolean | null
          auto_block_overdue_amount: number | null
          auto_block_overdue_days: number | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      crm_leads: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_opportunities: {
        Row: {
          ai_score: number | null
          company_id: string
          created_at: string | null
          expected_closing_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          pipeline_id: string | null
          stage_id: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          ai_score?: number | null
          company_id: string
          created_at?: string | null
          expected_closing_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          pipeline_id?: string | null
          stage_id?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          ai_score?: number | null
          company_id?: string
          created_at?: string | null
          expected_closing_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          pipeline_id?: string | null
          stage_id?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          pipeline_id: string | null
          probability: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index: number
          pipeline_id?: string | null
          probability?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          pipeline_id?: string | null
          probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      cross_module_events: {
        Row: {
          affected_modules: string[]
          affected_records: Json | null
          affected_tables: string[]
          company_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          source_id: string | null
          source_module: string
          source_reference: string | null
          source_table: string
          status: string
        }
        Insert: {
          affected_modules?: string[]
          affected_records?: Json | null
          affected_tables?: string[]
          company_id?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_module: string
          source_reference?: string | null
          source_table: string
          status?: string
        }
        Update: {
          affected_modules?: string[]
          affected_records?: Json | null
          affected_tables?: string[]
          company_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_module?: string
          source_reference?: string | null
          source_table?: string
          status?: string
        }
        Relationships: []
      }
      cte: {
        Row: {
          access_key: string | null
          authorization_date: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          cargo_value: number
          carrier_document: string | null
          carrier_id: string | null
          carrier_name: string
          company_id: string
          created_at: string
          cte_type: string
          destination_city: string | null
          freight_value: number
          icms_base: number
          icms_rate: number
          icms_value: number
          id: string
          issue_date: string
          modal: string
          notes: string | null
          number: string
          origin_city: string | null
          protocol: string | null
          recipient_document: string | null
          recipient_name: string
          recipient_uf: string | null
          sender_document: string | null
          sender_name: string
          sender_uf: string | null
          series: string
          service_type: string
          status: string
          total: number
          updated_at: string
          xml_content: string | null
        }
        Insert: {
          access_key?: string | null
          authorization_date?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          cargo_value?: number
          carrier_document?: string | null
          carrier_id?: string | null
          carrier_name: string
          company_id?: string
          created_at?: string
          cte_type?: string
          destination_city?: string | null
          freight_value?: number
          icms_base?: number
          icms_rate?: number
          icms_value?: number
          id?: string
          issue_date?: string
          modal?: string
          notes?: string | null
          number: string
          origin_city?: string | null
          protocol?: string | null
          recipient_document?: string | null
          recipient_name: string
          recipient_uf?: string | null
          sender_document?: string | null
          sender_name: string
          sender_uf?: string | null
          series?: string
          service_type?: string
          status?: string
          total?: number
          updated_at?: string
          xml_content?: string | null
        }
        Update: {
          access_key?: string | null
          authorization_date?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          cargo_value?: number
          carrier_document?: string | null
          carrier_id?: string | null
          carrier_name?: string
          company_id?: string
          created_at?: string
          cte_type?: string
          destination_city?: string | null
          freight_value?: number
          icms_base?: number
          icms_rate?: number
          icms_value?: number
          id?: string
          issue_date?: string
          modal?: string
          notes?: string | null
          number?: string
          origin_city?: string | null
          protocol?: string | null
          recipient_document?: string | null
          recipient_name?: string
          recipient_uf?: string | null
          sender_document?: string | null
          sender_name?: string
          sender_uf?: string | null
          series?: string
          service_type?: string
          status?: string
          total?: number
          updated_at?: string
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cte_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      cte_nfe_links: {
        Row: {
          company_id: string
          created_at: string
          cte_id: string
          id: string
          nfe_access_key: string | null
          nfe_id: string | null
          nfe_number: string | null
          nfe_value: number
        }
        Insert: {
          company_id?: string
          created_at?: string
          cte_id: string
          id?: string
          nfe_access_key?: string | null
          nfe_id?: string | null
          nfe_number?: string | null
          nfe_value?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          cte_id?: string
          id?: string
          nfe_access_key?: string | null
          nfe_id?: string | null
          nfe_number?: string | null
          nfe_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "cte_nfe_links_cte_id_fkey"
            columns: ["cte_id"]
            isOneToOne: false
            referencedRelation: "cte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cte_nfe_links_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_entities: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          entity_key: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          label_plural: string | null
          module_key: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_key: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          label_plural?: string | null
          module_key?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_key?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          label_plural?: string | null
          module_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_entities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          default_value: Json | null
          display_order: number
          entity_id: string
          field_key: string
          field_type: string
          help_text: string | null
          id: string
          is_active: boolean
          is_required: boolean
          is_unique: boolean
          label: string
          options: Json | null
          reference_entity: string | null
          updated_at: string
          validation: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          default_value?: Json | null
          display_order?: number
          entity_id: string
          field_key: string
          field_type: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_unique?: boolean
          label: string
          options?: Json | null
          reference_entity?: string | null
          updated_at?: string
          validation?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          default_value?: Json | null
          display_order?: number
          entity_id?: string
          field_key?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_unique?: boolean
          label?: string
          options?: Json | null
          reference_entity?: string | null
          updated_at?: string
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_fields_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "custom_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_records: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          data: Json
          entity_id: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          entity_id: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          entity_id?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_records_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "custom_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_relationships: {
        Row: {
          cascade_delete: boolean
          company_id: string
          created_at: string
          from_entity_id: string
          from_field: string
          id: string
          relationship_type: string
          to_entity_id: string
          to_field: string
          updated_at: string
        }
        Insert: {
          cascade_delete?: boolean
          company_id: string
          created_at?: string
          from_entity_id: string
          from_field: string
          id?: string
          relationship_type?: string
          to_entity_id: string
          to_field: string
          updated_at?: string
        }
        Update: {
          cascade_delete?: boolean
          company_id?: string
          created_at?: string
          from_entity_id?: string
          from_field?: string
          id?: string
          relationship_type?: string
          to_entity_id?: string
          to_field?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "custom_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "custom_entities"
            referencedColumns: ["id"]
          },
        ]
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      daily_executive_reports: {
        Row: {
          company_id: string | null
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          report_data: Json
          report_date: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_date?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_date?: string
        }
        Relationships: []
      }
      dashboard_definitions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean
          layout: Json
          name: string
          role_scope: string[] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          layout?: Json
          name: string
          role_scope?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          layout?: Json
          name?: string
          role_scope?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          dashboard_id: string
          data_source: string
          id: string
          position: Json
          title: string
          updated_at: string
          widget_type: string
        }
        Insert: {
          company_id: string
          config?: Json
          created_at?: string
          dashboard_id: string
          data_source: string
          id?: string
          position?: Json
          title: string
          updated_at?: string
          widget_type: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          dashboard_id?: string
          data_source?: string
          id?: string
          position?: Json
          title?: string
          updated_at?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboard_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_orders_archive: {
        Row: {
          company_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          order_data: Json
          original_order_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          order_data: Json
          original_order_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          order_data?: Json
          original_order_id?: string
        }
        Relationships: []
      }
      delivery_proof: {
        Row: {
          company_id: string | null
          created_at: string
          customer_name: string | null
          delivered_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          order_number: string | null
          photo_url: string | null
          received_by: string | null
          refusal_reason: string | null
          route_id: string | null
          shipment_id: string | null
          signature_url: string | null
          status: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_number?: string | null
          photo_url?: string | null
          received_by?: string | null
          refusal_reason?: string | null
          route_id?: string | null
          shipment_id?: string | null
          signature_url?: string | null
          status?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_number?: string | null
          photo_url?: string | null
          received_by?: string | null
          refusal_reason?: string | null
          route_id?: string | null
          shipment_id?: string | null
          signature_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proof_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_routes: {
        Row: {
          arrival_time: string | null
          carrier_id: string | null
          company_id: string
          completed_stops: number | null
          created_at: string
          departure_time: string | null
          driver_name: string | null
          id: string
          notes: string | null
          planned_date: string
          route_number: string
          status: string
          total_stops: number | null
          total_volume: number | null
          total_weight: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          arrival_time?: string | null
          carrier_id?: string | null
          company_id?: string
          completed_stops?: number | null
          created_at?: string
          departure_time?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          planned_date: string
          route_number: string
          status?: string
          total_stops?: number | null
          total_volume?: number | null
          total_weight?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          arrival_time?: string | null
          carrier_id?: string | null
          company_id?: string
          completed_stops?: number | null
          created_at?: string
          departure_time?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          planned_date?: string
          route_number?: string
          status?: string
          total_stops?: number | null
          total_volume?: number | null
          total_weight?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      distribution_centers: {
        Row: {
          address: string | null
          city: string | null
          code: string
          company_id: string
          created_at: string
          id: string
          manager: string | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          status: string
          total_capacity_m3: number | null
          updated_at: string
          used_capacity_m3: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_id?: string
          created_at?: string
          id?: string
          manager?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          total_capacity_m3?: number | null
          updated_at?: string
          used_capacity_m3?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          manager?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          total_capacity_m3?: number | null
          updated_at?: string
          used_capacity_m3?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      enterprise_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_segments: {
        Row: {
          active_modules: string[] | null
          created_at: string | null
          description: string | null
          id: string
          kpi_templates: Json | null
          name: string
          ui_theme_overrides: Json | null
        }
        Insert: {
          active_modules?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          kpi_templates?: Json | null
          name: string
          ui_theme_overrides?: Json | null
        }
        Update: {
          active_modules?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          kpi_templates?: Json | null
          name?: string
          ui_theme_overrides?: Json | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feed_formulas: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          ingredients: Json | null
          is_active: boolean | null
          name: string
          nutritional_values: Json | null
          target_species: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          ingredients?: Json | null
          is_active?: boolean | null
          name: string
          nutritional_values?: Json | null
          target_species?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          ingredients?: Json | null
          is_active?: boolean | null
          name?: string
          nutritional_values?: Json | null
          target_species?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_formulas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_advance_transactions: {
        Row: {
          advance_id: string
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          ledger_id: string | null
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          advance_id: string
          amount: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          advance_id?: string
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_advance_transactions_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "financial_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_advance_transactions_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_advances: {
        Row: {
          amount: number
          bank_account_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          party_name: string
          party_type: string
          payment_method: string | null
          received_date: string
          remaining_amount: number | null
          status: string
          supplier_id: string | null
          updated_at: string
          used_amount: number
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          party_name: string
          party_type: string
          payment_method?: string | null
          received_date?: string
          remaining_amount?: number | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          used_amount?: number
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          party_name?: string
          party_type?: string
          payment_method?: string | null
          received_date?: string
          remaining_amount?: number | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          used_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_advances_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_advances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_advances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_alerts: {
        Row: {
          alert_type: string
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      financial_audit_logs: {
        Row: {
          affected_amount: number | null
          affected_count: number | null
          audit_run_id: string
          auto_fixed: boolean | null
          category: string
          check_name: string
          company_id: string
          created_at: string
          description: string
          details: Json | null
          id: string
          level: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          affected_amount?: number | null
          affected_count?: number | null
          audit_run_id: string
          auto_fixed?: boolean | null
          category: string
          check_name: string
          company_id?: string
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          level: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          affected_amount?: number | null
          affected_count?: number | null
          audit_run_id?: string
          auto_fixed?: boolean | null
          category?: string
          check_name?: string
          company_id?: string
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          level?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      financial_boletos: {
        Row: {
          amount: number
          bank_account_id: string | null
          barcode: string | null
          client_id: string | null
          client_name: string | null
          company_id: string
          created_at: string
          created_by: string | null
          digitable_line: string | null
          document_number: string | null
          due_date: string
          external_id: string | null
          id: string
          notes: string | null
          our_number: string | null
          paid_amount: number | null
          paid_at: string | null
          pdf_url: string | null
          provider: string
          receivable_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          barcode?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          digitable_line?: string | null
          document_number?: string | null
          due_date: string
          external_id?: string | null
          id?: string
          notes?: string | null
          our_number?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          pdf_url?: string | null
          provider?: string
          receivable_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          barcode?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          digitable_line?: string | null
          document_number?: string | null
          due_date?: string
          external_id?: string | null
          id?: string
          notes?: string | null
          our_number?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          pdf_url?: string | null
          provider?: string
          receivable_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_boletos_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_boletos_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_boletos_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          active: boolean
          chart_account_id: string | null
          code: string
          color: string | null
          company_id: string
          created_at: string
          dre_section: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          chart_account_id?: string | null
          code: string
          color?: string | null
          company_id: string
          created_at?: string
          dre_section?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          chart_account_id?: string | null
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string
          dre_section?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_category_suggestions: {
        Row: {
          category_id: string | null
          category_name: string | null
          company_id: string | null
          confidence: number
          created_at: string
          id: string
          last_used_at: string
          party_kind: string
          party_name: string
          usage_count: number
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          company_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          last_used_at?: string
          party_kind: string
          party_name: string
          usage_count?: number
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          company_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          last_used_at?: string
          party_kind?: string
          party_name?: string
          usage_count?: number
        }
        Relationships: []
      }
      financial_charges_log: {
        Row: {
          amount: number
          channel: string
          client_id: string | null
          client_name: string | null
          company_id: string | null
          created_at: string
          days_until_due: number | null
          due_date: string | null
          error: string | null
          id: string
          message: string
          metadata: Json | null
          receivable_id: string | null
          rule_id: string | null
          sent_at: string | null
          severity: string
          status: string
          trigger_type: string
        }
        Insert: {
          amount?: number
          channel: string
          client_id?: string | null
          client_name?: string | null
          company_id?: string | null
          created_at?: string
          days_until_due?: number | null
          due_date?: string | null
          error?: string | null
          id?: string
          message: string
          metadata?: Json | null
          receivable_id?: string | null
          rule_id?: string | null
          sent_at?: string | null
          severity?: string
          status?: string
          trigger_type: string
        }
        Update: {
          amount?: number
          channel?: string
          client_id?: string | null
          client_name?: string | null
          company_id?: string | null
          created_at?: string
          days_until_due?: number | null
          due_date?: string | null
          error?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          receivable_id?: string | null
          rule_id?: string | null
          sent_at?: string | null
          severity?: string
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_charges_log_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_charges_log_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "financial_charges_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "financial_charges_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_charges_rules: {
        Row: {
          active: boolean
          channel: string
          company_id: string | null
          created_at: string
          days_offset: number
          id: string
          message_template: string
          name: string
          severity: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel?: string
          company_id?: string | null
          created_at?: string
          days_offset?: number
          id?: string
          message_template?: string
          name: string
          severity?: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel?: string
          company_id?: string | null
          created_at?: string
          days_offset?: number
          id?: string
          message_template?: string
          name?: string
          severity?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_checks: {
        Row: {
          account: string | null
          agency: string | null
          amount: number
          bank_account_id: string | null
          bank_code: string | null
          bank_name: string | null
          check_number: string
          check_type: string
          clear_date: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deposit_date: string | null
          due_date: string | null
          id: string
          issue_date: string
          issuer_document: string | null
          issuer_name: string | null
          ledger_id: string | null
          notes: string | null
          payable_id: string | null
          receivable_id: string | null
          settlement_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account?: string | null
          agency?: string | null
          amount: number
          bank_account_id?: string | null
          bank_code?: string | null
          bank_name?: string | null
          check_number: string
          check_type: string
          clear_date?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deposit_date?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          issuer_document?: string | null
          issuer_name?: string | null
          ledger_id?: string | null
          notes?: string | null
          payable_id?: string | null
          receivable_id?: string | null
          settlement_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account?: string | null
          agency?: string | null
          amount?: number
          bank_account_id?: string | null
          bank_code?: string | null
          bank_name?: string | null
          check_number?: string
          check_type?: string
          clear_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deposit_date?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          issuer_document?: string | null
          issuer_name?: string | null
          ledger_id?: string | null
          notes?: string | null
          payable_id?: string | null
          receivable_id?: string | null
          settlement_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_checks_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_checks_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_checks_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "supplier_current_account"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "financial_checks_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_checks_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
        ]
      }
      financial_default_score: {
        Row: {
          avg_delay_days: number
          client_id: string
          client_name: string | null
          company_id: string | null
          computed_at: string
          id: string
          last_payment_date: string | null
          max_delay_days: number
          overdue_amount: number
          overdue_count: number
          risk_level: string
          score_numeric: number
          total_billed: number
          total_paid_on_time: number
          updated_at: string
        }
        Insert: {
          avg_delay_days?: number
          client_id: string
          client_name?: string | null
          company_id?: string | null
          computed_at?: string
          id?: string
          last_payment_date?: string | null
          max_delay_days?: number
          overdue_amount?: number
          overdue_count?: number
          risk_level?: string
          score_numeric?: number
          total_billed?: number
          total_paid_on_time?: number
          updated_at?: string
        }
        Update: {
          avg_delay_days?: number
          client_id?: string
          client_name?: string | null
          company_id?: string | null
          computed_at?: string
          id?: string
          last_payment_date?: string | null
          max_delay_days?: number
          overdue_amount?: number
          overdue_count?: number
          risk_level?: string
          score_numeric?: number
          total_billed?: number
          total_paid_on_time?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_fraud_rules: {
        Row: {
          action: string
          company_id: string | null
          config: Json | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          rule_key: string
          severity: string
          threshold: number | null
          updated_at: string
          window_minutes: number | null
        }
        Insert: {
          action?: string
          company_id?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          rule_key: string
          severity?: string
          threshold?: number | null
          updated_at?: string
          window_minutes?: number | null
        }
        Update: {
          action?: string
          company_id?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          rule_key?: string
          severity?: string
          threshold?: number | null
          updated_at?: string
          window_minutes?: number | null
        }
        Relationships: []
      }
      financial_health_scores: {
        Row: {
          cash_runway_days: number | null
          cashflow_score: number | null
          company_id: string
          created_at: string
          current_ratio: number | null
          delinquency_rate: number | null
          delinquency_score: number | null
          details: Json | null
          growth_score: number | null
          id: string
          liquidity_score: number | null
          recommendations: Json | null
          reference_date: string
          score_grade: string
          score_total: number
        }
        Insert: {
          cash_runway_days?: number | null
          cashflow_score?: number | null
          company_id?: string
          created_at?: string
          current_ratio?: number | null
          delinquency_rate?: number | null
          delinquency_score?: number | null
          details?: Json | null
          growth_score?: number | null
          id?: string
          liquidity_score?: number | null
          recommendations?: Json | null
          reference_date?: string
          score_grade: string
          score_total: number
        }
        Update: {
          cash_runway_days?: number | null
          cashflow_score?: number | null
          company_id?: string
          created_at?: string
          current_ratio?: number | null
          delinquency_rate?: number | null
          delinquency_score?: number | null
          details?: Json | null
          growth_score?: number | null
          id?: string
          liquidity_score?: number | null
          recommendations?: Json | null
          reference_date?: string
          score_grade?: string
          score_total?: number
        }
        Relationships: []
      }
      financial_ledger: {
        Row: {
          amount: number
          bank_account_id: string | null
          bank_transaction_id: string | null
          branch_id: string | null
          category_id: string | null
          chart_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          notes: string | null
          payment_method: string | null
          reconciled: boolean
          reference: string | null
          source: string
          source_id: string | null
          type: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          bank_transaction_id?: string | null
          branch_id?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reconciled?: boolean
          reference?: string | null
          source: string
          source_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          bank_transaction_id?: string | null
          branch_id?: string | null
          category_id?: string | null
          chart_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reconciled?: boolean
          reference?: string | null
          source?: string
          source_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_offsets: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          offset_date: string
          payable_id: string
          payable_settlement_id: string | null
          receivable_id: string
          receivable_settlement_id: string | null
        }
        Insert: {
          amount: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          offset_date?: string
          payable_id: string
          payable_settlement_id?: string | null
          receivable_id: string
          receivable_settlement_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          offset_date?: string
          payable_id?: string
          payable_settlement_id?: string | null
          receivable_id?: string
          receivable_settlement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_offsets_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_offsets_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "supplier_current_account"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "financial_offsets_payable_settlement_id_fkey"
            columns: ["payable_settlement_id"]
            isOneToOne: false
            referencedRelation: "financial_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_offsets_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_offsets_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "financial_offsets_receivable_settlement_id_fkey"
            columns: ["receivable_settlement_id"]
            isOneToOne: false
            referencedRelation: "financial_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_operations_log: {
        Row: {
          amount: number | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          operation_type: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          operation_type: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          operation_type?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_payment_split: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          reference: string | null
          settlement_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: string
          reference?: string | null
          settlement_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          reference?: string | null
          settlement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_payment_split_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payment_split_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "financial_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_predictive_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          company_id: string | null
          created_at: string
          description: string | null
          details: Json | null
          id: string
          predicted_amount: number | null
          predicted_date: string | null
          recommended_action: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          predicted_amount?: number | null
          predicted_date?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          predicted_amount?: number | null
          predicted_date?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      financial_recurring: {
        Row: {
          adjustment_index: string | null
          adjustment_percent: number | null
          amount: number
          bank_account_id: string | null
          category_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          day_of_month: number | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          kind: string
          last_adjustment_at: string | null
          max_occurrences: number | null
          next_run_date: string
          notes: string | null
          occurrences_generated: number
          party_name: string
          start_date: string
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          adjustment_index?: string | null
          adjustment_percent?: number | null
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          day_of_month?: number | null
          description: string
          end_date?: string | null
          frequency?: string
          id?: string
          kind: string
          last_adjustment_at?: string | null
          max_occurrences?: number | null
          next_run_date?: string
          notes?: string | null
          occurrences_generated?: number
          party_name: string
          start_date?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          adjustment_index?: string | null
          adjustment_percent?: number | null
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          day_of_month?: number | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          kind?: string
          last_adjustment_at?: string | null
          max_occurrences?: number | null
          next_run_date?: string
          notes?: string | null
          occurrences_generated?: number
          party_name?: string
          start_date?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_risk_profiles: {
        Row: {
          anomalies_count: number
          avg_ticket: number
          behavior_signature: Json | null
          blocked_count: number
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          last_anomaly_at: string | null
          last_transaction_at: string | null
          max_ticket: number
          notes: string | null
          risk_level: string
          risk_score: number
          total_transactions: number
          total_volume: number
          updated_at: string
        }
        Insert: {
          anomalies_count?: number
          avg_ticket?: number
          behavior_signature?: Json | null
          blocked_count?: number
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          last_anomaly_at?: string | null
          last_transaction_at?: string | null
          max_ticket?: number
          notes?: string | null
          risk_level?: string
          risk_score?: number
          total_transactions?: number
          total_volume?: number
          updated_at?: string
        }
        Update: {
          anomalies_count?: number
          avg_ticket?: number
          behavior_signature?: Json | null
          blocked_count?: number
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          last_anomaly_at?: string | null
          last_transaction_at?: string | null
          max_ticket?: number
          notes?: string | null
          risk_level?: string
          risk_score?: number
          total_transactions?: number
          total_volume?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_security_logs: {
        Row: {
          amount: number | null
          category: string
          company_id: string | null
          created_at: string
          decision: string | null
          description: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          reference_id: string | null
          reference_table: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          severity: string
          source_ip: string | null
          title: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          category?: string
          company_id?: string | null
          created_at?: string
          decision?: string | null
          description?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          severity?: string
          source_ip?: string | null
          title: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          category?: string
          company_id?: string | null
          created_at?: string
          decision?: string | null
          description?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          severity?: string
          source_ip?: string | null
          title?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_settlements: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          discount: number | null
          id: string
          interest: number | null
          ledger_id: string | null
          notes: string | null
          payment_method: string | null
          payment_record_id: string | null
          penalty: number | null
          reversed_at: string | null
          reversed_by: string | null
          settlement_date: string
          source_id: string
          source_type: string
          status: string
          total_settled: number
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          id?: string
          interest?: number | null
          ledger_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_record_id?: string | null
          penalty?: number | null
          reversed_at?: string | null
          reversed_by?: string | null
          settlement_date?: string
          source_id: string
          source_type: string
          status?: string
          total_settled: number
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          id?: string
          interest?: number | null
          ledger_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_record_id?: string | null
          penalty?: number | null
          reversed_at?: string | null
          reversed_by?: string | null
          settlement_date?: string
          source_id?: string
          source_type?: string
          status?: string
          total_settled?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_settlements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_settlements_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_settlements_payment_record_id_fkey"
            columns: ["payment_record_id"]
            isOneToOne: false
            referencedRelation: "payment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_cfop_reference: {
        Row: {
          code: string
          description: string
          is_interstate: boolean
          operation_type: string
        }
        Insert: {
          code: string
          description: string
          is_interstate?: boolean
          operation_type: string
        }
        Update: {
          code?: string
          description?: string
          is_interstate?: boolean
          operation_type?: string
        }
        Relationships: []
      }
      fiscal_documents: {
        Row: {
          access_key: string | null
          branch_id: string | null
          company_id: string
          created_at: string | null
          id: string
          number: number
          series: number
          status: string | null
          tax_amount: number | null
          total_amount: number | null
          type: string
          xml_content: string | null
        }
        Insert: {
          access_key?: string | null
          branch_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          number: number
          series: number
          status?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          type: string
          xml_content?: string | null
        }
        Update: {
          access_key?: string | null
          branch_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          number?: number
          series?: number
          status?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          type?: string
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reports: {
        Row: {
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      fiscal_rules: {
        Row: {
          cfop: string | null
          cofins_rate: number | null
          company_id: string
          created_at: string | null
          destination_state: string | null
          icms_rate: number | null
          icms_st_rate: number | null
          id: string
          ipi_rate: number | null
          metadata: Json | null
          name: string
          ncm: string | null
          origin_state: string | null
          pis_rate: number | null
          updated_at: string | null
        }
        Insert: {
          cfop?: string | null
          cofins_rate?: number | null
          company_id: string
          created_at?: string | null
          destination_state?: string | null
          icms_rate?: number | null
          icms_st_rate?: number | null
          id?: string
          ipi_rate?: number | null
          metadata?: Json | null
          name: string
          ncm?: string | null
          origin_state?: string | null
          pis_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          cfop?: string | null
          cofins_rate?: number | null
          company_id?: string
          created_at?: string | null
          destination_state?: string | null
          icms_rate?: number | null
          icms_st_rate?: number | null
          id?: string
          ipi_rate?: number | null
          metadata?: Json | null
          name?: string
          ncm?: string | null
          origin_state?: string | null
          pis_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fiscal_tax_rules: {
        Row: {
          cbs_rate: number | null
          cfop: string
          cofins_rate: number | null
          company_id: string
          created_at: string | null
          cst: string | null
          destination_state: string
          ibs_rate: number | null
          icms_rate: number | null
          icms_st_rate: number | null
          id: string
          ipi_rate: number | null
          is_hybrid_regime: boolean | null
          name: string
          ncm: string | null
          origin_state: string
          pis_rate: number | null
          regime_tributario_destino: string | null
          updated_at: string | null
        }
        Insert: {
          cbs_rate?: number | null
          cfop: string
          cofins_rate?: number | null
          company_id: string
          created_at?: string | null
          cst?: string | null
          destination_state: string
          ibs_rate?: number | null
          icms_rate?: number | null
          icms_st_rate?: number | null
          id?: string
          ipi_rate?: number | null
          is_hybrid_regime?: boolean | null
          name: string
          ncm?: string | null
          origin_state: string
          pis_rate?: number | null
          regime_tributario_destino?: string | null
          updated_at?: string | null
        }
        Update: {
          cbs_rate?: number | null
          cfop?: string
          cofins_rate?: number | null
          company_id?: string
          created_at?: string | null
          cst?: string | null
          destination_state?: string
          ibs_rate?: number | null
          icms_rate?: number | null
          icms_st_rate?: number | null
          id?: string
          ipi_rate?: number | null
          is_hybrid_regime?: boolean | null
          name?: string
          ncm?: string | null
          origin_state?: string
          pis_rate?: number | null
          regime_tributario_destino?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_tax_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          action_type: string
          ai_generated: boolean | null
          channel: string | null
          client_id: string | null
          client_name: string
          company_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          funnel_id: string | null
          id: string
          next_follow_up_id: string | null
          order_id: string | null
          priority: string
          result: string | null
          sales_rep_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          suggested_message: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          ai_generated?: boolean | null
          channel?: string | null
          client_id?: string | null
          client_name: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          funnel_id?: string | null
          id?: string
          next_follow_up_id?: string | null
          order_id?: string | null
          priority?: string
          result?: string | null
          sales_rep_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          suggested_message?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          ai_generated?: boolean | null
          channel?: string | null
          client_id?: string | null
          client_name?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          funnel_id?: string | null
          id?: string
          next_follow_up_id?: string | null
          order_id?: string | null
          priority?: string
          result?: string | null
          sales_rep_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          suggested_message?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          client_id: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      gamification_badge_awards: {
        Row: {
          awarded_at: string
          badge_id: string
          company_id: string | null
          id: string
          sales_rep_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          company_id?: string | null
          id?: string
          sales_rep_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          company_id?: string | null
          id?: string
          sales_rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_badge_awards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "gamification_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_badges: {
        Row: {
          active: boolean | null
          category: string
          company_id: string | null
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string
          id: string
          name: string
          points_required: number | null
        }
        Insert: {
          active?: boolean | null
          category?: string
          company_id?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string
          id?: string
          name: string
          points_required?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string
          company_id?: string | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_required?: number | null
        }
        Relationships: []
      }
      gamification_challenge_participants: {
        Row: {
          challenge_id: string
          company_id: string | null
          id: string
          joined_at: string
          rank: number | null
          sales_rep_id: string
          score: number
        }
        Insert: {
          challenge_id: string
          company_id?: string | null
          id?: string
          joined_at?: string
          rank?: number | null
          sales_rep_id: string
          score?: number
        }
        Update: {
          challenge_id?: string
          company_id?: string | null
          id?: string
          joined_at?: string
          rank?: number | null
          sales_rep_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "gamification_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "gamification_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_challenges: {
        Row: {
          bonus_points: number | null
          challenge_type: string
          company_id: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          prize_description: string | null
          start_date: string
          status: string
          title: string
        }
        Insert: {
          bonus_points?: number | null
          challenge_type?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          prize_description?: string | null
          start_date: string
          status?: string
          title: string
        }
        Update: {
          bonus_points?: number | null
          challenge_type?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          prize_description?: string | null
          start_date?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      gamification_mission_progress: {
        Row: {
          company_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string
          current_count: number
          id: string
          mission_date: string
          mission_id: string
          sales_rep_id: string
        }
        Insert: {
          company_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          mission_date?: string
          mission_id: string
          sales_rep_id: string
        }
        Update: {
          company_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          mission_date?: string
          mission_id?: string
          sales_rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "gamification_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_missions: {
        Row: {
          action_type: string
          active: boolean | null
          company_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          mission_type: string
          reward_points: number
          target_count: number
          title: string
        }
        Insert: {
          action_type: string
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          mission_type?: string
          reward_points?: number
          target_count?: number
          title: string
        }
        Update: {
          action_type?: string
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          mission_type?: string
          reward_points?: number
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      gamification_points: {
        Row: {
          action_type: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          sales_rep_id: string
        }
        Insert: {
          action_type: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          sales_rep_id: string
        }
        Update: {
          action_type?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          sales_rep_id?: string
        }
        Relationships: []
      }
      holding_entities: {
        Row: {
          created_at: string | null
          equity_percentage: number | null
          holding_company_id: string
          id: string
          relation_type: string | null
          subsidiary_id: string
        }
        Insert: {
          created_at?: string | null
          equity_percentage?: number | null
          holding_company_id: string
          id?: string
          relation_type?: string | null
          subsidiary_id: string
        }
        Update: {
          created_at?: string | null
          equity_percentage?: number | null
          holding_company_id?: string
          id?: string
          relation_type?: string | null
          subsidiary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_entities_holding_company_id_fkey"
            columns: ["holding_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_entities_subsidiary_id_fkey"
            columns: ["subsidiary_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      industrial_alerts: {
        Row: {
          alert_type: string
          company_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          metric_value: number | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          alert_type: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metric_value?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          alert_type?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metric_value?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title?: string
        }
        Relationships: []
      }
      inventory_sessions: {
        Row: {
          abc_class: string | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          blind_count: boolean | null
          company_id: string | null
          completed_at: string | null
          counted_locations: number | null
          created_at: string
          divergent_locations: number | null
          id: string
          max_recount: number | null
          notes: string | null
          planned_date: string | null
          session_number: string
          session_type: string
          started_at: string | null
          status: string
          total_locations: number | null
          updated_at: string
          warehouse_id: string | null
          zone_id: string | null
        }
        Insert: {
          abc_class?: string | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          blind_count?: boolean | null
          company_id?: string | null
          completed_at?: string | null
          counted_locations?: number | null
          created_at?: string
          divergent_locations?: number | null
          id?: string
          max_recount?: number | null
          notes?: string | null
          planned_date?: string | null
          session_number: string
          session_type?: string
          started_at?: string | null
          status?: string
          total_locations?: number | null
          updated_at?: string
          warehouse_id?: string | null
          zone_id?: string | null
        }
        Update: {
          abc_class?: string | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          blind_count?: boolean | null
          company_id?: string | null
          completed_at?: string | null
          counted_locations?: number | null
          created_at?: string
          divergent_locations?: number | null
          id?: string
          max_recount?: number | null
          notes?: string | null
          planned_date?: string | null
          session_number?: string
          session_type?: string
          started_at?: string | null
          status?: string
          total_locations?: number | null
          updated_at?: string
          warehouse_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sessions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_sessions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_telemetry: {
        Row: {
          company_id: string
          created_at: string
          device_id: string
          device_type: string
          id: string
          machine_id: string | null
          metadata: Json | null
          metric_name: string
          metric_value: number
          unit: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          device_id: string
          device_type?: string
          id?: string
          machine_id?: string | null
          metadata?: Json | null
          metric_name: string
          metric_value: number
          unit?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          device_id?: string
          device_type?: string
          id?: string
          machine_id?: string | null
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_telemetry_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "production_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      kanban_limits: {
        Row: {
          column_name: string
          company_id: string | null
          created_at: string
          id: string
          updated_at: string
          wip_limit: number
        }
        Insert: {
          column_name: string
          company_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          wip_limit?: number
        }
        Update: {
          column_name?: string
          company_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          wip_limit?: number
        }
        Relationships: []
      }
      lead_nurturing_enrollments: {
        Row: {
          client_id: string
          company_id: string | null
          completed_at: string | null
          converted: boolean | null
          created_at: string
          current_step: number | null
          enrolled_at: string
          id: string
          last_action_at: string | null
          sequence_id: string
          status: string
        }
        Insert: {
          client_id: string
          company_id?: string | null
          completed_at?: string | null
          converted?: boolean | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          last_action_at?: string | null
          sequence_id: string
          status?: string
        }
        Update: {
          client_id?: string
          company_id?: string | null
          completed_at?: string | null
          converted?: boolean | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          last_action_at?: string | null
          sequence_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_nurturing_enrollments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_nurturing_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "lead_nurturing_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_nurturing_sequences: {
        Row: {
          company_id: string | null
          conversion_rate: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          target_segment: string | null
          total_enrolled: number | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json
          target_segment?: string | null
          total_enrolled?: number | null
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          target_segment?: string | null
          total_enrolled?: number | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      loading_docks: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          carrier: string | null
          company_id: string
          created_at: string
          current_shipment_id: string | null
          dock_code: string
          dock_name: string | null
          dock_type: string
          driver_document: string | null
          driver_name: string | null
          id: string
          notes: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          updated_at: string
          vehicle_plate: string | null
          warehouse_id: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          carrier?: string | null
          company_id?: string
          created_at?: string
          current_shipment_id?: string | null
          dock_code: string
          dock_name?: string | null
          dock_type?: string
          driver_document?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          updated_at?: string
          vehicle_plate?: string | null
          warehouse_id?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          carrier?: string | null
          company_id?: string
          created_at?: string
          current_shipment_id?: string | null
          dock_code?: string
          dock_name?: string | null
          dock_type?: string
          driver_document?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          updated_at?: string
          vehicle_plate?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loading_docks_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_migration_audit: {
        Row: {
          company_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          lot_id: string | null
          product_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          lot_id?: string | null
          product_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          lot_id?: string | null
          product_id?: string | null
        }
        Relationships: []
      }
      material_consumptions: {
        Row: {
          batch: string | null
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      material_requirements: {
        Row: {
          available_quantity: number
          company_id: string
          component_code: string
          component_id: string | null
          component_name: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          order_number: string | null
          product_id: string | null
          production_order_id: string | null
          purchase_order_id: string | null
          required_quantity: number
          status: string
          to_purchase_quantity: number
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          company_id?: string
          component_code: string
          component_id?: string | null
          component_name: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          product_id?: string | null
          production_order_id?: string | null
          purchase_order_id?: string | null
          required_quantity?: number
          status?: string
          to_purchase_quantity?: number
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          company_id?: string
          component_code?: string
          component_id?: string | null
          component_name?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          product_id?: string | null
          production_order_id?: string | null
          purchase_order_id?: string | null
          required_quantity?: number
          status?: string
          to_purchase_quantity?: number
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_requirements_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requirements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requirements_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mdfe: {
        Row: {
          access_key: string | null
          authorization_date: string | null
          cancellation_date: string | null
          carrier_id: string | null
          closure_date: string | null
          company_id: string
          created_at: string
          driver_cpf: string | null
          driver_name: string | null
          id: string
          issue_date: string
          loading_city: string | null
          modal: string
          notes: string | null
          number: string
          protocol: string | null
          series: string
          status: string
          total_cargo_value: number
          total_documents: number
          total_weight: number
          uf_destination: string
          uf_origin: string
          unloading_cities: string[] | null
          updated_at: string
          vehicle_plate: string | null
          vehicle_renavam: string | null
          vehicle_uf: string | null
          xml_content: string | null
        }
        Insert: {
          access_key?: string | null
          authorization_date?: string | null
          cancellation_date?: string | null
          carrier_id?: string | null
          closure_date?: string | null
          company_id?: string
          created_at?: string
          driver_cpf?: string | null
          driver_name?: string | null
          id?: string
          issue_date?: string
          loading_city?: string | null
          modal?: string
          notes?: string | null
          number: string
          protocol?: string | null
          series?: string
          status?: string
          total_cargo_value?: number
          total_documents?: number
          total_weight?: number
          uf_destination: string
          uf_origin: string
          unloading_cities?: string[] | null
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_renavam?: string | null
          vehicle_uf?: string | null
          xml_content?: string | null
        }
        Update: {
          access_key?: string | null
          authorization_date?: string | null
          cancellation_date?: string | null
          carrier_id?: string | null
          closure_date?: string | null
          company_id?: string
          created_at?: string
          driver_cpf?: string | null
          driver_name?: string | null
          id?: string
          issue_date?: string
          loading_city?: string | null
          modal?: string
          notes?: string | null
          number?: string
          protocol?: string | null
          series?: string
          status?: string
          total_cargo_value?: number
          total_documents?: number
          total_weight?: number
          uf_destination?: string
          uf_origin?: string
          unloading_cities?: string[] | null
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_renavam?: string | null
          vehicle_uf?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdfe_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      mdfe_documents: {
        Row: {
          access_key: string | null
          company_id: string
          created_at: string
          document_id: string | null
          document_number: string
          document_type: string
          document_value: number
          document_weight: number
          id: string
          mdfe_id: string
          unloading_city: string | null
        }
        Insert: {
          access_key?: string | null
          company_id?: string
          created_at?: string
          document_id?: string | null
          document_number: string
          document_type: string
          document_value?: number
          document_weight?: number
          id?: string
          mdfe_id: string
          unloading_city?: string | null
        }
        Update: {
          access_key?: string | null
          company_id?: string
          created_at?: string
          document_id?: string | null
          document_number?: string
          document_type?: string
          document_value?: number
          document_weight?: number
          id?: string
          mdfe_id?: string
          unloading_city?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdfe_documents_mdfe_id_fkey"
            columns: ["mdfe_id"]
            isOneToOne: false
            referencedRelation: "mdfe"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce: {
        Row: {
          access_key: string | null
          amount_paid: number
          authorization_date: string | null
          branch_id: string | null
          cancellation_date: string | null
          change_amount: number
          company_id: string
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
          branch_id?: string | null
          cancellation_date?: string | null
          change_amount?: number
          company_id?: string
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
          branch_id?: string | null
          cancellation_date?: string | null
          change_amount?: number
          company_id?: string
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
        Relationships: [
          {
            foreignKeyName: "nfce_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce_items: {
        Row: {
          cfop: string | null
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          branch_id: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          client_document: string | null
          client_id: string | null
          client_name: string
          cofins: number
          company_id: string
          consumer_final: boolean
          created_at: string
          difal_total: number
          discount: number
          fcp_total: number
          icms: number
          icms_st_total: number
          id: string
          ipi: number
          issue_date: string
          number: string
          operation_type: string
          order_id: string | null
          pis: number
          protocol: string | null
          purchase_order_id: string | null
          series: string
          shipping: number
          status: string
          subtotal: number
          tax_regime_type: string | null
          total: number
          total_cbs: number | null
          total_cofins: number | null
          total_ibs: number | null
          total_icms_st: number | null
          total_ipi: number | null
          total_pis: number | null
          uf_destination: string | null
          uf_origin: string | null
          updated_at: string
        }
        Insert: {
          access_key?: string | null
          authorization_date?: string | null
          branch_id?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          client_document?: string | null
          client_id?: string | null
          client_name: string
          cofins?: number
          company_id?: string
          consumer_final?: boolean
          created_at?: string
          difal_total?: number
          discount?: number
          fcp_total?: number
          icms?: number
          icms_st_total?: number
          id?: string
          ipi?: number
          issue_date?: string
          number: string
          operation_type?: string
          order_id?: string | null
          pis?: number
          protocol?: string | null
          purchase_order_id?: string | null
          series?: string
          shipping?: number
          status?: string
          subtotal?: number
          tax_regime_type?: string | null
          total?: number
          total_cbs?: number | null
          total_cofins?: number | null
          total_ibs?: number | null
          total_icms_st?: number | null
          total_ipi?: number | null
          total_pis?: number | null
          uf_destination?: string | null
          uf_origin?: string | null
          updated_at?: string
        }
        Update: {
          access_key?: string | null
          authorization_date?: string | null
          branch_id?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          client_document?: string | null
          client_id?: string | null
          client_name?: string
          cofins?: number
          company_id?: string
          consumer_final?: boolean
          created_at?: string
          difal_total?: number
          discount?: number
          fcp_total?: number
          icms?: number
          icms_st_total?: number
          id?: string
          ipi?: number
          issue_date?: string
          number?: string
          operation_type?: string
          order_id?: string | null
          pis?: number
          protocol?: string | null
          purchase_order_id?: string | null
          series?: string
          shipping?: number
          status?: string
          subtotal?: number
          tax_regime_type?: string | null
          total?: number
          total_cbs?: number | null
          total_cofins?: number | null
          total_ibs?: number | null
          total_icms_st?: number | null
          total_ipi?: number | null
          total_pis?: number | null
          uf_destination?: string | null
          uf_origin?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfe_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
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
          cbs_value: number | null
          cest: string | null
          cfop: string | null
          cofins_rate: number
          cofins_value: number
          company_id: string
          difal_base: number
          difal_destination_rate: number
          difal_value: number
          discount: number
          fcp_value: number
          ibs_value: number | null
          icms_base: number
          icms_rate: number
          icms_st_base: number
          icms_st_mva: number
          icms_st_value: number
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
          cbs_value?: number | null
          cest?: string | null
          cfop?: string | null
          cofins_rate?: number
          cofins_value?: number
          company_id?: string
          difal_base?: number
          difal_destination_rate?: number
          difal_value?: number
          discount?: number
          fcp_value?: number
          ibs_value?: number | null
          icms_base?: number
          icms_rate?: number
          icms_st_base?: number
          icms_st_mva?: number
          icms_st_value?: number
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
          cbs_value?: number | null
          cest?: string | null
          cfop?: string | null
          cofins_rate?: number
          cofins_value?: number
          company_id?: string
          difal_base?: number
          difal_destination_rate?: number
          difal_value?: number
          discount?: number
          fcp_value?: number
          ibs_value?: number | null
          icms_base?: number
          icms_rate?: number
          icms_st_base?: number
          icms_st_mva?: number
          icms_st_value?: number
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      open_finance_connections: {
        Row: {
          access_token_encrypted: string | null
          active: boolean
          bank_account_id: string | null
          bank_name: string | null
          company_id: string | null
          consent_id: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          last_sync_status: string | null
          metadata: Json | null
          provider: string
          refresh_token_encrypted: string | null
          sync_frequency_minutes: number | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          active?: boolean
          bank_account_id?: string | null
          bank_name?: string | null
          company_id?: string | null
          consent_id?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          metadata?: Json | null
          provider: string
          refresh_token_encrypted?: string | null
          sync_frequency_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          active?: boolean
          bank_account_id?: string | null
          bank_name?: string | null
          company_id?: string | null
          consent_id?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          metadata?: Json | null
          provider?: string
          refresh_token_encrypted?: string | null
          sync_frequency_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_finance_connections_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_approvals: {
        Row: {
          approval_type: string
          approved_at: string | null
          approved_by: string | null
          block_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
            foreignKeyName: "order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      order_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          company_id: string | null
          from_status: string | null
          id: string
          order_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          company_id?: string | null
          from_status?: string | null
          id?: string
          order_id: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          company_id?: string | null
          from_status?: string | null
          id?: string
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_stage_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          block_reason: string | null
          changed_by: string | null
          changed_by_user_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          branch_id: string | null
          client_id: string | null
          client_name: string
          commercial_approval: string | null
          commission_rate: number | null
          commission_value: number | null
          company_id: string
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
          branch_id?: string | null
          client_id?: string | null
          client_name: string
          commercial_approval?: string | null
          commission_rate?: number | null
          commission_value?: number | null
          company_id: string
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
          branch_id?: string | null
          client_id?: string | null
          client_name?: string
          commercial_approval?: string | null
          commission_rate?: number | null
          commission_value?: number | null
          company_id?: string
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
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      outsourcing_orders: {
        Row: {
          actual_return_date: string | null
          company_id: string
          created_at: string
          expected_return_date: string | null
          id: string
          notes: string | null
          order_number: string
          production_order_id: string
          quantity_rejected: number | null
          quantity_returned: number | null
          quantity_sent: number
          sent_date: string
          service_description: string | null
          status: string
          supplier_id: string | null
          supplier_name: string
          total_cost: number | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          company_id?: string
          created_at?: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          production_order_id: string
          quantity_rejected?: number | null
          quantity_returned?: number | null
          quantity_sent?: number
          sent_date?: string
          service_description?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name: string
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          company_id?: string
          created_at?: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          production_order_id?: string
          quantity_rejected?: number | null
          quantity_returned?: number | null
          quantity_sent?: number
          sent_date?: string
          service_description?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outsourcing_orders_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outsourcing_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "payment_records_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "supplier_current_account"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "payment_records_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          module_key: string | null
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          module_key?: string | null
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          module_key?: string | null
          resource?: string
        }
        Relationships: []
      }
      pharma_lab_tests: {
        Row: {
          analyst_name: string | null
          batch_id: string
          company_id: string
          created_at: string | null
          id: string
          raw_data: Json | null
          result_status: string | null
          test_date: string | null
          test_type: string
        }
        Insert: {
          analyst_name?: string | null
          batch_id: string
          company_id: string
          created_at?: string | null
          id?: string
          raw_data?: Json | null
          result_status?: string | null
          test_date?: string | null
          test_type: string
        }
        Update: {
          analyst_name?: string | null
          batch_id?: string
          company_id?: string
          created_at?: string | null
          id?: string
          raw_data?: Json | null
          result_status?: string | null
          test_date?: string | null
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharma_lab_tests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      picking_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          location_code: string
          location_id: string | null
          lot_id: string | null
          lot_number: string | null
          notes: string | null
          picked_qty: number
          picking_order_id: string | null
          priority: string
          product_code: string
          product_id: string | null
          product_name: string
          requested_qty: number
          route_sequence: number | null
          started_at: string | null
          status: string
          task_number: string
          unit: string
          wave_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          location_code: string
          location_id?: string | null
          lot_id?: string | null
          lot_number?: string | null
          notes?: string | null
          picked_qty?: number
          picking_order_id?: string | null
          priority?: string
          product_code: string
          product_id?: string | null
          product_name: string
          requested_qty?: number
          route_sequence?: number | null
          started_at?: string | null
          status?: string
          task_number: string
          unit?: string
          wave_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          location_code?: string
          location_id?: string | null
          lot_id?: string | null
          lot_number?: string | null
          notes?: string | null
          picked_qty?: number
          picking_order_id?: string | null
          priority?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          requested_qty?: number
          route_sequence?: number | null
          started_at?: string | null
          status?: string
          task_number?: string
          unit?: string
          wave_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "picking_tasks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wms_storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_tasks_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_tasks_picking_order_id_fkey"
            columns: ["picking_order_id"]
            isOneToOne: false
            referencedRelation: "wms_picking_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_tasks_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "picking_waves"
            referencedColumns: ["id"]
          },
        ]
      }
      picking_waves: {
        Row: {
          assigned_to: string | null
          carrier: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          items_count: number | null
          name: string | null
          notes: string | null
          orders_count: number | null
          picked_items: number | null
          priority: string
          route: string | null
          shipping_window_end: string | null
          shipping_window_start: string | null
          started_at: string | null
          status: string
          strategy: string
          updated_at: string
          wave_number: string
        }
        Insert: {
          assigned_to?: string | null
          carrier?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          items_count?: number | null
          name?: string | null
          notes?: string | null
          orders_count?: number | null
          picked_items?: number | null
          priority?: string
          route?: string | null
          shipping_window_end?: string | null
          shipping_window_start?: string | null
          started_at?: string | null
          status?: string
          strategy?: string
          updated_at?: string
          wave_number: string
        }
        Update: {
          assigned_to?: string | null
          carrier?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          items_count?: number | null
          name?: string | null
          notes?: string | null
          orders_count?: number | null
          picked_items?: number | null
          priority?: string
          route?: string | null
          shipping_window_end?: string | null
          shipping_window_start?: string | null
          started_at?: string | null
          status?: string
          strategy?: string
          updated_at?: string
          wave_number?: string
        }
        Relationships: []
      }
      pix_charges: {
        Row: {
          amount: number
          bank_account_id: string | null
          client_document: string | null
          client_id: string | null
          client_name: string | null
          company_id: string
          copy_paste: string | null
          created_at: string
          description: string | null
          end_to_end_id: string | null
          expires_at: string | null
          external_id: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payer_document: string | null
          payer_name: string | null
          qr_code: string | null
          qr_code_image: string | null
          receivable_id: string | null
          status: string
          txid: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          client_document?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          copy_paste?: string | null
          created_at?: string
          description?: string | null
          end_to_end_id?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          qr_code?: string | null
          qr_code_image?: string | null
          receivable_id?: string | null
          status?: string
          txid?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          client_document?: string | null
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          copy_paste?: string | null
          created_at?: string
          description?: string | null
          end_to_end_id?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          qr_code?: string | null
          qr_code_image?: string | null
          receivable_id?: string | null
          status?: string
          txid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_charges_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_charges_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_charges_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
          },
        ]
      }
      pix_webhook_events: {
        Row: {
          company_id: string
          created_at: string
          end_to_end_id: string | null
          error_message: string | null
          event_id: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          signature: string | null
          txid: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          end_to_end_id?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          signature?: string | null
          txid?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          end_to_end_id?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          signature?: string | null
          txid?: string | null
        }
        Relationships: []
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
      plan_modules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_key: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key: string
          plan_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ai_calls_per_month: number
          allowed_modules: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_branches: number
          max_companies: number
          max_orders_month: number
          max_users: number
          name: string
          nfe_per_month: number
          price_annual: number
          price_monthly: number
          slug: string
          sort_order: number
          storage_mb: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          ai_calls_per_month?: number
          allowed_modules?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_branches?: number
          max_companies?: number
          max_orders_month?: number
          max_users?: number
          name: string
          nfe_per_month?: number
          price_annual?: number
          price_monthly?: number
          slug: string
          sort_order?: number
          storage_mb?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          ai_calls_per_month?: number
          allowed_modules?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_branches?: number
          max_companies?: number
          max_orders_month?: number
          max_users?: number
          name?: string
          nfe_per_month?: number
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
      playbook_usage_logs: {
        Row: {
          action_type: string
          company_id: string | null
          context: string | null
          created_at: string
          id: string
          objection_id: string | null
          playbook_id: string | null
          result: string | null
          sales_rep_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          company_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          objection_id?: string | null
          playbook_id?: string | null
          result?: string | null
          sales_rep_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          company_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          objection_id?: string | null
          playbook_id?: string | null
          result?: string | null
          sales_rep_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_usage_logs_objection_id_fkey"
            columns: ["objection_id"]
            isOneToOne: false
            referencedRelation: "sales_objections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_usage_logs_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "sales_playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          labor_cost: number
          labor_rate_per_hour: number
          last_calculated_at: string
          notes: string | null
          operational_cost: number
          product_code: string
          product_id: string | null
          product_name: string
          production_time_minutes: number
          profit_margin: number
          profit_value: number
          raw_material_cost: number
          sale_price: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          labor_cost?: number
          labor_rate_per_hour?: number
          last_calculated_at?: string
          notes?: string | null
          operational_cost?: number
          product_code: string
          product_id?: string | null
          product_name: string
          production_time_minutes?: number
          profit_margin?: number
          profit_value?: number
          raw_material_cost?: number
          sale_price?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          labor_cost?: number
          labor_rate_per_hour?: number
          last_calculated_at?: string
          notes?: string | null
          operational_cost?: number
          product_code?: string
          product_id?: string | null
          product_name?: string
          production_time_minutes?: number
          profit_margin?: number
          profit_value?: number
          raw_material_cost?: number
          sale_price?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_materials: {
        Row: {
          company_id: string | null
          component_code: string
          component_id: string | null
          component_name: string
          created_at: string
          id: string
          is_active: boolean
          is_optional: boolean
          notes: string | null
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          sequence: number
          unit: string
          unit_cost: number
          updated_at: string
          waste_percentage: number
        }
        Insert: {
          company_id?: string | null
          component_code: string
          component_id?: string | null
          component_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_optional?: boolean
          notes?: string | null
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sequence?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
          waste_percentage?: number
        }
        Update: {
          company_id?: string | null
          component_code?: string
          component_id?: string | null
          component_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_optional?: boolean
          notes?: string | null
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sequence?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
          waste_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_materials_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_supplier_references: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          product_id: string
          supplier_id: string
          supplier_ref_code: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          supplier_id: string
          supplier_ref_code: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          supplier_id?: string
          supplier_ref_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_technical_sheets: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          materials: Json
          notes: string | null
          product_code: string
          product_id: string | null
          product_name: string
          standard_cost: number
          steps: Json
          total_time_minutes: number
          updated_at: string
          version: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          materials?: Json
          notes?: string | null
          product_code: string
          product_id?: string | null
          product_name: string
          standard_cost?: number
          steps?: Json
          total_time_minutes?: number
          updated_at?: string
          version?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          materials?: Json
          notes?: string | null
          product_code?: string
          product_id?: string | null
          product_name?: string
          standard_cost?: number
          steps?: Json
          total_time_minutes?: number
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_technical_sheets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_bom: {
        Row: {
          company_id: string
          component_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          waste_percentage: number | null
        }
        Insert: {
          company_id: string
          component_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          waste_percentage?: number | null
        }
        Update: {
          company_id?: string
          component_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          waste_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_bom_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_bom_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_capacity: {
        Row: {
          capacity_per_hour: number
          company_id: string | null
          created_at: string
          current_load_pct: number
          id: string
          is_active: boolean
          machine: string | null
          max_hours_per_day: number
          notes: string | null
          operator_name: string | null
          sector: string
          shift: string
          updated_at: string
        }
        Insert: {
          capacity_per_hour?: number
          company_id?: string | null
          created_at?: string
          current_load_pct?: number
          id?: string
          is_active?: boolean
          machine?: string | null
          max_hours_per_day?: number
          notes?: string | null
          operator_name?: string | null
          sector: string
          shift?: string
          updated_at?: string
        }
        Update: {
          capacity_per_hour?: number
          company_id?: string | null
          created_at?: string
          current_load_pct?: number
          id?: string
          is_active?: boolean
          machine?: string | null
          max_hours_per_day?: number
          notes?: string | null
          operator_name?: string | null
          sector?: string
          shift?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_costs: {
        Row: {
          calculated_at: string | null
          company_id: string | null
          created_at: string
          id: string
          labor_cost: number | null
          notes: string | null
          operational_cost: number | null
          production_order_id: string | null
          profit_margin: number | null
          profit_per_unit: number | null
          quantity: number | null
          raw_material_cost: number | null
          sale_price: number | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          calculated_at?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          labor_cost?: number | null
          notes?: string | null
          operational_cost?: number | null
          production_order_id?: string | null
          profit_margin?: number | null
          profit_per_unit?: number | null
          quantity?: number | null
          raw_material_cost?: number | null
          sale_price?: number | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          calculated_at?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          labor_cost?: number | null
          notes?: string | null
          operational_cost?: number | null
          production_order_id?: string | null
          profit_margin?: number | null
          profit_per_unit?: number | null
          quantity?: number | null
          raw_material_cost?: number | null
          sale_price?: number | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_costs_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_events: {
        Row: {
          company_id: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          event_type: string
          id: string
          machine_id: string | null
          operator: string | null
          payload: Json | null
          processed: boolean
          processed_at: string | null
          processing_result: Json | null
          sector: string | null
          severity: string
          source: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          machine_id?: string | null
          operator?: string | null
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          processing_result?: Json | null
          sector?: string | null
          severity?: string
          source?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          machine_id?: string | null
          operator?: string | null
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          processing_result?: Json | null
          sector?: string | null
          severity?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_events_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "production_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      production_indicators: {
        Row: {
          availability: number | null
          avg_lead_time_hours: number | null
          company_id: string | null
          completed_orders: number | null
          cost_per_unit: number | null
          created_at: string
          efficiency: number | null
          id: string
          labor_cost: number | null
          line_id: string | null
          line_name: string | null
          material_cost: number | null
          mtbf_hours: number | null
          mttr_hours: number | null
          notes: string | null
          oee: number | null
          on_time_delivery_pct: number | null
          performance: number | null
          period: string
          period_end: string
          period_start: string
          productivity: number | null
          quality: number | null
          rejection_rate: number | null
          sector: string | null
          total_cost: number | null
          total_downtime_minutes: number | null
          total_orders: number | null
          total_produced: number | null
          total_rejected: number | null
          updated_at: string
        }
        Insert: {
          availability?: number | null
          avg_lead_time_hours?: number | null
          company_id?: string | null
          completed_orders?: number | null
          cost_per_unit?: number | null
          created_at?: string
          efficiency?: number | null
          id?: string
          labor_cost?: number | null
          line_id?: string | null
          line_name?: string | null
          material_cost?: number | null
          mtbf_hours?: number | null
          mttr_hours?: number | null
          notes?: string | null
          oee?: number | null
          on_time_delivery_pct?: number | null
          performance?: number | null
          period: string
          period_end: string
          period_start: string
          productivity?: number | null
          quality?: number | null
          rejection_rate?: number | null
          sector?: string | null
          total_cost?: number | null
          total_downtime_minutes?: number | null
          total_orders?: number | null
          total_produced?: number | null
          total_rejected?: number | null
          updated_at?: string
        }
        Update: {
          availability?: number | null
          avg_lead_time_hours?: number | null
          company_id?: string | null
          completed_orders?: number | null
          cost_per_unit?: number | null
          created_at?: string
          efficiency?: number | null
          id?: string
          labor_cost?: number | null
          line_id?: string | null
          line_name?: string | null
          material_cost?: number | null
          mtbf_hours?: number | null
          mttr_hours?: number | null
          notes?: string | null
          oee?: number | null
          on_time_delivery_pct?: number | null
          performance?: number | null
          period?: string
          period_end?: string
          period_start?: string
          productivity?: number | null
          quality?: number | null
          rejection_rate?: number | null
          sector?: string | null
          total_cost?: number | null
          total_downtime_minutes?: number | null
          total_orders?: number | null
          total_produced?: number | null
          total_rejected?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_indicators_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      production_lines: {
        Row: {
          capacity_per_hour: number
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          responsible: string | null
          sector_id: string | null
          shift: string
          updated_at: string
        }
        Insert: {
          capacity_per_hour?: number
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          responsible?: string | null
          sector_id?: string | null
          shift?: string
          updated_at?: string
        }
        Update: {
          capacity_per_hour?: number
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          responsible?: string | null
          sector_id?: string | null
          shift?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lines_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "production_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      production_logs: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          operator: string | null
          production_order_id: string | null
          quantity: number | null
          step_id: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          operator?: string | null
          production_order_id?: string | null
          quantity?: number | null
          step_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          operator?: string | null
          production_order_id?: string | null
          quantity?: number | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_machines: {
        Row: {
          active: boolean
          capacity_per_hour: number | null
          code: string
          company_id: string
          created_at: string
          current_operator: string | null
          current_order_id: string | null
          id: string
          name: string
          notes: string | null
          sector: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity_per_hour?: number | null
          code: string
          company_id?: string
          created_at?: string
          current_operator?: string | null
          current_order_id?: string | null
          id?: string
          name: string
          notes?: string | null
          sector?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity_per_hour?: number | null
          code?: string
          company_id?: string
          created_at?: string
          current_operator?: string | null
          current_order_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          sector?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_machines_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_steps: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          defect_reason: string | null
          estimated_time_minutes: number
          id: string
          notes: string | null
          production_order_id: string
          quantity_pending: number
          quantity_produced: number
          quantity_rejected: number
          realized_time_minutes: number
          responsible: string | null
          sequence: number
          started_at: string | null
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          defect_reason?: string | null
          estimated_time_minutes?: number
          id?: string
          notes?: string | null
          production_order_id: string
          quantity_pending?: number
          quantity_produced?: number
          quantity_rejected?: number
          realized_time_minutes?: number
          responsible?: string | null
          sequence?: number
          started_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          defect_reason?: string | null
          estimated_time_minutes?: number
          id?: string
          notes?: string | null
          production_order_id?: string
          quantity_pending?: number
          quantity_produced?: number
          quantity_rejected?: number
          realized_time_minutes?: number
          responsible?: string | null
          sequence?: number
          started_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_steps_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          batch_code: string | null
          bom_id: string | null
          branch_id: string | null
          client_id: string | null
          client_name: string | null
          color: string | null
          company_id: string
          completed_date: string | null
          created_at: string
          defect_notes: string | null
          delivery_type: string | null
          due_date: string | null
          estimated_time_minutes: number | null
          id: string
          model_variant: string | null
          notes: string | null
          operator: string | null
          order_item_id: string | null
          order_number: string
          partial_delivered_qty: number | null
          priority: string
          priority_score: number | null
          produced_quantity: number
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          realized_time_minutes: number | null
          rejected_quantity: number | null
          released_at: string | null
          route_id: string | null
          sales_order_id: string | null
          sector: string | null
          sequence_order: number | null
          size_grid: string | null
          start_date: string | null
          status: string
          unit: string
          updated_at: string
          work_center: string | null
          work_center_id: string | null
        }
        Insert: {
          batch_code?: string | null
          bom_id?: string | null
          branch_id?: string | null
          client_id?: string | null
          client_name?: string | null
          color?: string | null
          company_id: string
          completed_date?: string | null
          created_at?: string
          defect_notes?: string | null
          delivery_type?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          id?: string
          model_variant?: string | null
          notes?: string | null
          operator?: string | null
          order_item_id?: string | null
          order_number: string
          partial_delivered_qty?: number | null
          priority?: string
          priority_score?: number | null
          produced_quantity?: number
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          realized_time_minutes?: number | null
          rejected_quantity?: number | null
          released_at?: string | null
          route_id?: string | null
          sales_order_id?: string | null
          sector?: string | null
          sequence_order?: number | null
          size_grid?: string | null
          start_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          work_center?: string | null
          work_center_id?: string | null
        }
        Update: {
          batch_code?: string | null
          bom_id?: string | null
          branch_id?: string | null
          client_id?: string | null
          client_name?: string | null
          color?: string | null
          company_id?: string
          completed_date?: string | null
          created_at?: string
          defect_notes?: string | null
          delivery_type?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          id?: string
          model_variant?: string | null
          notes?: string | null
          operator?: string | null
          order_item_id?: string | null
          order_number?: string
          partial_delivered_qty?: number | null
          priority?: string
          priority_score?: number | null
          produced_quantity?: number
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          realized_time_minutes?: number | null
          rejected_quantity?: number | null
          released_at?: string | null
          route_id?: string | null
          sales_order_id?: string | null
          sector?: string | null
          sequence_order?: number | null
          size_grid?: string | null
          start_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          work_center?: string | null
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "production_orders_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders_enterprise: {
        Row: {
          company_id: string
          created_at: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          priority: number | null
          product_id: string | null
          quantity_planned: number
          quantity_produced: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          product_id?: string | null
          quantity_planned: number
          quantity_produced?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          product_id?: string | null
          quantity_planned?: number
          quantity_produced?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_enterprise_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_quality_checks: {
        Row: {
          check_type: string
          created_at: string | null
          id: string
          inspector_id: string | null
          notes: string | null
          production_order_id: string | null
          result: string
        }
        Insert: {
          check_type: string
          created_at?: string | null
          id?: string
          inspector_id?: string | null
          notes?: string | null
          production_order_id?: string | null
          result: string
        }
        Update: {
          check_type?: string
          created_at?: string | null
          id?: string
          inspector_id?: string | null
          notes?: string | null
          production_order_id?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_quality_checks_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders_enterprise"
            referencedColumns: ["id"]
          },
        ]
      }
      production_resources: {
        Row: {
          capacity_per_hour: number
          code: string
          company_id: string | null
          cost_per_hour: number
          created_at: string
          id: string
          is_active: boolean
          line_id: string | null
          name: string
          notes: string | null
          resource_type: string
          sector_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          capacity_per_hour?: number
          code: string
          company_id?: string | null
          cost_per_hour?: number
          created_at?: string
          id?: string
          is_active?: boolean
          line_id?: string | null
          name: string
          notes?: string | null
          resource_type?: string
          sector_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          capacity_per_hour?: number
          code?: string
          company_id?: string | null
          cost_per_hour?: number
          created_at?: string
          id?: string
          is_active?: boolean
          line_id?: string | null
          name?: string
          notes?: string | null
          resource_type?: string
          sector_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_resources_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_resources_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "production_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      production_route_steps: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          operation_time_minutes: number
          resource_id: string | null
          route_id: string
          sector_id: string | null
          sequence: number
          setup_time_minutes: number
          step_name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          operation_time_minutes?: number
          resource_id?: string | null
          route_id: string
          sector_id?: string | null
          sequence?: number
          setup_time_minutes?: number
          step_name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          operation_time_minutes?: number
          resource_id?: string | null
          route_id?: string
          sector_id?: string | null
          sequence?: number
          setup_time_minutes?: number
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_route_steps_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "production_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_route_steps_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "production_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_route_steps_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "production_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      production_routes: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          product_code: string | null
          product_id: string | null
          product_name: string | null
          total_time_minutes: number
          updated_at: string
          version: string
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          total_time_minutes?: number
          updated_at?: string
          version?: string
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          total_time_minutes?: number
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_routes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_schedule: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          planned_end: string
          planned_start: string
          priority: number | null
          production_order_id: string | null
          sector: string | null
          shift: string | null
          status: string | null
          updated_at: string
          work_center: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_end: string
          planned_start: string
          priority?: number | null
          production_order_id?: string | null
          sector?: string | null
          shift?: string | null
          status?: string | null
          updated_at?: string
          work_center?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_end?: string
          planned_start?: string
          priority?: number | null
          production_order_id?: string | null
          sector?: string | null
          shift?: string | null
          status?: string | null
          updated_at?: string
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_schedule_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_sectors: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          responsible: string | null
          sector_type: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          responsible?: string | null
          sector_type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          responsible?: string | null
          sector_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_steps: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          estimated_time_minutes: number
          id: string
          is_active: boolean
          name: string
          sector: string | null
          sequence: number
          updated_at: string
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          sector?: string | null
          sequence?: number
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          sector?: string | null
          sequence?: number
          updated_at?: string
        }
        Relationships: []
      }
      production_time_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          elapsed_seconds: number
          finished_at: string | null
          id: string
          notes: string | null
          operator: string | null
          order_id: string
          paused_at: string | null
          started_at: string | null
        }
        Insert: {
          action?: string
          company_id?: string | null
          created_at?: string
          elapsed_seconds?: number
          finished_at?: string | null
          id?: string
          notes?: string | null
          operator?: string | null
          order_id: string
          paused_at?: string | null
          started_at?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          elapsed_seconds?: number
          finished_at?: string | null
          id?: string
          notes?: string | null
          operator?: string | null
          order_id?: string
          paused_at?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_time_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          abc_classification: string | null
          barcode: string | null
          category_id: string | null
          code: string
          company_id: string
          cost_price: number
          created_at: string
          depth: number | null
          description: string | null
          expiration_control: boolean | null
          height: number | null
          id: string
          image_url: string | null
          lead_time_days: number
          location: string | null
          lot_control: boolean | null
          max_stock: number
          min_stock: number
          name: string
          reorder_point: number
          sale_price: number
          shelf_life_days: number | null
          status: string
          subcategory: string | null
          supplier: string | null
          type: string
          unit: string
          unit_conversions: Json | null
          updated_at: string
          volume: number | null
          weight: number | null
          width: number | null
        }
        Insert: {
          abc_classification?: string | null
          barcode?: string | null
          category_id?: string | null
          code: string
          company_id?: string
          cost_price?: number
          created_at?: string
          depth?: number | null
          description?: string | null
          expiration_control?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          lead_time_days?: number
          location?: string | null
          lot_control?: boolean | null
          max_stock?: number
          min_stock?: number
          name: string
          reorder_point?: number
          sale_price?: number
          shelf_life_days?: number | null
          status?: string
          subcategory?: string | null
          supplier?: string | null
          type?: string
          unit?: string
          unit_conversions?: Json | null
          updated_at?: string
          volume?: number | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          abc_classification?: string | null
          barcode?: string | null
          category_id?: string | null
          code?: string
          company_id?: string
          cost_price?: number
          created_at?: string
          depth?: number | null
          description?: string | null
          expiration_control?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          lead_time_days?: number
          location?: string | null
          lot_control?: boolean | null
          max_stock?: number
          min_stock?: number
          name?: string
          reorder_point?: number
          sale_price?: number
          shelf_life_days?: number | null
          status?: string
          subcategory?: string | null
          supplier?: string | null
          type?: string
          unit?: string
          unit_conversions?: Json | null
          updated_at?: string
          volume?: number | null
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
          branch_id: string | null
          company_id: string | null
          created_at: string
          default_branch_id: string | null
          department: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          default_branch_id?: string | null
          department?: string | null
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          default_branch_id?: string | null
          department?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_branch_id_fkey"
            columns: ["default_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      putaway_tasks: {
        Row: {
          actual_location_code: string | null
          actual_location_id: string | null
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          lot_id: string | null
          lot_number: string | null
          notes: string | null
          priority: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          receiving_order_id: string | null
          sla_deadline: string | null
          source_location: string | null
          started_at: string | null
          status: string
          suggested_location_code: string | null
          suggested_location_id: string | null
          suggestion_reason: string | null
          task_number: string
          unit: string
          updated_at: string
        }
        Insert: {
          actual_location_code?: string | null
          actual_location_id?: string | null
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lot_id?: string | null
          lot_number?: string | null
          notes?: string | null
          priority?: string
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          receiving_order_id?: string | null
          sla_deadline?: string | null
          source_location?: string | null
          started_at?: string | null
          status?: string
          suggested_location_code?: string | null
          suggested_location_id?: string | null
          suggestion_reason?: string | null
          task_number: string
          unit?: string
          updated_at?: string
        }
        Update: {
          actual_location_code?: string | null
          actual_location_id?: string | null
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lot_id?: string | null
          lot_number?: string | null
          notes?: string | null
          priority?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          receiving_order_id?: string | null
          sla_deadline?: string | null
          source_location?: string | null
          started_at?: string | null
          status?: string
          suggested_location_code?: string | null
          suggested_location_id?: string | null
          suggestion_reason?: string | null
          task_number?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "putaway_tasks_actual_location_id_fkey"
            columns: ["actual_location_id"]
            isOneToOne: false
            referencedRelation: "wms_storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_receiving_order_id_fkey"
            columns: ["receiving_order_id"]
            isOneToOne: false
            referencedRelation: "wms_receiving_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_suggested_location_id_fkey"
            columns: ["suggested_location_id"]
            isOneToOne: false
            referencedRelation: "wms_storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string | null
          id: string
          original_amount: number
          receivable_id: string | null
          renegotiation_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          original_amount?: number
          receivable_id?: string | null
          renegotiation_id: string
        }
        Update: {
          company_id?: string | null
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
            foreignKeyName: "renegotiation_items_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "client_current_account"
            referencedColumns: ["document_id"]
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      replenishment_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          moved_qty: number
          priority: string
          product_code: string
          product_id: string | null
          product_name: string
          required_qty: number
          sla_deadline: string | null
          source_location_code: string | null
          source_location_id: string | null
          started_at: string | null
          status: string
          target_location_code: string | null
          target_location_id: string | null
          task_number: string
          trigger_type: string
          unit: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          moved_qty?: number
          priority?: string
          product_code: string
          product_id?: string | null
          product_name: string
          required_qty?: number
          sla_deadline?: string | null
          source_location_code?: string | null
          source_location_id?: string | null
          started_at?: string | null
          status?: string
          target_location_code?: string | null
          target_location_id?: string | null
          task_number: string
          trigger_type?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          moved_qty?: number
          priority?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          required_qty?: number
          sla_deadline?: string | null
          source_location_code?: string | null
          source_location_id?: string | null
          started_at?: string | null
          status?: string
          target_location_code?: string | null
          target_location_id?: string | null
          task_number?: string
          trigger_type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replenishment_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishment_tasks_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "wms_storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishment_tasks_target_location_id_fkey"
            columns: ["target_location_id"]
            isOneToOne: false
            referencedRelation: "wms_storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_chain_stores: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_franchise: boolean | null
          location_lat: number | null
          location_lng: number | null
          manager_name: string | null
          status: string | null
          store_code: string | null
          store_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_franchise?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          manager_name?: string | null
          status?: string | null
          store_code?: string | null
          store_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_franchise?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          manager_name?: string | null
          status?: string | null
          store_code?: string | null
          store_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "retail_chain_stores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rfid_events: {
        Row: {
          action_taken: string | null
          antenna: number | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      sales_objections: {
        Row: {
          active: boolean | null
          category: string
          company_id: string | null
          context: string | null
          created_at: string
          id: string
          objection: string
          response: string
          stage: string | null
          strategy: string | null
          success_rate: number | null
          usage_count: number | null
        }
        Insert: {
          active?: boolean | null
          category?: string
          company_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          objection: string
          response: string
          stage?: string | null
          strategy?: string | null
          success_rate?: number | null
          usage_count?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string
          company_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          objection?: string
          response?: string
          stage?: string | null
          strategy?: string | null
          success_rate?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      sales_opportunities: {
        Row: {
          client_id: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      sales_playbooks: {
        Row: {
          actions: Json | null
          active: boolean | null
          category: string
          closing_techniques: Json | null
          company_id: string | null
          created_at: string
          id: string
          ideal_timing: string | null
          next_steps: Json | null
          priority: number | null
          scripts: Json | null
          stage: string
          tips: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          active?: boolean | null
          category?: string
          closing_techniques?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          ideal_timing?: string | null
          next_steps?: Json | null
          priority?: number | null
          scripts?: Json | null
          stage: string
          tips?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          active?: boolean | null
          category?: string
          closing_techniques?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          ideal_timing?: string | null
          next_steps?: Json | null
          priority?: number | null
          scripts?: Json | null
          stage?: string
          tips?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_reps: {
        Row: {
          code: string
          commission_rate: number | null
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      sped_files: {
        Row: {
          company_id: string
          content: string
          created_at: string
          end_date: string
          generated_at: string
          generated_by: string | null
          id: string
          period: string
          start_date: string
          total_records: number
          total_value: number
          type: string
        }
        Insert: {
          company_id?: string
          content: string
          created_at?: string
          end_date: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          period: string
          start_date: string
          total_records?: number
          total_value?: number
          type: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          end_date?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          period?: string
          start_date?: string
          total_records?: number
          total_value?: number
          type?: string
        }
        Relationships: []
      }
      stock_balances: {
        Row: {
          available_qty: number | null
          company_id: string
          created_at: string
          dc_id: string | null
          id: string
          last_movement_at: string | null
          location_code: string | null
          location_id: string | null
          lot_id: string | null
          lot_number: string | null
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          reserved_qty: number
          stock_status: string
          unit: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          available_qty?: number | null
          company_id?: string
          created_at?: string
          dc_id?: string | null
          id?: string
          last_movement_at?: string | null
          location_code?: string | null
          location_id?: string | null
          lot_id?: string | null
          lot_number?: string | null
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          reserved_qty?: number
          stock_status?: string
          unit?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          available_qty?: number | null
          company_id?: string
          created_at?: string
          dc_id?: string | null
          id?: string
          last_movement_at?: string | null
          location_code?: string | null
          location_id?: string | null
          lot_id?: string | null
          lot_number?: string | null
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          reserved_qty?: number
          stock_status?: string
          unit?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_balances_dc_id_fkey"
            columns: ["dc_id"]
            isOneToOne: false
            referencedRelation: "distribution_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wms_storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_lots: {
        Row: {
          auto_generated: boolean
          company_id: string
          consumed_qty: number | null
          created_at: string
          dc_id: string | null
          expiration_date: string | null
          id: string
          initial_quantity: number | null
          inspection_date: string | null
          is_consigned: boolean
          location: string | null
          lot_number: string
          manufacture_date: string | null
          notes: string | null
          origin: string
          origin_reference: string | null
          origin_type: string
          product_code: string
          product_id: string | null
          product_name: string
          quality_status: string | null
          quantity: number
          received_qty: number | null
          remaining_qty: number
          status: string
          supplier: string | null
          supplier_id: string | null
          unit_cost: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          auto_generated?: boolean
          company_id?: string
          consumed_qty?: number | null
          created_at?: string
          dc_id?: string | null
          expiration_date?: string | null
          id?: string
          initial_quantity?: number | null
          inspection_date?: string | null
          is_consigned?: boolean
          location?: string | null
          lot_number: string
          manufacture_date?: string | null
          notes?: string | null
          origin?: string
          origin_reference?: string | null
          origin_type?: string
          product_code: string
          product_id?: string | null
          product_name: string
          quality_status?: string | null
          quantity?: number
          received_qty?: number | null
          remaining_qty?: number
          status?: string
          supplier?: string | null
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          auto_generated?: boolean
          company_id?: string
          consumed_qty?: number | null
          created_at?: string
          dc_id?: string | null
          expiration_date?: string | null
          id?: string
          initial_quantity?: number | null
          inspection_date?: string | null
          is_consigned?: boolean
          location?: string | null
          lot_number?: string
          manufacture_date?: string | null
          notes?: string | null
          origin?: string
          origin_reference?: string | null
          origin_type?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quality_status?: string | null
          quantity?: number
          received_qty?: number | null
          remaining_qty?: number
          status?: string
          supplier?: string | null
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_lots_dc_id_fkey"
            columns: ["dc_id"]
            isOneToOne: false
            referencedRelation: "distribution_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_lots_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch: string | null
          branch_id: string | null
          company_id: string
          created_at: string
          destination: string | null
          direction: string
          document_number: string
          from_warehouse: string | null
          id: string
          lot_id: string | null
          notes: string | null
          operator: string
          origin: string | null
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
          branch_id?: string | null
          company_id?: string
          created_at?: string
          destination?: string | null
          direction?: string
          document_number?: string
          from_warehouse?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          operator?: string
          origin?: string | null
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
          branch_id?: string | null
          company_id?: string
          created_at?: string
          destination?: string | null
          direction?: string
          document_number?: string
          from_warehouse?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          operator?: string
          origin?: string | null
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
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["id"]
          },
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
          company_id: string
          created_at: string
          dc_id: string | null
          expires_at: string | null
          id: string
          location: string | null
          lot_id: string | null
          order_id: string
          order_item_id: string | null
          picked_qty: number
          policy: string | null
          priority: number | null
          product_code: string
          product_id: string | null
          product_name: string
          released_at: string | null
          requested_qty: number
          reservation_type: string | null
          reserved_at: string | null
          reserved_by: string | null
          reserved_qty: number
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          dc_id?: string | null
          expires_at?: string | null
          id?: string
          location?: string | null
          lot_id?: string | null
          order_id: string
          order_item_id?: string | null
          picked_qty?: number
          policy?: string | null
          priority?: number | null
          product_code: string
          product_id?: string | null
          product_name: string
          released_at?: string | null
          requested_qty?: number
          reservation_type?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          reserved_qty?: number
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          dc_id?: string | null
          expires_at?: string | null
          id?: string
          location?: string | null
          lot_id?: string | null
          order_id?: string
          order_item_id?: string | null
          picked_qty?: number
          policy?: string | null
          priority?: number | null
          product_code?: string
          product_id?: string | null
          product_name?: string
          released_at?: string | null
          requested_qty?: number
          reservation_type?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          reserved_qty?: number
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_dc_id_fkey"
            columns: ["dc_id"]
            isOneToOne: false
            referencedRelation: "distribution_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "stock_reservations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
      supplier_metrics: {
        Row: {
          avg_delay_days: number | null
          company_id: string | null
          created_at: string
          id: string
          last_calculated_at: string | null
          late_orders: number | null
          on_time_rate: number | null
          supplier_name: string
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          avg_delay_days?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          late_orders?: number | null
          on_time_rate?: number | null
          supplier_name: string
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          avg_delay_days?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          late_orders?: number | null
          on_time_rate?: number | null
          supplier_name?: string
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
      supply_movements: {
        Row: {
          company_id: string | null
          created_at: string
          direction: string
          document_number: string | null
          id: string
          notes: string | null
          operator: string | null
          production_order_id: string | null
          production_order_number: string | null
          quantity: number
          reason: string | null
          supply_code: string
          supply_id: string
          supply_name: string
          total_cost: number
          type: string
          unit_cost: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          direction?: string
          document_number?: string | null
          id?: string
          notes?: string | null
          operator?: string | null
          production_order_id?: string | null
          production_order_number?: string | null
          quantity?: number
          reason?: string | null
          supply_code: string
          supply_id: string
          supply_name: string
          total_cost?: number
          type?: string
          unit_cost?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          direction?: string
          document_number?: string | null
          id?: string
          notes?: string | null
          operator?: string | null
          production_order_id?: string | null
          production_order_number?: string | null
          quantity?: number
          reason?: string | null
          supply_code?: string
          supply_id?: string
          supply_name?: string
          total_cost?: number
          type?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supply_movements_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_stock: {
        Row: {
          category: string | null
          code: string
          company_id: string | null
          created_at: string
          current_quantity: number
          description: string | null
          id: string
          last_entry_date: string | null
          last_exit_date: string | null
          location: string | null
          max_quantity: number
          min_quantity: number
          name: string
          status: string
          supplier: string | null
          total_value: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          last_entry_date?: string | null
          last_exit_date?: string | null
          location?: string | null
          max_quantity?: number
          min_quantity?: number
          name: string
          status?: string
          supplier?: string | null
          total_value?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          last_entry_date?: string | null
          last_exit_date?: string | null
          location?: string | null
          max_quantity?: number
          min_quantity?: number
          name?: string
          status?: string
          supplier?: string | null
          total_value?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          id: string
          ip_address: string | null
          module: string
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          id?: string
          ip_address?: string | null
          module: string
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_parameters: {
        Row: {
          category: string
          code: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      tax_difal_rules: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          fcp_rate: number | null
          id: string
          internal_rate_destination: number
          interstate_rate: number
          name: string
          notes: string | null
          partilha_destination: number | null
          partilha_origin: number | null
          uf_destination: string
          uf_origin: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          company_id?: string
          created_at?: string
          fcp_rate?: number | null
          id?: string
          internal_rate_destination?: number
          interstate_rate?: number
          name: string
          notes?: string | null
          partilha_destination?: number | null
          partilha_origin?: number | null
          uf_destination: string
          uf_origin: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          fcp_rate?: number | null
          id?: string
          internal_rate_destination?: number
          interstate_rate?: number
          name?: string
          notes?: string | null
          partilha_destination?: number | null
          partilha_origin?: number | null
          uf_destination?: string
          uf_origin?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      tax_icms_st_rules: {
        Row: {
          active: boolean
          cest: string | null
          company_id: string
          created_at: string
          id: string
          internal_rate: number
          interstate_rate: number
          mva_adjusted: number | null
          mva_original: number
          name: string
          ncm: string | null
          notes: string | null
          priority: number
          reduction_base: number | null
          uf_destination: string | null
          uf_origin: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          cest?: string | null
          company_id?: string
          created_at?: string
          id?: string
          internal_rate?: number
          interstate_rate?: number
          mva_adjusted?: number | null
          mva_original?: number
          name: string
          ncm?: string | null
          notes?: string | null
          priority?: number
          reduction_base?: number | null
          uf_destination?: string | null
          uf_origin?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          cest?: string | null
          company_id?: string
          created_at?: string
          id?: string
          internal_rate?: number
          interstate_rate?: number
          mva_adjusted?: number | null
          mva_original?: number
          name?: string
          ncm?: string | null
          notes?: string | null
          priority?: number
          reduction_base?: number | null
          uf_destination?: string | null
          uf_origin?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          active: boolean
          cbs_rate: number | null
          cfop: string | null
          cofins_cst: string | null
          cofins_rate: number | null
          company_id: string
          created_at: string
          description: string | null
          ibs_rate: number | null
          icms_cst: string | null
          icms_rate: number | null
          icms_reduction_base: number | null
          icms_st_mva: number | null
          icms_st_rate: number | null
          id: string
          ipi_cst: string | null
          ipi_rate: number | null
          is_is_rate: number | null
          name: string
          ncm: string | null
          notes: string | null
          operation_type: string | null
          pis_cst: string | null
          pis_rate: number | null
          priority: number
          tax_framework: string | null
          tax_regime: string | null
          uf_destination: string | null
          uf_origin: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          cbs_rate?: number | null
          cfop?: string | null
          cofins_cst?: string | null
          cofins_rate?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          ibs_rate?: number | null
          icms_cst?: string | null
          icms_rate?: number | null
          icms_reduction_base?: number | null
          icms_st_mva?: number | null
          icms_st_rate?: number | null
          id?: string
          ipi_cst?: string | null
          ipi_rate?: number | null
          is_is_rate?: number | null
          name: string
          ncm?: string | null
          notes?: string | null
          operation_type?: string | null
          pis_cst?: string | null
          pis_rate?: number | null
          priority?: number
          tax_framework?: string | null
          tax_regime?: string | null
          uf_destination?: string | null
          uf_origin?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          cbs_rate?: number | null
          cfop?: string | null
          cofins_cst?: string | null
          cofins_rate?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          ibs_rate?: number | null
          icms_cst?: string | null
          icms_rate?: number | null
          icms_reduction_base?: number | null
          icms_st_mva?: number | null
          icms_st_rate?: number | null
          id?: string
          ipi_cst?: string | null
          ipi_rate?: number | null
          is_is_rate?: number | null
          name?: string
          ncm?: string | null
          notes?: string | null
          operation_type?: string | null
          pis_cst?: string | null
          pis_rate?: number | null
          priority?: number
          tax_framework?: string | null
          tax_regime?: string | null
          uf_destination?: string | null
          uf_origin?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      textile_weaving_orders: {
        Row: {
          company_id: string
          created_at: string | null
          end_date: string | null
          fabric_type: string
          id: string
          loom_id: string
          meters_planned: number
          meters_produced: number | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          end_date?: string | null
          fabric_type: string
          id?: string
          loom_id: string
          meters_planned: number
          meters_produced?: number | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          end_date?: string | null
          fabric_type?: string
          id?: string
          loom_id?: string
          meters_planned?: number
          meters_produced?: number | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textile_weaving_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      textile_yarn_inventory: {
        Row: {
          batch_number: string | null
          color_code: string | null
          company_id: string
          composition: string | null
          created_at: string | null
          current_stock: number | null
          id: string
          name: string
          unit: string | null
          updated_at: string | null
          yarn_count: string | null
        }
        Insert: {
          batch_number?: string | null
          color_code?: string | null
          company_id: string
          composition?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          name: string
          unit?: string | null
          updated_at?: string | null
          yarn_count?: string | null
        }
        Update: {
          batch_number?: string | null
          color_code?: string | null
          company_id?: string
          composition?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          name?: string
          unit?: string | null
          updated_at?: string | null
          yarn_count?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textile_yarn_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          company_id: string | null
          created_at: string
          end_time: string | null
          id: string
          machine_id: string | null
          machine_name: string | null
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
          company_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
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
          company_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
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
            foreignKeyName: "time_entries_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "production_machines"
            referencedColumns: ["id"]
          },
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
      user_permission_overrides: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          granted: boolean
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          granted?: boolean
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          granted?: boolean
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          carrier_id: string | null
          company_id: string
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          max_volume: number | null
          max_weight: number | null
          model: string | null
          plate: string
          status: string
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          carrier_id?: string | null
          company_id?: string
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          max_volume?: number | null
          max_weight?: number | null
          model?: string | null
          plate: string
          status?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          carrier_id?: string | null
          company_id?: string
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          max_volume?: number | null
          max_weight?: number | null
          model?: string | null
          plate?: string
          status?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_locations: {
        Row: {
          abc_classification: string | null
          active: boolean
          code: string
          column_code: string | null
          company_id: string
          created_at: string
          current_volume: number | null
          current_weight: number | null
          id: string
          level_code: string | null
          location_type: string
          max_volume: number | null
          max_weight: number | null
          position_code: string | null
          status: string
          street: string | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          abc_classification?: string | null
          active?: boolean
          code: string
          column_code?: string | null
          company_id?: string
          created_at?: string
          current_volume?: number | null
          current_weight?: number | null
          id?: string
          level_code?: string | null
          location_type?: string
          max_volume?: number | null
          max_weight?: number | null
          position_code?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          abc_classification?: string | null
          active?: boolean
          code?: string
          column_code?: string | null
          company_id?: string
          created_at?: string
          current_volume?: number | null
          current_weight?: number | null
          id?: string
          level_code?: string | null
          location_type?: string
          max_volume?: number | null
          max_weight?: number | null
          position_code?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_zones: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string
          is_bulk_zone: boolean | null
          is_picking_zone: boolean | null
          name: string
          parent_zone_id: string | null
          priority: number | null
          status: string
          temperature_range: string | null
          updated_at: string
          warehouse_id: string
          zone_type: string
        }
        Insert: {
          code: string
          company_id?: string
          created_at?: string
          id?: string
          is_bulk_zone?: boolean | null
          is_picking_zone?: boolean | null
          name: string
          parent_zone_id?: string | null
          priority?: number | null
          status?: string
          temperature_range?: string | null
          updated_at?: string
          warehouse_id: string
          zone_type?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_bulk_zone?: boolean | null
          is_picking_zone?: boolean | null
          name?: string
          parent_zone_id?: string | null
          priority?: number | null
          status?: string
          temperature_range?: string | null
          updated_at?: string
          warehouse_id?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_zones_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_zones_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          code: string
          company_id: string
          created_at: string
          distribution_center_id: string | null
          id: string
          manager: string | null
          name: string
          notes: string | null
          occupied_locations: number | null
          status: string
          total_capacity: number | null
          total_locations: number | null
          type: string | null
          updated_at: string
          used_capacity: number | null
        }
        Insert: {
          address?: string | null
          code: string
          company_id?: string
          created_at?: string
          distribution_center_id?: string | null
          id?: string
          manager?: string | null
          name: string
          notes?: string | null
          occupied_locations?: number | null
          status?: string
          total_capacity?: number | null
          total_locations?: number | null
          type?: string | null
          updated_at?: string
          used_capacity?: number | null
        }
        Update: {
          address?: string | null
          code?: string
          company_id?: string
          created_at?: string
          distribution_center_id?: string | null
          id?: string
          manager?: string | null
          name?: string
          notes?: string | null
          occupied_locations?: number | null
          status?: string
          total_capacity?: number | null
          total_locations?: number | null
          type?: string | null
          updated_at?: string
          used_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_distribution_center_id_fkey"
            columns: ["distribution_center_id"]
            isOneToOne: false
            referencedRelation: "distribution_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body: string
          category: string
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          updated_at: string
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          body: string
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: []
      }
      wholesaler_routes: {
        Row: {
          company_id: string
          created_at: string | null
          delivery_points: Json | null
          driver_id: string | null
          frequency: string | null
          id: string
          route_name: string
          vehicle_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          delivery_points?: Json | null
          driver_id?: string | null
          frequency?: string | null
          id?: string
          route_name: string
          vehicle_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          delivery_points?: Json | null
          driver_id?: string | null
          frequency?: string | null
          id?: string
          route_name?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wholesaler_routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_ai_insights: {
        Row: {
          affected_locations: Json | null
          affected_products: Json | null
          category: string
          company_id: string | null
          created_at: string
          data_points: Json | null
          dc_id: string | null
          description: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          expires_at: string | null
          id: string
          insight_type: string
          recommended_actions: Json | null
          severity: string
          status: string
          title: string
          warehouse_id: string | null
        }
        Insert: {
          affected_locations?: Json | null
          affected_products?: Json | null
          category?: string
          company_id?: string | null
          created_at?: string
          data_points?: Json | null
          dc_id?: string | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          id?: string
          insight_type: string
          recommended_actions?: Json | null
          severity?: string
          status?: string
          title: string
          warehouse_id?: string | null
        }
        Update: {
          affected_locations?: Json | null
          affected_products?: Json | null
          category?: string
          company_id?: string | null
          created_at?: string
          data_points?: Json | null
          dc_id?: string | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          recommended_actions?: Json | null
          severity?: string
          status?: string
          title?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_ai_insights_dc_id_fkey"
            columns: ["dc_id"]
            isOneToOne: false
            referencedRelation: "distribution_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_ai_insights_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_audit_log: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      wms_conference_items: {
        Row: {
          barcode: string | null
          checked_at: string | null
          checked_qty: number
          company_id: string | null
          conference_id: string
          divergence: number | null
          expected_qty: number
          id: string
          lot_number: string | null
          notes: string | null
          product_code: string
          product_name: string
          status: string
        }
        Insert: {
          barcode?: string | null
          checked_at?: string | null
          checked_qty?: number
          company_id?: string | null
          conference_id: string
          divergence?: number | null
          expected_qty?: number
          id?: string
          lot_number?: string | null
          notes?: string | null
          product_code: string
          product_name: string
          status?: string
        }
        Update: {
          barcode?: string | null
          checked_at?: string | null
          checked_qty?: number
          company_id?: string | null
          conference_id?: string
          divergence?: number | null
          expected_qty?: number
          id?: string
          lot_number?: string | null
          notes?: string | null
          product_code?: string
          product_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_conference_items_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "wms_conference_records"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_conference_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checked_items: number
          company_id: string | null
          completed_at: string | null
          conference_number: string
          conference_type: string
          created_at: string
          divergences: number
          id: string
          notes: string | null
          operator: string | null
          reference_id: string | null
          reference_number: string | null
          reference_type: string
          started_at: string | null
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checked_items?: number
          company_id?: string | null
          completed_at?: string | null
          conference_number: string
          conference_type?: string
          created_at?: string
          divergences?: number
          id?: string
          notes?: string | null
          operator?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checked_items?: number
          company_id?: string | null
          completed_at?: string | null
          conference_number?: string
          conference_type?: string
          created_at?: string
          divergences?: number
          id?: string
          notes?: string | null
          operator?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      wms_docks: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string | null
          type: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          type: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          type?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_docks_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_inventory_counts: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      wms_logs: {
        Row: {
          company_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_ref: string | null
          entity_type: string
          id: string
          ip_address: string | null
          operation: string
          operator: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_ref?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          operation: string
          operator?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_ref?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          operation?: string
          operator?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wms_movements: {
        Row: {
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          batch_id: string | null
          cluster_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          customer_name: string
          id: string
          items_count: number
          order_number: string
          picked_items: number
          picking_strategy: string | null
          priority: string
          route_sequence: Json | null
          sales_order_id: string | null
          started_at: string | null
          status: string
          wave_id: string | null
          wave_id_ref: string | null
          zone_filter: string | null
        }
        Insert: {
          assigned_to?: string | null
          batch_id?: string | null
          cluster_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_name: string
          id?: string
          items_count?: number
          order_number: string
          picked_items?: number
          picking_strategy?: string | null
          priority?: string
          route_sequence?: Json | null
          sales_order_id?: string | null
          started_at?: string | null
          status?: string
          wave_id?: string | null
          wave_id_ref?: string | null
          zone_filter?: string | null
        }
        Update: {
          assigned_to?: string | null
          batch_id?: string | null
          cluster_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          items_count?: number
          order_number?: string
          picked_items?: number
          picking_strategy?: string | null
          priority?: string
          route_sequence?: Json | null
          sales_order_id?: string | null
          started_at?: string | null
          status?: string
          wave_id?: string | null
          wave_id_ref?: string | null
          zone_filter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_picking_orders_wave_id_ref_fkey"
            columns: ["wave_id_ref"]
            isOneToOne: false
            referencedRelation: "picking_waves"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_receiving_items: {
        Row: {
          batch: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string
          conference_type: string | null
          created_at: string
          dock: string | null
          expected_date: string | null
          id: string
          items_count: number
          notes: string | null
          operator: string | null
          order_number: string
          purchase_order_id: string | null
          received_date: string | null
          received_items: number
          status: string
          supplier: string
        }
        Insert: {
          company_id?: string
          conference_type?: string | null
          created_at?: string
          dock?: string | null
          expected_date?: string | null
          id?: string
          items_count?: number
          notes?: string | null
          operator?: string | null
          order_number: string
          purchase_order_id?: string | null
          received_date?: string | null
          received_items?: number
          status?: string
          supplier: string
        }
        Update: {
          company_id?: string
          conference_type?: string | null
          created_at?: string
          dock?: string | null
          expected_date?: string | null
          id?: string
          items_count?: number
          notes?: string | null
          operator?: string | null
          order_number?: string
          purchase_order_id?: string | null
          received_date?: string | null
          received_items?: number
          status?: string
          supplier?: string
        }
        Relationships: []
      }
      wms_returns: {
        Row: {
          approved_items: number | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          customer_name: string | null
          destination: string | null
          id: string
          inspected_at: string | null
          inspected_by: string | null
          inspected_items: number | null
          notes: string | null
          reason: string | null
          received_at: string | null
          received_by: string | null
          reference_number: string | null
          rejected_items: number | null
          return_number: string
          return_type: string
          status: string
          supplier_name: string | null
          total_items: number | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          approved_items?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          destination?: string | null
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          inspected_items?: number | null
          notes?: string | null
          reason?: string | null
          received_at?: string | null
          received_by?: string | null
          reference_number?: string | null
          rejected_items?: number | null
          return_number: string
          return_type?: string
          status?: string
          supplier_name?: string | null
          total_items?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_items?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          destination?: string | null
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          inspected_items?: number | null
          notes?: string | null
          reason?: string | null
          received_at?: string | null
          received_by?: string | null
          reference_number?: string | null
          rejected_items?: number | null
          return_number?: string
          return_type?: string
          status?: string
          supplier_name?: string | null
          total_items?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_shipments: {
        Row: {
          carrier: string | null
          carrier_code: string | null
          company_id: string
          created_at: string
          customer_name: string
          delivered_at: string | null
          departure_at: string | null
          dock_id: string | null
          driver_document: string | null
          driver_name: string | null
          id: string
          loading_completed_at: string | null
          loading_started_at: string | null
          notes: string | null
          operator: string | null
          order_number: string | null
          packing_order_id: string | null
          romaneio_number: string | null
          route: string | null
          scheduled_date: string | null
          shipment_number: string
          shipped_at: string | null
          shipping_address: string | null
          status: string
          total_value: number | null
          total_weight: number | null
          tracking_number: string | null
          updated_at: string
          vehicle_plate: string | null
          volumes: number
          wave_id: string | null
        }
        Insert: {
          carrier?: string | null
          carrier_code?: string | null
          company_id?: string
          created_at?: string
          customer_name: string
          delivered_at?: string | null
          departure_at?: string | null
          dock_id?: string | null
          driver_document?: string | null
          driver_name?: string | null
          id?: string
          loading_completed_at?: string | null
          loading_started_at?: string | null
          notes?: string | null
          operator?: string | null
          order_number?: string | null
          packing_order_id?: string | null
          romaneio_number?: string | null
          route?: string | null
          scheduled_date?: string | null
          shipment_number: string
          shipped_at?: string | null
          shipping_address?: string | null
          status?: string
          total_value?: number | null
          total_weight?: number | null
          tracking_number?: string | null
          updated_at?: string
          vehicle_plate?: string | null
          volumes?: number
          wave_id?: string | null
        }
        Update: {
          carrier?: string | null
          carrier_code?: string | null
          company_id?: string
          created_at?: string
          customer_name?: string
          delivered_at?: string | null
          departure_at?: string | null
          dock_id?: string | null
          driver_document?: string | null
          driver_name?: string | null
          id?: string
          loading_completed_at?: string | null
          loading_started_at?: string | null
          notes?: string | null
          operator?: string | null
          order_number?: string | null
          packing_order_id?: string | null
          romaneio_number?: string | null
          route?: string | null
          scheduled_date?: string | null
          shipment_number?: string
          shipped_at?: string | null
          shipping_address?: string | null
          status?: string
          total_value?: number | null
          total_weight?: number | null
          tracking_number?: string | null
          updated_at?: string
          vehicle_plate?: string | null
          volumes?: number
          wave_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_shipments_dock_id_fkey"
            columns: ["dock_id"]
            isOneToOne: false
            referencedRelation: "loading_docks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_shipments_packing_order_id_fkey"
            columns: ["packing_order_id"]
            isOneToOne: false
            referencedRelation: "wms_packing_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_shipments_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "picking_waves"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_storage_locations: {
        Row: {
          abc_class: string | null
          active: boolean
          aisle: string
          capacity: number
          code: string
          column_pos: string | null
          company_id: string
          created_at: string
          current_volume: number | null
          current_weight: number | null
          distance_to_dock: number | null
          id: string
          last_count_date: string | null
          level: string
          max_replenish_qty: number | null
          max_volume: number | null
          max_weight: number | null
          min_replenish_qty: number | null
          occupied: number
          pick_sequence: number | null
          picking_zone: boolean | null
          position: string
          position_type: string | null
          rack: string
          restriction_rules: Json | null
          storage_category: string | null
          street: string | null
          subzone: string | null
          type: string
          updated_at: string | null
          warehouse_id: string | null
          zone: string
          zone_id: string | null
        }
        Insert: {
          abc_class?: string | null
          active?: boolean
          aisle: string
          capacity?: number
          code: string
          column_pos?: string | null
          company_id?: string
          created_at?: string
          current_volume?: number | null
          current_weight?: number | null
          distance_to_dock?: number | null
          id?: string
          last_count_date?: string | null
          level: string
          max_replenish_qty?: number | null
          max_volume?: number | null
          max_weight?: number | null
          min_replenish_qty?: number | null
          occupied?: number
          pick_sequence?: number | null
          picking_zone?: boolean | null
          position?: string
          position_type?: string | null
          rack: string
          restriction_rules?: Json | null
          storage_category?: string | null
          street?: string | null
          subzone?: string | null
          type?: string
          updated_at?: string | null
          warehouse_id?: string | null
          zone: string
          zone_id?: string | null
        }
        Update: {
          abc_class?: string | null
          active?: boolean
          aisle?: string
          capacity?: number
          code?: string
          column_pos?: string | null
          company_id?: string
          created_at?: string
          current_volume?: number | null
          current_weight?: number | null
          distance_to_dock?: number | null
          id?: string
          last_count_date?: string | null
          level?: string
          max_replenish_qty?: number | null
          max_volume?: number | null
          max_weight?: number | null
          min_replenish_qty?: number | null
          occupied?: number
          pick_sequence?: number | null
          picking_zone?: boolean | null
          position?: string
          position_type?: string | null
          rack?: string
          restriction_rules?: Json | null
          storage_category?: string | null
          street?: string | null
          subzone?: string | null
          type?: string
          updated_at?: string | null
          warehouse_id?: string | null
          zone?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_storage_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_storage_locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_task_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          details: Json | null
          duration_seconds: number | null
          id: string
          location_code: string | null
          operator: string | null
          operator_id: string | null
          product_code: string | null
          quantity: number | null
          task_id: string | null
          task_number: string | null
          task_type: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          duration_seconds?: number | null
          id?: string
          location_code?: string | null
          operator?: string | null
          operator_id?: string | null
          product_code?: string | null
          quantity?: number | null
          task_id?: string | null
          task_number?: string | null
          task_type: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          duration_seconds?: number | null
          id?: string
          location_code?: string | null
          operator?: string | null
          operator_id?: string | null
          product_code?: string | null
          quantity?: number | null
          task_id?: string | null
          task_number?: string | null
          task_type?: string
        }
        Relationships: []
      }
      wms_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          completed_by: string | null
          completed_qty: number | null
          created_at: string
          from_location_code: string | null
          from_location_id: string | null
          id: string
          instructions: string | null
          lot_number: string | null
          notes: string | null
          priority: number
          product_code: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          reference_id: string | null
          reference_type: string | null
          started_at: string | null
          status: string
          task_number: string
          task_type: string
          to_location_code: string | null
          to_location_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completed_qty?: number | null
          created_at?: string
          from_location_code?: string | null
          from_location_id?: string | null
          id?: string
          instructions?: string | null
          lot_number?: string | null
          notes?: string | null
          priority?: number
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          reference_id?: string | null
          reference_type?: string | null
          started_at?: string | null
          status?: string
          task_number: string
          task_type: string
          to_location_code?: string | null
          to_location_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completed_qty?: number | null
          created_at?: string
          from_location_code?: string | null
          from_location_id?: string | null
          id?: string
          instructions?: string | null
          lot_number?: string | null
          notes?: string | null
          priority?: number
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          reference_id?: string | null
          reference_type?: string | null
          started_at?: string | null
          status?: string
          task_number?: string
          task_type?: string
          to_location_code?: string | null
          to_location_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wms_waves: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          priority: number | null
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          priority?: number | null
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          priority?: number | null
          status?: string | null
        }
        Relationships: []
      }
      work_centers: {
        Row: {
          capacity: number
          code: string
          company_id: string | null
          created_at: string
          current_load: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          code: string
          company_id?: string | null
          created_at?: string
          current_load?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          code?: string
          company_id?: string | null
          created_at?: string
          current_load?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_definitions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          initial_step: string | null
          is_active: boolean
          name: string
          steps: Json
          target_entity: string
          updated_at: string
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          initial_step?: string | null
          is_active?: boolean
          name: string
          steps?: Json
          target_entity: string
          updated_at?: string
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          initial_step?: string | null
          is_active?: boolean
          name?: string
          steps?: Json
          target_entity?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          company_id: string
          completed_at: string | null
          context: Json
          created_at: string
          current_step: string | null
          definition_id: string
          id: string
          started_by: string | null
          status: string
          target_entity: string
          target_record_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          context?: Json
          created_at?: string
          current_step?: string | null
          definition_id: string
          id?: string
          started_by?: string | null
          status?: string
          target_entity: string
          target_record_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          context?: Json
          created_at?: string
          current_step?: string | null
          definition_id?: string
          id?: string
          started_by?: string | null
          status?: string
          target_entity?: string
          target_record_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_transitions: {
        Row: {
          actor_id: string | null
          comment: string | null
          company_id: string
          created_at: string
          from_step: string | null
          id: string
          instance_id: string
          payload: Json
          to_step: string
        }
        Insert: {
          actor_id?: string | null
          comment?: string | null
          company_id: string
          created_at?: string
          from_step?: string | null
          id?: string
          instance_id: string
          payload?: Json
          to_step: string
        }
        Update: {
          actor_id?: string | null
          comment?: string | null
          company_id?: string
          created_at?: string
          from_step?: string | null
          id?: string
          instance_id?: string
          payload?: Json
          to_step?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_current_account: {
        Row: {
          balance: number | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          credit: number | null
          date: string | null
          debit: number | null
          description: string | null
          document_id: string | null
          document_type: string | null
          invoice_number: string | null
          status: string | null
        }
        Insert: {
          balance?: never
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          credit?: never
          date?: string | null
          debit?: number | null
          description?: string | null
          document_id?: string | null
          document_type?: never
          invoice_number?: string | null
          status?: string | null
        }
        Update: {
          balance?: never
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          credit?: never
          date?: string | null
          debit?: number | null
          description?: string | null
          document_id?: string | null
          document_type?: never
          invoice_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_current_account: {
        Row: {
          balance: number | null
          created_at: string | null
          credit: number | null
          date: string | null
          debit: number | null
          description: string | null
          document_id: string | null
          document_type: string | null
          invoice_number: string | null
          status: string | null
          supplier_name: string | null
        }
        Insert: {
          balance?: never
          created_at?: string | null
          credit?: never
          date?: string | null
          debit?: number | null
          description?: string | null
          document_id?: string | null
          document_type?: never
          invoice_number?: string | null
          status?: string | null
          supplier_name?: string | null
        }
        Update: {
          balance?: never
          created_at?: string | null
          credit?: never
          date?: string | null
          debit?: number | null
          description?: string | null
          document_id?: string | null
          document_type?: never
          invoice_number?: string | null
          status?: string | null
          supplier_name?: string | null
        }
        Relationships: []
      }
      v_current_usage: {
        Row: {
          company_id: string | null
          current_value: number | null
          limit_value: number | null
          metric: string | null
          period: string | null
          updated_at: string | null
          usage_percent: number | null
        }
        Insert: {
          company_id?: string | null
          current_value?: number | null
          limit_value?: number | null
          metric?: string | null
          period?: string | null
          updated_at?: string | null
          usage_percent?: never
        }
        Update: {
          company_id?: string | null
          current_value?: number | null
          limit_value?: number | null
          metric?: string | null
          period?: string | null
          updated_at?: string | null
          usage_percent?: never
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
      vw_organizational_hierarchy: {
        Row: {
          company_id: string | null
          depth: number | null
          enterprise_group_id: string | null
          group_id: string | null
          group_name: string | null
          level: string | null
          parent_id: string | null
          tenant_id: string | null
          tenant_name: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_match_bank_transactions: {
        Args: { p_bank_account_id?: string; p_tolerance_days?: number }
        Returns: {
          matched: number
          total_pending: number
        }[]
      }
      backfill_default_lots: { Args: never; Returns: Json }
      batch_pay_payables: {
        Args: {
          _bank_account_id: string
          _notes?: string
          _payable_ids: string[]
          _payment_date?: string
          _payment_method: string
        }
        Returns: Json
      }
      bootstrap_tenant: {
        Args: {
          _address_city: string
          _address_neighborhood: string
          _address_number: string
          _address_state: string
          _address_street: string
          _address_zip: string
          _cnpj: string
          _company_name: string
          _email?: string
          _phone?: string
          _segment: string
        }
        Returns: Json
      }
      calculate_difal: {
        Args: { _base: number; _uf_destination: string; _uf_origin: string }
        Returns: Json
      }
      calculate_financial_health_score: { Args: never; Returns: Json }
      calculate_icms_st: {
        Args: {
          _base: number
          _icms_value: number
          _ncm: string
          _uf_destination: string
          _uf_origin: string
        }
        Returns: Json
      }
      calculate_nfe_item_taxes: {
        Args: {
          _cfop: string
          _discount?: number
          _ncm: string
          _quantity: number
          _uf_destination?: string
          _uf_origin?: string
          _unit_price: number
        }
        Returns: Json
      }
      check_hierarchy_access: {
        Args: { _target_company_id: string; _user_id: string }
        Returns: boolean
      }
      check_quota: {
        Args: { _company_id: string; _metric: string }
        Returns: Json
      }
      cleanup_expired_deleted_orders: { Args: never; Returns: undefined }
      close_accounting_period: {
        Args: { _month: number; _year: number }
        Returns: Json
      }
      compensate_accounts: {
        Args: {
          _amount: number
          _notes?: string
          _payable_id: string
          _receivable_id: string
        }
        Returns: Json
      }
      compensate_check: {
        Args: {
          _bank_account_id?: string
          _check_id: string
          _clear_date?: string
        }
        Returns: Json
      }
      current_billing_period: { Args: never; Returns: string }
      detect_cashflow_risks: { Args: never; Returns: Json }
      detect_financial_alerts: { Args: never; Returns: Json }
      evaluate_transaction_risk: {
        Args: {
          _amount: number
          _entity_id?: string
          _entity_type?: string
          _payment_method?: string
          _source?: string
        }
        Returns: Json
      }
      fn_emit_automation_event: {
        Args: { _company_id: string; _context: Json; _event: string }
        Returns: undefined
      }
      generate_recurring_entries: { Args: never; Returns: Json }
      generate_sped_contribuicoes: {
        Args: { p_end: string; p_start: string }
        Returns: {
          content: string
          total_records: number
          total_value: number
        }[]
      }
      generate_sped_fiscal: {
        Args: { p_end: string; p_start: string }
        Returns: {
          content: string
          total_records: number
          total_value: number
        }[]
      }
      get_account_statement: {
        Args: {
          _entity_id: string
          _entity_type: string
          _from?: string
          _to?: string
        }
        Returns: {
          amount: number
          category: string
          description: string
          entry_date: string
          kind: string
          reference: string
          running_balance: number
        }[]
      }
      get_cashflow_scenarios: {
        Args: { _days?: number }
        Returns: {
          balance_optimistic: number
          balance_pessimistic: number
          balance_real: number
          day: string
          inflow_optimistic: number
          inflow_real: number
          outflow_pessimistic: number
          outflow_real: number
        }[]
      }
      get_consolidated_company_ids: {
        Args: { _company_id: string }
        Returns: {
          id: string
        }[]
      }
      get_consolidated_revenue: {
        Args: {
          _company_id?: string
          _end_date?: string
          _group_id?: string
          _start_date?: string
          _tenant_id?: string
        }
        Returns: {
          entity_id: string
          entity_name: string
          orders_count: number
          total_revenue: number
        }[]
      }
      get_current_plan: {
        Args: never
        Returns: {
          ai_calls_per_month: number
          allowed_modules: string[]
          max_branches: number
          max_companies: number
          max_orders_month: number
          max_users: number
          nfe_per_month: number
          plan_id: string
          plan_name: string
          plan_slug: string
          storage_mb: number
          subscription_status: string
          trial_end: string
        }[]
      }
      get_dre: {
        Args: { _from: string; _to: string }
        Returns: {
          category_id: string
          category_name: string
          section: string
          total: number
        }[]
      }
      get_dre_dynamic: {
        Args: {
          _channel?: string
          _cost_center_id?: string
          _from: string
          _to: string
        }
        Returns: {
          category_id: string
          category_name: string
          section: string
          total: number
        }[]
      }
      get_dre_summary: {
        Args: { _from: string; _to: string }
        Returns: {
          section: string
          total: number
        }[]
      }
      get_headquarters_branch: {
        Args: { _company_id: string }
        Returns: string
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_branch_access: { Args: { _branch_id: string }; Returns: boolean }
      has_module_access: { Args: { _module_key: string }; Returns: boolean }
      has_permission: {
        Args: {
          _action: string
          _company_id: string
          _resource: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _company_id: string
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
        | {
            Args: { _company_id: string; _role: string; _user_id: string }
            Returns: boolean
          }
      import_bank_statement_batch: {
        Args: { p_bank_account_id: string; p_transactions: Json }
        Returns: {
          inserted: number
          skipped: number
        }[]
      }
      increment_usage: {
        Args: { _company_id: string; _delta?: number; _metric: string }
        Returns: number
      }
      manual_match_transaction: {
        Args: { p_bank_transaction_id: string; p_ledger_entry_id: string }
        Returns: boolean
      }
      match_bank_transaction: { Args: { _bank_tx_id: string }; Returns: Json }
      process_charges_ruler: { Args: never; Returns: Json }
      process_pix_payment: {
        Args: {
          _e2e_id: string
          _payer_doc: string
          _payer_name: string
          _pix_charge_id: string
        }
        Returns: Json
      }
      recalc_bank_balance: {
        Args: { _bank_account_id: string }
        Returns: number
      }
      recompute_default_scores: { Args: never; Returns: Json }
      reopen_accounting_period: {
        Args: { _month: number; _year: number }
        Returns: Json
      }
      resolve_accounting_pair: {
        Args: {
          _bank_account_id: string
          _category_id: string
          _chart_account_id: string
          _ledger_type: string
        }
        Returns: {
          cash_account_id: string
          cash_code: string
          cash_name: string
          result_account_id: string
          result_code: string
          result_name: string
        }[]
      }
      reverse_settlement: {
        Args: { _reason?: string; _settlement_id: string }
        Returns: Json
      }
      run_financial_audit: { Args: { _mode?: string }; Returns: Json }
      settle_account: {
        Args: {
          _discount?: number
          _interest?: number
          _notes?: string
          _penalty?: number
          _settlement_date?: string
          _source_id: string
          _source_type: string
          _splits: Json
        }
        Returns: Json
      }
      suggest_category: {
        Args: { _party_kind: string; _party_name: string }
        Returns: {
          category_id: string
          category_name: string
          confidence: number
          usage_count: number
        }[]
      }
      transfer_between_accounts: {
        Args: {
          _amount: number
          _description?: string
          _from_account: string
          _to_account: string
        }
        Returns: Json
      }
      update_entity_risk_profile: {
        Args: {
          _amount: number
          _entity_id: string
          _entity_label: string
          _entity_type: string
          _is_anomaly?: boolean
        }
        Returns: undefined
      }
      use_advance: {
        Args: {
          _advance_id: string
          _amount: number
          _notes?: string
          _source_id: string
          _source_type: string
        }
        Returns: Json
      }
      validate_lot_stock_consistency: {
        Args: never
        Returns: {
          diff: number
          lot_sum: number
          product_code: string
          product_id: string
          stock_balance: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "operator"
        | "viewer"
        | "diretor"
        | "financeiro"
        | "fiscal"
        | "contabil"
        | "compras"
        | "producao"
        | "logistica"
        | "comercial"
        | "loja"
        | "franquia"
      enterprise_tier: "small" | "medium" | "enterprise"
      org_type: "holding" | "company" | "branch" | "unit"
      tax_regime: "simples" | "presumed" | "real"
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
        "admin",
        "manager",
        "operator",
        "viewer",
        "diretor",
        "financeiro",
        "fiscal",
        "contabil",
        "compras",
        "producao",
        "logistica",
        "comercial",
        "loja",
        "franquia",
      ],
      enterprise_tier: ["small", "medium", "enterprise"],
      org_type: ["holding", "company", "branch", "unit"],
      tax_regime: ["simples", "presumed", "real"],
    },
  },
} as const
