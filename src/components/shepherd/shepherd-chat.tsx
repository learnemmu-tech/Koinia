"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, ChevronRight, RotateCcw, Square } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { ShepherdMarkdown } from "@/components/shepherd/shepherd-markdown";
import { ShepherdPulseMark } from "@/components/shepherd/shepherd-pulse-mark";
import { promptsForMode } from "@/components/shepherd/shepherd-prompts";
import { ShepherdResponseActions } from "@/components/shepherd/shepherd-response-actions";
import { Button } from "@/components/ui/button";
import type { ShepherdAudienceMode } from "@/lib/shepherd/validation";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** True when streaming stopped after partial tokens (503/timeout/etc.). */
  interrupted?: boolean;
};

type StreamEvent =
  | { type: "meta"; mode?: ShepherdAudienceMode }
  | { type: "token"; content: string }
  | { type: "done" }
  | { type: "error"; error: string };

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("high demand") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("temporarily interrupted") ||
    lower.includes("taking too long")
  ) {
    return raw;
  }
  if (
    lower.includes("credit") ||
    lower.includes("quota") ||
    lower.includes("billing")
  ) {
    return "Please try again later.";
  }
  if (lower.includes("unauthorized") || lower.includes("sign in")) {
    return "Please sign in again to use Shepherd AI.";
  }
  return raw || "Please try again.";
}

const INTERRUPTED_HINT =
  "Shepherd was temporarily interrupted. You can try again.";

type Props = {
  initialMode: ShepherdAudienceMode;
  displayName: string;
};

export function ShepherdChat({ initialMode, displayName: _displayName }: Props) {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<ShepherdAudienceMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryPrompt, setRetryPrompt] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stickToBottomRef = useRef(true);
  const assistantContentRef = useRef("");
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch("/api/shepherd/context", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { mode?: ShepherdAudienceMode };
        if (data.mode === "ministry" || data.mode === "member") {
          setMode(data.mode);
        }
      } catch {
        // Keep server-provided initialMode.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance < 80;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  function stopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setStreamingId(null);
    textareaRef.current?.focus();
  }

  async function runAssistantStream(input: {
    assistantId: string;
    /** Conversation turns sent to the API (user/assistant), excluding the empty assistant slot. */
    history: Array<{ role: "user" | "assistant"; content: string }>;
    /** Original user prompt for retry / regenerate. */
    userPrompt: string;
  }) {
    const { assistantId, history, userPrompt } = input;

    setError(null);
    setRetryPrompt(null);
    stickToBottomRef.current = true;
    assistantContentRef.current = "";
    setStreaming(true);
    setStreamingId(assistantId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Please sign in again to use Shepherd AI.");
      }

      const response = await fetch("/api/shepherd/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history.slice(-20),
        }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        let message = "Shepherd couldn't respond right now.";
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // keep default
        }
        throw new Error(message);
      }

      if (contentType.includes("application/json")) {
        const data = (await response.json()) as {
          message?: string;
          error?: string;
          mode?: ShepherdAudienceMode;
        };
        if (!data.message) {
          throw new Error(data.error ?? "Shepherd couldn't respond right now.");
        }
        if (data.mode === "ministry" || data.mode === "member") {
          setMode(data.mode);
        }
        assistantContentRef.current = data.message;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ?
              { ...m, content: data.message!, interrupted: false }
            : m
          )
        );
        return;
      }

      if (!response.body) {
        throw new Error("Shepherd couldn't respond right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamFailed: string | null = null;

      const consumeEvent = (event: StreamEvent) => {
        if (event.type === "meta" && event.mode) {
          if (event.mode === "ministry" || event.mode === "member") {
            setMode(event.mode);
          }
          return;
        }
        if (event.type === "token" && event.content) {
          const chunk = event.content;
          assistantContentRef.current += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ?
                { ...m, content: m.content + chunk, interrupted: false }
              : m
            )
          );
          return;
        }
        if (event.type === "error") {
          streamFailed =
            event.error ||
            "Shepherd is temporarily unavailable. Please try again in a moment.";
        }
      };

      const flushBuffer = (flushAll: boolean) => {
        const parts = buffer.split("\n\n");
        if (!flushAll) {
          buffer = parts.pop() ?? "";
        } else {
          buffer = "";
        }
        for (const part of parts) {
          if (!part.trim()) continue;
          const line = part
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            consumeEvent(JSON.parse(payload) as StreamEvent);
          } catch {
            // ignore malformed frames
          }
          if (streamFailed) return;
        }
      };

      while (!streamFailed) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          flushBuffer(true);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        flushBuffer(false);
        if (streamFailed) {
          try {
            await reader.cancel();
          } catch {
            // ignore
          }
          break;
        }
      }

      if (streamFailed) {
        setStreaming(false);
        setStreamingId(null);

        const hadPartial = Boolean(assistantContentRef.current.trim());
        if (hadPartial) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, interrupted: true } : m
            )
          );
          setError(null);
          setRetryPrompt(userPrompt);
          return;
        }

        throw new Error(streamFailed);
      }

      if (!assistantContentRef.current.trim()) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        throw new Error("Shepherd couldn't respond right now.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const hadPartial = Boolean(assistantContentRef.current.trim());
      if (hadPartial) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, interrupted: true } : m
          )
        );
        setError(null);
        setRetryPrompt(userPrompt);
      } else {
        setError(
          friendlyError(
            err instanceof Error ? err.message : "Something went wrong."
          )
        );
        setRetryPrompt(userPrompt);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setStreaming(false);
      setStreamingId(null);
      textareaRef.current?.focus();
    }
  }

  async function sendMessage(raw: string) {
    const content = raw.trim();
    if (!content || streaming) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setInput("");

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content,
    };
    const assistantId = newId();
    const historyBase = [...messagesRef.current, userMessage];

    setMessages([
      ...historyBase,
      { id: assistantId, role: "assistant", content: "", interrupted: false },
    ]);

    await runAssistantStream({
      assistantId,
      history: historyBase.map((m) => ({ role: m.role, content: m.content })),
      userPrompt: content,
    });
  }

  async function regenerateAssistant(assistantId: string) {
    const current = messagesRef.current;
    const assistantIndex = current.findIndex((m) => m.id === assistantId);
    if (assistantIndex < 0) return;

    let userIndex = -1;
    for (let i = assistantIndex - 1; i >= 0; i -= 1) {
      if (current[i]?.role === "user") {
        userIndex = i;
        break;
      }
    }
    if (userIndex < 0) return;

    const userPrompt = current[userIndex]!.content;
    // Keep messages through the user turn; replace this assistant; drop later turns.
    const preserved = current.slice(0, userIndex + 1);
    const history = preserved.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Stop any in-flight stream before regenerating.
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setMessages([
      ...preserved,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        interrupted: false,
      },
    ]);

    await runAssistantStream({
      assistantId,
      history,
      userPrompt,
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const suggestions = promptsForMode(mode);
  const empty = messages.length === 0;
  const canSend = Boolean(input.trim()) && !streaming;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {!empty ?
        <header className="shrink-0 border-b border-border/40 px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
            <ShepherdPulseMark size="sm" pulse={streaming} />
            <div className="min-w-0">
              <h1 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Shepherd AI
              </h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                Your companion for Scripture, faith, and ministry.
              </p>
            </div>
          </div>
        </header>
      : null}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6"
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col",
            empty ? "max-w-5xl pb-6 pt-4 sm:pt-8" : "max-w-5xl pb-4 pt-2"
          )}
        >
          {empty ?
            <div className="flex flex-col items-center text-center">
              {/* Soft warm atmosphere — no heavy photo asset */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[22rem] bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.07),transparent_62%)]"
              />

              <ShepherdPulseMark size="xl" pulse={false} className="mb-5" />

              <h1 className="font-heading text-[1.875rem] font-semibold tracking-tight text-foreground sm:text-4xl">
                Shepherd AI
              </h1>
              <p className="mt-2 max-w-lg text-[0.95rem] text-muted-foreground sm:text-base">
                Your companion for Scripture, faith, and ministry.
              </p>

              <div className="mt-6 flex max-w-md flex-col items-center gap-3">
                <span
                  className="h-px w-10 bg-primary/55"
                  aria-hidden
                />
                <blockquote className="font-heading text-[0.95rem] font-medium italic leading-relaxed text-muted-foreground sm:text-base">
                  “The Lord is my shepherd; I shall not want.”
                  <footer className="mt-1.5 not-italic text-sm text-muted-foreground/80">
                    — Psalm 23:1
                  </footer>
                </blockquote>
              </div>

              <div className="mt-9 w-full max-w-2xl">
                <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  How can I help you today?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Choose a suggestion below or ask your own question.
                </p>
              </div>

              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {suggestions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void sendMessage(item.prompt)}
                      disabled={streaming}
                      className={cn(
                        "group relative rounded-xl border border-border/70 bg-card px-3.5 py-3.5 text-left shadow-sm",
                        "transition-[border-color,background-color,box-shadow,transform] duration-150",
                        "hover:border-primary/35 hover:bg-card hover:shadow-md",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-50"
                      )}
                      aria-label={`Ask: ${item.label}`}
                    >
                      <span className="mb-2.5 flex items-start justify-between gap-2">
                        <span className="text-primary">
                          <Icon className="size-4" strokeWidth={1.85} aria-hidden />
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground/55 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary/80"
                          aria-hidden
                        />
                      </span>
                      <span className="block text-sm font-semibold leading-snug text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          : <div className="space-y-6 py-4">
              {messages.map((message) => {
                const isStreamingMessage =
                  streaming && message.id === streamingId;
                const showActions =
                  message.role === "assistant" &&
                  Boolean(message.content.trim()) &&
                  !isStreamingMessage;

                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[min(100%,34rem)] rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                        {message.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className="flex gap-3">
                    <ShepherdPulseMark
                      size="sm"
                      pulse={isStreamingMessage}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="mb-1.5 font-heading text-sm font-semibold tracking-tight text-foreground">
                        Shepherd AI
                      </p>
                      {message.content ?
                        <ShepherdMarkdown content={message.content} />
                      : isStreamingMessage ?
                        <p className="text-sm text-muted-foreground">
                          Shepherd is thinking…
                        </p>
                      : null}
                      {isStreamingMessage && message.content ?
                        <span
                          className="shepherd-stream-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-primary/70 align-baseline"
                          aria-hidden
                        />
                      : null}
                      {message.interrupted && !isStreamingMessage ?
                        <p className="mt-3 text-xs text-muted-foreground">
                          {INTERRUPTED_HINT}
                        </p>
                      : null}
                      {showActions ?
                        <ShepherdResponseActions
                          content={message.content}
                          interrupted={message.interrupted}
                          disabled={streaming}
                          onRegenerate={() =>
                            void regenerateAssistant(message.id)
                          }
                        />
                      : null}
                    </div>
                  </div>
                );
              })}
            </div>
          }

          {error ?
            <div
              className="mb-4 mt-4 flex flex-col items-start gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 sm:flex-row sm:items-center"
              role="alert"
            >
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-foreground">
                  Shepherd couldn&apos;t respond right now.
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
              </div>
              {retryPrompt ?
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => void sendMessage(retryPrompt)}
                  disabled={streaming}
                >
                  <RotateCcw className="size-3.5" />
                  Try again
                </Button>
              : null}
            </div>
          : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6",
          empty ?
            "bg-transparent"
          : "border-t border-border/50 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        )}
      >
        <form
          className="mx-auto w-full max-w-5xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (streaming) {
              stopGeneration();
              return;
            }
            void sendMessage(input);
          }}
        >
          <div
            className={cn(
              "relative rounded-[1.75rem] border border-border/80 bg-card",
              "shadow-[0_8px_28px_-16px_rgba(28,43,58,0.22)]",
              "transition-[border-color,box-shadow] focus-within:border-primary/40",
              "focus-within:shadow-[0_10px_32px_-14px_rgba(28,43,58,0.28)]"
            )}
          >
            <label htmlFor="shepherd-composer" className="sr-only">
              Ask Shepherd AI
            </label>
            <textarea
              id="shepherd-composer"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Shepherd about Scripture, faith, or ministry…"
              rows={1}
              disabled={streaming}
              className={cn(
                "max-h-40 min-h-[56px] w-full resize-none bg-transparent",
                "px-5 py-4 pr-14 text-sm leading-relaxed text-foreground",
                "placeholder:text-muted-foreground/80",
                "outline-none disabled:opacity-60"
              )}
            />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
              {streaming ?
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5 rounded-full px-3"
                  aria-label="Stop generating"
                >
                  <Square className="size-3 fill-current" />
                  Stop
                </Button>
              : <Button
                  type="submit"
                  size="icon"
                  className="size-10 rounded-full bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
                  disabled={!canSend}
                  aria-label="Send message to Shepherd AI"
                >
                  <ArrowUp className="size-4" strokeWidth={2.25} />
                </Button>
              }
            </div>
          </div>
          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
            Press Enter to send · Shift + Enter for a new line · Shepherd is an
            AI assistant, not a pastor or source of divine revelation.
          </p>
        </form>
      </div>
    </div>
  );
}
