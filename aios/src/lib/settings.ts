/* Company settings (single row). run_overnight actually gates the cron. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "./supabase";

export type Settings = {
  company_name: string;
  run_overnight: boolean;
  require_review: boolean;
  daily_digest: boolean;
};

const DEFAULTS: Settings = {
  company_name: "My AI Company",
  run_overnight: true,
  require_review: true,
  daily_digest: false,
};

export async function getSettings(db?: SupabaseClient): Promise<Settings> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) return DEFAULTS;
  const { data, error } = await sb
    .from("aios_settings")
    .select("*")
    .eq("id", "singleton")
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULTS;
  return {
    company_name: data.company_name ?? DEFAULTS.company_name,
    run_overnight: data.run_overnight ?? DEFAULTS.run_overnight,
    require_review: data.require_review ?? DEFAULTS.require_review,
    daily_digest: data.daily_digest ?? DEFAULTS.daily_digest,
  };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_settings")
    .upsert({ id: "singleton", ...patch, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as Settings;
}
