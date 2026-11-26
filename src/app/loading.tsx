export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-80 rounded-2xl bg-slate-200" />
      </div>
      <span className="sr-only">Loading BreatheWise air quality assistant...</span>
    </div>
  );
}
