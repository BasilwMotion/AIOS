/*
 * LLM provider selection. Gemini is the only provider — it works with a FREE
 * Google AI Studio key, so the chatbot is the one and only thing in AIOS that
 * needs an API key. Everything else runs on your own Supabase data.
 *
 * Server-only env (never bundled into the browser):
 *   GEMINI_API_KEY (or GOOGLE_API_KEY)  free Gemini key
 *   AIOS_GEMINI_MODEL                   default: gemini-2.0-flash
 *
 * If no key is present, getProvider() returns null and the chat stays disabled.
 */
import type { LLMProvider, LLMStatus } from "./types";
import { createGeminiProvider } from "./gemini";

function geminiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim() || "";
}

let cached: { key: string; provider: LLMProvider } | null = null;

export function getProvider(): LLMProvider | null {
  const key = geminiKey();
  if (!key) {
    cached = null;
    return null;
  }

  // Cache per key so we don't rebuild a client every request.
  if (cached?.key === key) return cached.provider;

  const provider = createGeminiProvider(
    key,
    process.env.AIOS_GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  );

  cached = { key, provider };
  return provider;
}

export function getLLMStatus(): LLMStatus {
  const provider = getProvider();
  return {
    configured: provider !== null,
    provider: provider?.label ?? null,
  };
}
