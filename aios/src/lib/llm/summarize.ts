/*
 * Conversation summarizer. Reuses whatever LLM provider is configured to pull
 * durable, reusable knowledge out of a chat so the Company Brain can store it.
 * Returns null when there's nothing worth saving.
 */
import type { LLMProvider, ChatTurn } from "./types";

async function complete(provider: LLMProvider, system: string, userText: string) {
  let out = "";
  for await (const chunk of provider.streamChat({
    system,
    messages: [{ role: "user", text: userText }],
  })) {
    out += chunk;
  }
  return out.trim();
}

export async function summarizeConversation(
  provider: LLMProvider,
  agentName: string,
  turns: ChatTurn[],
): Promise<string | null> {
  const transcript = turns
    .map((t) => `${t.role === "user" ? "Founder" : agentName}: ${t.text}`)
    .join("\n");

  const system =
    "You extract durable, reusable knowledge from a conversation for a company's shared memory. " +
    "Read the transcript and output 1-3 short bullet points (each starting with \"- \") capturing " +
    "decisions, facts, or preferences worth remembering long-term. Omit greetings, small talk, and " +
    "anything transient. Be concise. If nothing is worth saving, reply with exactly: NONE";

  const out = await complete(provider, system, `Conversation with ${agentName}:\n\n${transcript}`);
  if (!out || /^none[.!]?$/i.test(out.trim())) return null;
  return out.trim();
}
