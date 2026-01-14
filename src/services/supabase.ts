import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseClient(url?: string, anonKey?: string): SupabaseClient {
  const config = getConfig();
  const supabaseUrl = url || config.supabaseUrl;
  const supabaseAnonKey = anonKey || config.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}

export class SupabaseService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getSupabaseClient();
  }

  // ===== Auth Methods =====
  async signInWithEmail(email: string) {
    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    return { data, error };
  }

  async verifyOtp(email: string, token: string) {
    const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    return { error };
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    return { session: data.session, error };
  }

  async getUser() {
    const { data, error } = await this.client.auth.getUser();
    return { user: data.user, error };
  }

  // ===== User Profile Methods =====
  async getUserProfile(userId: string) {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  }

  async updateUserProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await this.client
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  }

  // ===== Transaction Methods =====
  async getTransactions(userId: string, limit = 50) {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  }

  async createTransaction(transaction: Record<string, any>) {
    const { data, error } = await this.client
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    return { data, error };
  }

  // ===== AI Trading Methods =====
  async getStrategies(status = 'active') {
    const { data, error } = await this.client
      .from('ai_strategies')
      .select('*')
      .eq('status', status)
      .order('total_aum', { ascending: false });
    return { data, error };
  }

  async getStrategyById(strategyId: string) {
    const { data, error } = await this.client
      .from('ai_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();
    return { data, error };
  }

  async getUserOrders(userId: string) {
    const { data, error } = await this.client
      .from('ai_orders')
      .select(`*, ai_strategies (name)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async createOrder(order: Record<string, any>) {
    const { data, error } = await this.client
      .from('ai_orders')
      .insert(order)
      .select()
      .single();
    return { data, error };
  }

  // ===== Card Methods =====
  async getUserCards(userId: string) {
    const { data, error } = await this.client
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  // ===== Realtime Subscriptions =====
  subscribeToTransactions(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }

  unsubscribe(channel: ReturnType<typeof this.client.channel>) {
    return this.client.removeChannel(channel);
  }
}
