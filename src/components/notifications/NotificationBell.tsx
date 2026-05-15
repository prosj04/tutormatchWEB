"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  timeAgo: string;
  icon: string;
  href: string | null;
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetchNotifications().finally(() => setLoading(false));
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-text-mid transition hover:bg-background hover:text-text-dark"
        aria-label="알림"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-card shadow-lg sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-text-dark">알림</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-gold hover:underline"
              >
                모두 읽음
              </button>
            ) : null}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-mid">
                불러오는 중…
              </li>
            ) : items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-mid">
                알림이 없습니다.
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void handleItemClick(item)}
                    className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-background/80 ${
                      item.isRead
                        ? "bg-gray-50/80"
                        : "bg-white font-medium"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-lg" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          item.isRead
                            ? "text-text-mid"
                            : "font-semibold text-text-dark"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-text-mid">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-xs text-text-light">
                        {item.timeAgo}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
