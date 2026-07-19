/*
 * Service-role Supabase client. Bypasses RLS — use ONLY in trusted server
 * contexts with no user session (the scheduled-job runner / cron). Never
 * import this from client code. Returns null if SUPABASE_SERVICE_ROLE_KEY
 * isn't set, so automation degrades gracefully under tightened RLS.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./supabase";

let cached: SupabaseClient | null = null;

export function serviceConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getServiceSupabase(): SupabaseClient | null {
  if (!serviceConfigured()) return null;
  if (!cached) {
    cached = createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
      auth: { persistSession: false },
    });
  }
  return cached;
}
