import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-base text-slate-700">
        The requested air quality view could not be found.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
      >
        Return to BreatheWise
      </Link>
    </main>
  );
}
