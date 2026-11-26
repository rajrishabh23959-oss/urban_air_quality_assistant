import { Wind } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-900 text-white">
            <Wind aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">BreatheWise</h1>
            <p className="text-xs text-slate-600">
              GenAI Winter Smog &amp; Urban Air Quality Assistant
            </p>
          </div>
        </div>

        <nav aria-label="Section shortcuts" className="flex flex-wrap gap-3 text-xs font-semibold">
          <a
            href="#aqi-heading"
            className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            Live AQI
          </a>
          <a
            href="#simulator-heading"
            className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            Impact Simulator
          </a>
          <a
            href="#plan-heading"
            className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            Action Plan
          </a>
          <a
            href="#assistant-heading"
            className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            AI Assistant
          </a>
        </nav>
      </div>
    </header>
  );
}
