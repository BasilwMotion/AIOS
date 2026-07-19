/*
 * Agent-to-agent messages (Supabase). Each agent has an inbox (messages where
 * to_agent = their id). A message can later be converted into a task (task_id).
 */
import { getServerSupabase } from "./supabase";

export type Message = {
  id: string;
  from_agent: string;
  to_agent: string;
  body: string;
  read: boolean;
  task_id: string | null;
  created_at: string;
};

export async function getMessage(id: string): Promise<Message | null> {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("aios_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Message) ?? null;
}

export async function listInbox(agentId: string): Promise<Message[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_messages")
    .select("*")
    .eq("to_agent", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(
  fromAgent: string,
  toAgent: string,
  body: string,
): Promise<Message> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_messages")
    .insert({ from_agent: fromAgent, to_agent: toAgent, body })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

export async function markRead(id: string): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb.from("aios_messages").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function setMessageTask(id: string, taskId: string): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb.from("aios_messages").update({ task_id: taskId }).eq("id", id);
  if (error) throw error;
}
