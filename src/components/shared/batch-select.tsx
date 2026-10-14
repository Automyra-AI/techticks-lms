"use client";

import { useEffect, useState } from "react";
import { Label, Select } from "@/components/ui/input";

type Batch = { id: string; name: string };

/**
 * Scopes a piece of coursework to one batch. Leaving it on "All batches" keeps
 * the previous behaviour — everyone sees it — so existing content is unaffected.
 *
 * Batches are fetched on open rather than threaded through every form's props,
 * which keeps this drop-in for the assignment, quiz and session dialogs.
 */
export function BatchSelect({
  value,
  onChange,
  label = "Batch",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [batches, setBatches] = useState<Batch[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/batches")
      .then((r) => (r.ok ? r.json() : { batches: [] }))
      .then((d) => {
        if (!cancelled) setBatches(Array.isArray(d.batches) ? d.batches : []);
      })
      .catch(() => {
        if (!cancelled) setBatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to choose between until batches exist — stay out of the way.
  if (batches !== null && batches.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={batches === null}>
        <option value="">All batches</option>
        {(batches ?? []).map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <p className="text-xs text-zinc-500">
        Only students in the chosen batch will see this. &quot;All batches&quot; shows it to everyone.
      </p>
    </div>
  );
}
