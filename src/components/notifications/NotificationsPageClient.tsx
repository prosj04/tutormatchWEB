"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
  timeAgo: string;
  icon: string;
  href: string | null;
};

type Props = {
  studentName: string;
  initialItems: NotificationItem[];
  initialUnreadCount: number;
};

/** 알림 유형 → 시안 아바타 아이콘. */
function NotifIcon({ type }: { type: string }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 17,
    height: 17,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
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

export function NotificationsPageClient({ initialItems, initialUnreadCount }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (item.href) router.push(item.href);
  }

  return (
    <section className="page on" id="pg-notif" data-screen-label="알림 센터">
      <div className="crumb">/notifications</div>
      <h1>알림</h1>
      <p className="sub">수업·리포트·결제·질문 소식을 한곳에서 확인하세요.</p>

      {unreadCount > 0 ? (
        <div className="sec" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost sm" onClick={() => void markAllRead()}>
            전체 읽음 표시
          </button>
        </div>
      ) : null}

      <div className="sec card">
        {items.length === 0 ? (
          <div className="row">
            <div className="g">
              <b>아직 알림이 없습니다</b>
              <p>수업·리포트·결제 소식이 도착하면 여기에 표시됩니다.</p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={item.isRead ? "row" : "row unread"}
              role="button"
              tabIndex={0}
              onClick={() => void handleItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void handleItemClick(item);
                }
              }}
              style={{ cursor: item.href ? "pointer" : "default" }}
            >
              <span className="nd" style={item.isRead ? { visibility: "hidden" } : undefined}></span>
              <span className="av" style={{ background: "var(--panel-2)", color: "var(--acc-text)" }}>
                <NotifIcon type={item.type} />
              </span>
              <div className="g">
                <b>{item.title}</b>
                <p>{item.body}</p>
              </div>
              <span className="r">{item.timeAgo}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
