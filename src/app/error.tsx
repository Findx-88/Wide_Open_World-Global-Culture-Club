'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className="eyebrow">Something went wrong</div>
        <h1 className="mt-3 font-display text-4xl">We lost the signal for a moment.</h1>
        <p className="mt-3 text-ink-soft">Please try again — if it keeps happening, the club has been notified in the server logs.</p>
        <button onClick={reset} className="btn btn-primary mt-8">Try again</button>
      </div>
    </main>
  );
}
