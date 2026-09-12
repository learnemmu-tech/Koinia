import "server-only";

import { GoogleGenAI, ThinkingLevel } from "@google/genai";

import { env } from "@/lib/env";

export type ShepherdChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Hard cap for a single Shepherd generation (ms). */
export const SHEPHERD_STREAM_TIMEOUT_MS = 45_000;

export const SHEPHERD_INTERRUPTED_MESSAGE =
  "Shepherd was temporarily interrupted. You can try again.";

export const SHEPHERD_TIMEOUT_MESSAGE =
  "Shepherd is taking too long to respond. Please try again.";

export const SHEPHERD_UNAVAILABLE_MESSAGE =
  "Shepherd is temporarily unavailable because Gemini is experiencing high demand. Please try again in a moment.";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Single source of truth for the Shepherd model id. */
export function getShepherdModel(): string {
  return env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
}

export function isShepherdConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim());
}

/**
 * Convert Shepherd/OpenAI-style chat turns into Gemini contents.
 * Gemini uses roles `user` | `model` (not `assistant`).
 */
export function toGeminiContents(messages: ShepherdChatMessage[]) {
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }> = [];

  for (const message of messages) {
    const text = message.content.trim();
    if (!text) continue;

    const role = message.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0]!.text += `\n\n${text}`;
      continue;
    }

    contents.push({
      role,
      parts: [{ text }],
    });
  }

  // Gemini expects the first turn to be from the user.
  if (contents[0]?.role === "model") {
    contents.unshift({
      role: "user",
      parts: [{ text: "Please continue helping within your Shepherd role." }],
    });
  }

  return contents;
}

export function isGeminiProviderError(error: unknown): {
  quota: boolean;
  auth: boolean;
  unavailable: boolean;
} {
  const err = error as {
    status?: number;
    code?: number | string;
    message?: string;
    error?: { code?: number | string; status?: string; message?: string };
  };

  let nestedCode: number | undefined;
  let nestedStatus = "";
  let nestedMessage = "";
  const rawMessage = err.message ?? "";

  // Gemini often nests JSON: {"error":{"message":"{\n  \"error\": { ... }}","code":503}}
  try {
    const outer = JSON.parse(rawMessage) as {
      error?: { message?: string; code?: number; status?: string };
    };
    if (typeof outer.error?.code === "number") nestedCode = outer.error.code;
    if (outer.error?.status) nestedStatus = outer.error.status;
    if (typeof outer.error?.message === "string") {
      nestedMessage = outer.error.message;
      try {
        const inner = JSON.parse(outer.error.message) as {
          error?: { code?: number; status?: string; message?: string };
        };
        if (typeof inner.error?.code === "number") nestedCode = inner.error.code;
        if (inner.error?.status) nestedStatus = inner.error.status;
        if (inner.error?.message) nestedMessage = inner.error.message;
      } catch {
        // outer.error.message was plain text
      }
    }
  } catch {
    // message was not JSON
  }

  const status =
    err.status ??
    nestedCode ??
    (typeof err.code === "number" ? err.code : undefined);
  const code = String(err.code ?? err.error?.code ?? nestedCode ?? "").toUpperCase();
  const statusText = String(
    err.error?.status ?? nestedStatus ?? ""
  ).toUpperCase();
  const message =
    `${rawMessage} ${err.error?.message ?? ""} ${nestedMessage}`.toLowerCase();

  const unavailable =
    status === 503 ||
    code.includes("UNAVAILABLE") ||
    statusText.includes("UNAVAILABLE") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("service unavailable");

  const quota =
    status === 429 ||
    code.includes("RESOURCE_EXHAUSTED") ||
    statusText.includes("RESOURCE_EXHAUSTED") ||
    message.includes("resource exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit");

  const auth =
    status === 401 ||
    status === 403 ||
    code.includes("API_KEY") ||
    statusText.includes("UNAUTHENTICATED") ||
    statusText.includes("PERMISSION_DENIED") ||
    message.includes("api key") ||
    message.includes("unauthenticated") ||
    message.includes("permission denied");

  return { quota, auth, unavailable };
}

export function friendlyShepherdStreamError(
  error: unknown,
  hadTokens: boolean
): string {
  if (hadTokens) {
    return SHEPHERD_INTERRUPTED_MESSAGE;
  }

  const { quota, auth, unavailable } = isGeminiProviderError(error);
  if (unavailable) {
    return SHEPHERD_UNAVAILABLE_MESSAGE;
  }
  if (quota) {
    return "Shepherd AI is temporarily unavailable. Please try again later.";
  }
  if (auth) {
    return "Shepherd AI is not configured correctly. Please try again later.";
  }
  return "Shepherd could not respond right now. Please try again in a moment.";
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function combineAbortSignals(
  ...signals: AbortSignal[]
): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const cleanups: Array<() => void> = [];

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    const onAbort = () => {
      if (!controller.signal.aborted) {
        controller.abort(signal.reason);
      }
    };
    signal.addEventListener("abort", onAbort);
    cleanups.push(() => signal.removeEventListener("abort", onAbort));
  }

  return {
    signal: controller.signal,
    dispose: () => {
      for (const cleanup of cleanups) cleanup();
    },
  };
}

/**
 * Real Gemini token stream — yields text deltas as the model generates them.
 * At most one short retry for transient 503/UNAVAILABLE before any tokens.
 * Never retries after tokens have started (preserves partial responses).
 */
export async function* streamShepherdCompletion(input: {
  systemInstruction: string;
  messages: ShepherdChatMessage[];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, undefined> {
  const ai = getGeminiClient();
  const contents = toGeminiContents(input.messages);

  if (!contents.length) {
    throw new Error("A user message is required.");
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    let yielded = false;
    try {
      const stream = await ai.models.generateContentStream({
        model: getShepherdModel(),
        contents,
        config: {
          systemInstruction: input.systemInstruction,
          temperature: 0.5,
          maxOutputTokens: 1600,
          // Gemini 3.x defaults to thoughtful generation; keep it minimal for TTFT.
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
            includeThoughts: false,
          },
          abortSignal: input.signal,
        },
      });

      for await (const chunk of stream) {
        if (input.signal?.aborted) return;

        // Prefer non-thought parts so thinking tokens never delay visible text.
        const parts = chunk.candidates?.[0]?.content?.parts;
        let emitted = false;
        if (Array.isArray(parts) && parts.length > 0) {
          for (const part of parts) {
            if (!part || typeof part !== "object") continue;
            if ("thought" in part && part.thought) continue;
            const text =
              "text" in part && typeof part.text === "string" ? part.text : "";
            if (text) {
              emitted = true;
              yielded = true;
              yield text;
            }
          }
        }

        if (!emitted) {
          const text = typeof chunk.text === "string" ? chunk.text : "";
          if (text) {
            yielded = true;
            yield text;
          }
        }
      }
      return;
    } catch (error) {
      lastError = error;
      if (input.signal?.aborted) throw error;

      const { unavailable } = isGeminiProviderError(error);
      // Only one quick retry, and only if nothing was streamed yet.
      if (!unavailable || yielded || attempt === 1) {
        throw error;
      }

      await sleep(750, input.signal);
    }
  }

  throw lastError;
}

export { combineAbortSignals };
