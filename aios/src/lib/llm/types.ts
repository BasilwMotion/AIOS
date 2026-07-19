/*
 * Provider-agnostic LLM layer.
 * The concrete provider (Gemini) implements `LLMProvider`. The rest of the app
 * only ever imports through `./index`, never a provider directly — so swapping
 * or adding a provider touches one file.
 */

/** A single turn in the live conversation. */
export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

export type StreamChatInput = {
  /** System prompt describing the agent's identity/persona. */
  system: string;
  /** The conversation so far, oldest first, ending with the latest user turn. */
  messages: ChatTurn[];
};

export interface LLMProvider {
  /** Human-readable label, e.g. "Gemini (gemini-2.0-flash)". */
  label: string;
  /** Streams the assistant reply as incremental text chunks. */
  streamChat(input: StreamChatInput): AsyncIterable<string>;
}

/** What the UI needs to know without ever seeing the key. */
export type LLMStatus = {
  configured: boolean;
  provider: string | null;
};
