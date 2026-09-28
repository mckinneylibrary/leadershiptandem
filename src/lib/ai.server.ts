import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/**
 * Runs one AI request. Self-hosters can point this at any OpenAI-compatible
 * Responses endpoint with AI_BASE_URL / AI_API_KEY / AI_MODEL.
 */
export async function runAI(system: string, prompt: string): Promise<string> {
  const baseURL = process.env["AI_BASE_URL"] || GATEWAY;
  const apiKey = process.env["AI_API_KEY"] || process.env["LOVABLE_API_KEY"];
  const model = process.env["AI_MODEL"] || "openai/gpt-6-astra";
  if (!apiKey) throw new Error("AI is not configured on this server.");

  const usingGateway = baseURL === GATEWAY;
  const provider = createOpenAI({
    baseURL,
    apiKey,
    headers: usingGateway ? { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } : {},
  });

  let failure: unknown = null;
  const result = streamText({
    model: provider.responses(model),
    system,
    prompt,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    failure = failure ?? e;
  }
  if (failure) {
    const status = (failure as { statusCode?: number }).statusCode;
    if (status === 402) throw new Error("AI credits have run out for this workspace.");
    if (status === 429) throw new Error("AI is busy right now. Please try again in a minute.");
    throw new Error("The AI request failed. Please try again later.");
  }
  return text.trim();
}
