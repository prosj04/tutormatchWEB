"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { ConcordPortalThemeControls } from "@/components/concord/ConcordPortalThemeControls";

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

function groupByDate(items: NotificationItem[]): [string, NotificationItem[]][] {
  const groups: Map<string, NotificationItem[]> = new Map();
  for (const item of items) {
    const d = new Date(item.createdAt);
    const label = d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return Array.from(groups.entries());
}

export function NotificationsPageClient({ studentName, initialItems, initialUnreadCount }: Props) {
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

  const groups = groupByDate(items);

  return (
    <div className="min-h-screen bg-background" data-portal-content>
      <header className="portal-topbar">
        <div className="portal-topbar-inner">
          <Link href="/dashboard" className="portal-topbar-brand">
            Concord<span>.</span>
          </Link>
          <p className="portal-topbar-title">{studentName}님의 알림</p>
          <div className="portal-topbar-actions">
            <ConcordPortalThemeControls />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => signOut({ redirectTo: "/" })}
            >
              <span className="md:hidden">나가기</span>
              <span className="hidden md:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-text-primary">
            알림
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-sm font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-sm font-medium text-primary hover:underline"
            >
              전체 읽음 표시
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-surface px-6 py-16 text-center">
            <p className="text-sm text-text-secondary">아직 알림이 없습니다.</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              학습 플래너로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(([date, groupItems]) => (
              <section key={date}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{date}</p>
                <ul className="space-y-2">
                  {groupItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void handleItemClick(item)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition hover:bg-background ${
                          item.isRead
                            ? "border-gray-100 bg-surface"
                            : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 text-xl leading-none">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold ${item.isRead ? "text-text-primary" : "text-primary"}`}>
                              {item.title}
                              {!item.isRead && (
                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
                              )}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.body}</p>
                            <p className="mt-2 text-xs text-text-muted">{item.timeAgo}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
