import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  SHEPHERD_INTERRUPTED_MESSAGE,
  SHEPHERD_STREAM_TIMEOUT_MS,
  SHEPHERD_TIMEOUT_MESSAGE,
  combineAbortSignals,
  friendlyShepherdStreamError,
  isShepherdConfigured,
  streamShepherdCompletion,
} from "@/lib/shepherd/gemini";
import {
  buildShepherdSystemPrompt,
  isClearlyOffTopic,
  shepherdRefusalMessage,
} from "@/lib/shepherd/prompts";
import { resolveShepherdUserContext } from "@/lib/shepherd/resolve-context";
import { shepherdChatRequestSchema } from "@/lib/shepherd/validation";
import { rateLimitShepherdRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
/** Allow Gemini stream + one cold retry within platform limits. */
export const maxDuration = 60;

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function sseEncode(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isShepherdConfigured()) {
    return NextResponse.json(
      {
        error: "Shepherd AI is not configured yet. Please try again later.",
      },
      { status: 503 }
    );
  }

  const rate = await rateLimitShepherdRequest(
    authUser.uid || clientIp(request)
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many Shepherd requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = shepherdChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Please check your message.",
      },
      { status: 400 }
    );
  }

  const context = await resolveShepherdUserContext(
    authUser.uid,
    authUser.email
  );
  if (!context) {
    return NextResponse.json(
      {
        error:
          "Your FaithConnectHub profile could not be loaded. Please finish signing in and try again.",
      },
      { status: 403 }
    );
  }

  const lastUser = [...parsed.data.messages]
    .reverse()
    .find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json(
      { error: "A user message is required." },
      { status: 400 }
    );
  }

  if (isClearlyOffTopic(lastUser.content)) {
    return NextResponse.json({
      message: shepherdRefusalMessage(),
      mode: context.mode,
      refused: true,
    });
  }

  const systemInstruction = buildShepherdSystemPrompt({
    mode: context.mode,
    displayName: context.displayName,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentTerminal = false;
      let hadTokens = false;
      let timedOut = false;

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => {
        timedOut = true;
        if (!timeoutController.signal.aborted) {
          timeoutController.abort();
        }
      }, SHEPHERD_STREAM_TIMEOUT_MS);

      const combined = combineAbortSignals(
        request.signal,
        timeoutController.signal
      );

      const send = (payload: unknown) => {
        controller.enqueue(sseEncode(payload));
      };

      const sendErrorOnce = (message: string) => {
        if (sentTerminal) return;
        sentTerminal = true;
        send({ type: "error", error: message });
      };

      const sendDoneOnce = () => {
        if (sentTerminal) return;
        sentTerminal = true;
        send({ type: "done" });
      };

      const sendToken = (content: string) => {
        if (sentTerminal) return;
        send({ type: "token", content });
      };

      try {
        send({ type: "meta", mode: context.mode });
        // Yield so the runtime can flush `meta` before awaiting Gemini.
        await Promise.resolve();

        for await (const delta of streamShepherdCompletion({
          systemInstruction,
          messages: parsed.data.messages,
          signal: combined.signal,
        })) {
          if (request.signal.aborted) {
            return;
          }
          if (timedOut || timeoutController.signal.aborted) {
            break;
          }
          hadTokens = true;
          sendToken(delta);
        }

        if (request.signal.aborted) {
          return;
        }

        if (timedOut || timeoutController.signal.aborted) {
          sendErrorOnce(
            hadTokens ? SHEPHERD_INTERRUPTED_MESSAGE : SHEPHERD_TIMEOUT_MESSAGE
          );
          return;
        }

        sendDoneOnce();
      } catch (error) {
        if (request.signal.aborted) {
          return;
        }

        if (timedOut || timeoutController.signal.aborted) {
          sendErrorOnce(
            hadTokens ? SHEPHERD_INTERRUPTED_MESSAGE : SHEPHERD_TIMEOUT_MESSAGE
          );
          return;
        }

        console.error("[api/shepherd/chat] stream", {
          name: error instanceof Error ? error.name : "Error",
          message:
            error instanceof Error ? error.message : "Unknown stream error",
          hadTokens,
        });
        sendErrorOnce(friendlyShepherdStreamError(error, hadTokens));
      } finally {
        clearTimeout(timeoutId);
        combined.dispose();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      // Client aborted — Gemini abortSignal stops generation.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
