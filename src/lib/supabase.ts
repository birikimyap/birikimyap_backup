import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nbgqlphoqvxcxflxuymj.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_VRfESCgFlR8AarqXYIC5ng_bmvTEVsn';

export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  !supabaseUrl.includes('YOUR_SUPABASE') && 
  Boolean(supabaseAnonKey) && 
  !supabaseAnonKey.includes('YOUR_SUPABASE');

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = {
  get auth() {
    const client = getSupabase();
    if (!client) {
      return {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithOAuth: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signInWithIdToken: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        setSession: async () => ({ data: { session: null, user: null }, error: null }),
        exchangeCodeForSession: async () => ({ data: { session: null, user: null }, error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => {},
      };
    }
    return client.auth;
  },
  from(table: string): any {
    const client = getSupabase();
    if (!client) {
      const mockQuery: any = {
        upsert: async () => ({ data: null, error: null }),
        select: () => mockQuery,
        eq: () => mockQuery,
        single: async () => ({ data: null, error: null }),
      };
      return mockQuery;
    }
    return client.from(table);
  }
};
