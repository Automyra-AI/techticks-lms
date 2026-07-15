"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/notifications");
      if (res.ok && active) {
        const data = await res.json();
        setItems(data.notifications ?? []);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 p-3">
            <p className="text-sm font-semibold text-zinc-200">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-violet-400 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-500">You&apos;re all caught up.</p>
            )}
            {items.map((n) => {
              const body = (
                <div
                  className={`border-b border-zinc-800 p-3 transition-colors hover:bg-zinc-900 ${
                    n.read ? "" : "bg-violet-600/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />}
                    <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{n.message}</p>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                  {body}
                </Link>
              ) : (
                <div key={n.id}>{body}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
