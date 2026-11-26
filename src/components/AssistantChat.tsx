"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { fetchAssistantApi } from "@/lib/api-client";
import type { AirQualitySnapshot, HouseholdProfile } from "@/types";
import { ChatMessageList, type ChatMessage } from "./ChatMessageList";

interface AssistantChatProps {
  airQuality: AirQualitySnapshot | null;
  profile: HouseholdProfile;
}

interface PromptChipListProps {
  prompts: string[];
  label: string;
  chipClass: string;
  disabled: boolean;
  onSelect: (prompt: string) => void;
}

function PromptChipList({ prompts, label, chipClass, disabled, onSelect }: PromptChipListProps) {
  return (
    <div role="group" className="flex flex-wrap items-center gap-2" aria-label={label}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className={chipClass}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

function useAssistantChat(airQuality: AirQualitySnapshot | null, profile: HouseholdProfile) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const msgCounterRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => abortRef.current?.abort(),
    [airQuality?.location.latitude, airQuality?.location.longitude],
  );

  async function sendQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if (!airQuality || trimmed.length < 2 || isSending) return;
    msgCounterRef.current += 1;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: `u-${msgCounterRef.current}`, role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await fetchAssistantApi(
        {
          message: trimmed,
          airQuality,
          profile,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        },
        controller.signal,
      );
      msgCounterRef.current += 1;
      setMessages([
        ...nextMessages,
        {
          id: `a-${msgCounterRef.current}`,
          role: "assistant",
          content: data.reply,
          suggestedFollowUps: data.suggestedFollowUps,
        },
      ]);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Unable to reach BreatheWise Assistant.");
      }
    } finally {
      if (abortRef.current === controller) setIsSending(false);
    }
  }

  return { messages, input, setInput, isSending, error, sendQuestion };
}

function AssistantInputForm({
  input,
  setInput,
  disabled,
  isSending,
  error,
  errorId,
  onSubmit,
}: {
  input: string;
  setInput: (v: string) => void;
  disabled: boolean;
  isSending: boolean;
  error: string | null;
  errorId: string;
  onSubmit: () => void;
}) {
  const inputId = useId();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <div className="flex-1">
        <label htmlFor={inputId} className="sr-only">
          Ask an air quality question
        </label>
        <input
          id={inputId}
          type="text"
          maxLength={500}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          placeholder="Ask about masks, windows, DIY purifiers, or community notices..."
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || input.trim().length < 2}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 disabled:opacity-50"
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        <span>{isSending ? "Sending..." : "Ask"}</span>
      </button>
    </form>
  );
}

/**
 * Context-aware GenAI conversational assistant grounded in local AQI and profile.
 */
export function AssistantChat({ airQuality, profile }: AssistantChatProps) {
  const { messages, input, setInput, isSending, error, sendQuestion } = useAssistantChat(
    airQuality,
    profile,
  );
  const errorId = useId();
  const city = airQuality?.location.name ?? "your city";
  const quickPrompts = [
    `Is it safe to open windows in ${city} at 2 PM today?`,
    "Low-cost ways to protect an asthmatic child indoors",
    `Draft a smog safety notice for my apartment complex in ${city}`,
  ];
  const latest = messages[messages.length - 1];
  const followUps = latest?.role === "assistant" ? (latest.suggestedFollowUps ?? []) : [];

  return (
    <section
      aria-labelledby="assistant-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <MessageSquare aria-hidden="true" className="h-5 w-5 text-sky-800" />
        <h2 id="assistant-heading" className="text-lg font-bold text-slate-900">
          Ask BreatheWise Assistant
        </h2>
      </div>
      <p className="text-xs text-slate-700">
        Grounded in {city}&apos;s live AQI, 24h ventilation window, and your {profile.mode} profile.
      </p>
      <PromptChipList
        prompts={quickPrompts}
        label="Quick prompt suggestions"
        disabled={!airQuality || isSending}
        onSelect={(p) => void sendQuestion(p)}
        chipClass="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-50"
      />
      <ChatMessageList messages={messages} />
      {followUps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Follow-up:</span>
          <PromptChipList
            prompts={followUps}
            label="Suggested follow-up questions"
            disabled={!airQuality || isSending}
            onSelect={(p) => void sendQuestion(p)}
            chipClass="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-left text-xs font-medium text-sky-950 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-50"
          />
        </div>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
      <AssistantInputForm
        input={input}
        setInput={setInput}
        disabled={!airQuality || isSending}
        isSending={isSending}
        error={error}
        errorId={errorId}
        onSubmit={() => void sendQuestion(input)}
      />
    </section>
  );
}
