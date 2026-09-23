"use client";

import { useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COMMUNITY_MESSAGE_MAX_LENGTH } from "@/types/community-chat";

type CommunityChatComposerProps = {
  id: string;
  label: string;
  draft: string;
  placeholder: string;
  disabled: boolean;
  canSubmit: boolean;
  pending: boolean;
  submitLabel?: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
};

export function CommunityChatComposer({
  id,
  label,
  draft,
  placeholder,
  disabled,
  canSubmit,
  pending,
  submitLabel,
  onDraftChange,
  onSubmit,
}: CommunityChatComposerProps) {
  const composerRef = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const node = composerRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 128)}px`;
  }

  return (
    <form
      className="flex w-full items-end gap-2 rounded-2xl border border-[#E6E8EC] bg-[#F6F7FB] px-3 py-2 focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/12"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        ref={composerRef}
        rows={1}
        value={draft}
        maxLength={COMMUNITY_MESSAGE_MAX_LENGTH}
        disabled={disabled}
        placeholder={placeholder}
        className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-[#0F172A] outline-none placeholder:text-[#64748B] disabled:opacity-70"
        onChange={(event) => {
          onDraftChange(event.target.value);
          resize();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="submit"
        size={submitLabel ? "default" : "icon"}
        className={submitLabel ? "h-10 shrink-0 rounded-xl px-4" : "size-11 shrink-0 rounded-xl sm:size-10"}
        disabled={!canSubmit}
        aria-label={submitLabel ?? "Send message"}
      >
        {pending ?
          <Loader2 className="size-4 animate-spin" />
        : submitLabel ?
          submitLabel
        : <ArrowUp className="size-4" />}
      </Button>
    </form>
  );
}
