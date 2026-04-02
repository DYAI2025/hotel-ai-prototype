// Auto-generated types for the hotel-ai-prototype Supabase schema.
// Regenerate after schema changes with:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          hotel_id: string
          name: string
          plan: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          name: string
          plan?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      knowledge_bases: {
        Row: {
          id: string
          account_id: string
          hotel_id: string
          name: string
          language: string
          tone: string
          agent_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          hotel_id: string
          name?: string
          language?: string
          tone?: string
          agent_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['knowledge_bases']['Insert']>
      }
      documents: {
        Row: {
          id: string
          knowledge_base_id: string
          hotel_id: string
          category: string
          title: string
          content: string
          language: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          knowledge_base_id: string
          hotel_id: string
          category: string
          title: string
          content: string
          language?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          hotel_id: string
          account_id: string
          guest_name: string | null
          guest_room: string | null
          language: string
          channel: string
          status: string
          escalation_level: number
          started_at: string
          last_message_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          hotel_id: string
          account_id: string
          guest_name?: string | null
          guest_room?: string | null
          language?: string
          channel?: string
          status?: string
          escalation_level?: number
          started_at?: string
          last_message_at?: string
          resolved_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          hotel_id: string
          role: 'user' | 'assistant'
          content: string
          intent: string | null
          escalation: string
          language: string
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          hotel_id: string
          role: 'user' | 'assistant'
          content: string
          intent?: string | null
          escalation?: string
          language?: string
          tokens_used?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      usage: {
        Row: {
          id: string
          hotel_id: string
          account_id: string
          date: string
          input_tokens: number
          output_tokens: number
          total_tokens: number
          message_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          account_id: string
          date?: string
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          message_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['usage']['Insert']>
      }
      knowledge_gaps: {
        Row: {
          id: string
          hotel_id: string
          account_id: string
          question: string
          language: string
          frequency: number
          last_seen_at: string
          resolved: boolean
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          account_id: string
          question: string
          language?: string
          frequency?: number
          last_seen_at?: string
          resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['knowledge_gaps']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
