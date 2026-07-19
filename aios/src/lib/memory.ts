/*
 * Company memory data access (Supabase). User routes run as the logged-in user
 * (default client); the scheduled-job runner passes the service client via `db`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "./supabase";

export type SharedMemory = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  source: string; // 'manual' | 'summary'
  created_by: string;
  created_at: string;
};

export type PrivateMemory = {
  id: string;
  agent_id: string;
  content: string;
  created_at: string;
};

export async function listSharedMemory(db?: SupabaseClient): Promise<SharedMemory[]> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_shared_memory")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SharedMemory[];
}

export async function addSharedMemory(
  input: {
    title?: string | null;
    content: string;
    tags?: string[];
    source?: string;
    created_by?: string;
  },
  db?: SupabaseClient,
): Promise<SharedMemory> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_shared_memory")
    .insert({
      title: input.title ?? null,
      content: input.content,
      tags: input.tags ?? [],
      source: input.source ?? "manual",
      created_by: input.created_by ?? "founder",
    })
    .select()
    .single();
  if (error) throw error;
  return data as SharedMemory;
}

export async function listPrivateMemory(
  agentId: string,
  db?: SupabaseClient,
): Promise<PrivateMemory[]> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_private_memory")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PrivateMemory[];
}

export async function addPrivateMemory(agentId: string, content: string): Promise<PrivateMemory> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_private_memory")
    .insert({ agent_id: agentId, content })
    .select()
    .single();
  if (error) throw error;
  return data as PrivateMemory;
}
