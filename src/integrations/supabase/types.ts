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
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          supplier: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          supplier: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          supplier?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts_receivable: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          client_name: string
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          client_id?: string | null
          client_name: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
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
      clients: {
        Row: {
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          cellphone: string | null
          code: string
          created_at: string
          credit_limit: number
          current_balance: number
          document: string
          document_type: string
          email: string
          id: string
          name: string
          phone: string
          sales_rep_id: string | null
          segment: string | null
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
          cellphone?: string | null
          code: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          document: string
          document_type?: string
          email: string
          id?: string
          name: string
          phone: string
          sales_rep_id?: string | null
          segment?: string | null
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
          cellphone?: string | null
          code?: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          document?: string
          document_type?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          sales_rep_id?: string | null
          segment?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
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
      orders: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          date: string
          delivery_date: string | null
          discount: number
          id: string
          notes: string | null
          number: string
          payment_condition: string
          payment_method: string
          priority: string
          sales_rep_id: string | null
          sales_rep_name: string | null
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          date?: string
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number: string
          payment_condition?: string
          payment_method?: string
          priority?: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          date?: string
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          payment_condition?: string
          payment_method?: string
          priority?: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
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
      production_orders: {
        Row: {
          bom_id: string | null
          completed_date: string | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          operator: string | null
          order_number: string
          priority: string
          produced_quantity: number
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          route_id: string | null
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
          id?: string
          notes?: string | null
          operator?: string | null
          order_number: string
          priority?: string
          produced_quantity?: number
          product_code: string
          product_id?: string | null
          product_name: string
          quantity?: number
          route_id?: string | null
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
          id?: string
          notes?: string | null
          operator?: string | null
          order_number?: string
          priority?: string
          produced_quantity?: number
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          route_id?: string | null
          start_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
