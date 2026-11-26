"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Megaphone } from "lucide-react";
import type { CommunityAdvisory } from "@/types";

interface CommunityAdvisoryCardProps {
  advisory: CommunityAdvisory;
}

export function CommunityAdvisoryCard({ advisory }: CommunityAdvisoryCardProps) {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopyNotice(text: string) {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setCopyError(null);

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyError("Clipboard access is unavailable in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      timerRef.current = setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      setCopiedNotice(false);
      setCopyError("Unable to copy notice automatically. Please copy the text manually.");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sky-950">
          <Megaphone aria-hidden="true" className="h-5 w-5 text-sky-800" />
          <h3 className="text-lg font-bold">Community Smog Advisory</h3>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyNotice(advisory.whatsappNotice)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-950 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        >
          {copiedNotice ? (
            <>
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
              <span>Copied notice</span>
            </>
          ) : (
            <>
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Copy WhatsApp / Notice Board Alert</span>
            </>
          )}
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {copiedNotice ? "Community notice copied to clipboard" : ""}
      </p>

      {copyError && (
        <p className="text-xs font-medium text-red-700" role="alert">
          {copyError}
        </p>
      )}

      <p className="text-sm font-bold text-slate-900">{advisory.headline}</p>

      <pre className="whitespace-pre-wrap rounded-xl border border-sky-200 bg-white p-4 font-sans text-xs leading-relaxed text-slate-800">
        {advisory.whatsappNotice}
      </pre>

      <div>
        <h4 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
          Collective School &amp; RWA Actions
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {advisory.schoolAndRwaActions.map((act) => (
            <li key={act}>{act}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs font-semibold text-sky-950">{advisory.collectiveImpactNote}</p>
    </div>
  );
}
