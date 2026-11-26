"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Application Error</h1>
          <p className="mt-2 text-sm text-slate-700">
            BreatheWise encountered an unexpected error. Please reload to continue.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
          >
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
