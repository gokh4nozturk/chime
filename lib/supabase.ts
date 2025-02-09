import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Subscription {
  id: string;
  created_at: string;
  user_id: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  preferences: {
    start_hour: number;
    end_hour: number;
    sound_enabled: boolean;
    vibration_enabled: boolean;
  };
} 