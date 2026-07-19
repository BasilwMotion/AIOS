/* Google Gemini provider. Works with a FREE Google AI Studio API key. */
import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, StreamChatInput } from "./types";

export function createGeminiProvider(
  apiKey: string,
  model: string,
): LLMProvider {
  const ai = new GoogleGenAI({ apiKey });

  return {
    label: `Gemini (${model})`,
    async *streamChat({ system, messages }: StreamChatInput) {
      // Gemini uses "model" for the assistant role and expects { role, parts }.
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: { systemInstruction: system },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) yield text;
      }
    },
  };
}
