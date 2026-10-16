/**
 * Shown the instant a sidebar tab is clicked.
 *
 * Every page here is dynamic — they all read the session cookie — and Next
 * does not prefetch a dynamic route *unless it has a loading file*. Without
 * this, each click waited on a full server render (session, then a dozen
 * queries) before anything painted, which is what made tab switching feel
 * stuck. With it, the layout and this skeleton are prefetched and render
 * immediately while the real content streams in behind.
 *
 * The shapes deliberately mirror the common page layout — a description line,
 * a row of tiles, then cards — so the swap to real content is not a jolt.
 */
function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-sunk)] ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Shimmer className="h-4 w-72" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
          >
            <Shimmer className="h-3 w-24" />
            <Shimmer className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
          >
            <Shimmer className="h-4 w-40" />
            <Shimmer className="mt-3 h-3 w-full" />
            <Shimmer className="mt-2 h-3 w-2/3" />
            <Shimmer className="mt-5 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
