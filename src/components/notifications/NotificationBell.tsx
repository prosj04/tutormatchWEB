"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";

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

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?summary=1");
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount: number };
      setUnreadCount(data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

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
    const timer = window.setTimeout(() => {
      void fetchUnreadCount();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetchNotifications().finally(() => setLoading(false));
    const interval = window.setInterval(() => void fetchNotifications(), 60_000);
    return () => window.clearInterval(interval);
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
        className="relative rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text-primary"
        aria-label="알림"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">알림</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                모두 읽음
              </button>
            ) : null}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
                불러오는 중…
              </li>
            ) : items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
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
                            ? "text-text-secondary"
                            : "font-semibold text-text-primary"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-text-secondary">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">
                        {item.timeAgo}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-primary hover:underline"
            >
              전체 알림 보기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
