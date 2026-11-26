"use client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedFollowUps?: string[];
}

interface ChatMessageListProps {
  messages: ChatMessage[];
}

/**
 * Accessible scrollable conversation history log with WCAG AA high-contrast message bubbles.
 */
export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div
      role="log"
      aria-label="Conversation history"
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
            <p
              className={`mb-1 text-xs font-bold uppercase ${
                msg.role === "user" ? "text-sky-100" : "text-slate-600"
              }`}
            >
              {msg.role === "user" ? "You" : "BreatheWise AI"}
            </p>
            <div className="space-y-1 whitespace-pre-line">{msg.content}</div>
          </div>
        ))
      )}
    </div>
  );
}
