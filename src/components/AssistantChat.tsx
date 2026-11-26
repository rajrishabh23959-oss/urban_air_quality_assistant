"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import type { AirQualitySnapshot, AssistantResponse, HouseholdProfile } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedFollowUps?: string[];
}

interface AssistantChatProps {
  airQuality: AirQualitySnapshot | null;
  profile: HouseholdProfile;
}

export function AssistantChat({ airQuality, profile }: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const msgCounterRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [airQuality?.location.latitude, airQuality?.location.longitude]);

  const city = airQuality?.location.name ?? "your city";
  const quickPrompts = [
    `Is it safe to open windows in ${city} at 2 PM today?`,
    "Low-cost ways to protect an asthmatic child indoors",
    `Draft a smog safety notice for my apartment complex in ${city}`,
  ];

  async function sendQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if (!airQuality || trimmed.length < 2 || isSending) {
      return;
    }

    msgCounterRef.current += 1;
    const userMsg: ChatMessage = {
      id: `u-${msgCounterRef.current}`,
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          airQuality,
          profile,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      const data = (await res.json()) as Partial<AssistantResponse> & { error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? "Assistant request failed.");
      }

      msgCounterRef.current += 1;
      setMessages([
        ...nextMessages,
        {
          id: `a-${msgCounterRef.current}`,
          role: "assistant",
          content: data.reply,
          suggestedFollowUps: data.suggestedFollowUps ?? [],
        },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to reach BreatheWise Assistant.");
    } finally {
      if (abortRef.current === controller) {
        setIsSending(false);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendQuestion(input);
  }

  const latestMessage = messages[messages.length - 1];
  const followUps =
    latestMessage?.role === "assistant" ? (latestMessage.suggestedFollowUps ?? []) : [];

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

      <div className="flex flex-wrap gap-2" aria-label="Quick prompt suggestions">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={!airQuality || isSending}
            onClick={() => void sendQuestion(prompt)}
            className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div
        role="log"
        aria-label="Conversation history"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-slate-600">
            Ask a question below or pick a quick prompt to get tailored guidance.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "ml-6 bg-sky-900 text-white"
                  : "mr-6 border border-slate-200 bg-white text-slate-900"
              }`}
            >
              <p className="mb-1 text-[11px] font-bold uppercase opacity-75">
                {msg.role === "user" ? "You" : "BreatheWise AI"}
              </p>
              <div className="space-y-1 whitespace-pre-line">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      {followUps.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Suggested follow-up questions"
        >
          <span className="text-xs font-semibold text-slate-700">Follow-up:</span>
          {followUps.map((followUp) => (
            <button
              key={followUp}
              type="button"
              disabled={!airQuality || isSending}
              onClick={() => void sendQuestion(followUp)}
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-left text-xs font-medium text-sky-950 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-50"
            >
              {followUp}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p id={errorId} className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
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
            disabled={!airQuality || isSending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            placeholder="Ask about masks, windows, DIY purifiers, or community notices..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          />
        </div>
        <button
          type="submit"
          disabled={!airQuality || isSending || input.trim().length < 2}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <Send aria-hidden="true" className="h-4 w-4" />
          <span>{isSending ? "Sending..." : "Ask"}</span>
        </button>
      </form>
    </section>
  );
}
