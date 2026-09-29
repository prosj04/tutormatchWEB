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

/** 알림 유형 → 선 아이콘(이모지 대체). 알림 센터 페이지와 같은 매핑. */
function NotifIcon({ type }: { type: string }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 15,
    height: 15,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (type.includes("LESSON") || type.includes("CONSULT") || type.includes("SCHEDULE")) {
    return (
      <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    );
  }
  if (type.includes("QUESTION") || type.includes("ANSWER")) {
    return (
      <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    );
  }
  if (type.includes("PAY") || type.includes("BILL") || type.includes("SUBSCRIPTION")) {
    return (
      <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
    );
  }
  return (
    <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
  );
}

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
    <div className="st-bell">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tog"
        aria-label="알림"
        aria-expanded={open}
      >
        <Icon name="bell" size={17} />
        {unreadCount > 0 ? <span className="st-bell-dot" aria-hidden /> : null}
      </button>

      {open ? (
        <div ref={panelRef} className="st-bell-panel">
          <div className="st-bell-head">
            <b>알림</b>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="btn ghost sm"
              >
                모두 읽음
              </button>
            ) : null}
          </div>
          <ul className="st-bell-list">
            {loading && items.length === 0 ? (
              <li>
                <p className="st-bell-msg">불러오는 중…</p>
              </li>
            ) : items.length === 0 ? (
              <li>
                <p className="st-bell-msg">알림이 없습니다.</p>
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id} className={item.isRead ? "read" : undefined}>
                  <button type="button" onClick={() => void handleItemClick(item)}>
                    <span className="av" aria-hidden>
                      <NotifIcon type={item.type} />
                    </span>
                    <span className="g">
                      <b>{item.title}</b>
                      <span className="bd">{item.body}</span>
                      <time>{item.timeAgo}</time>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="st-bell-foot">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              전체 알림 보기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
