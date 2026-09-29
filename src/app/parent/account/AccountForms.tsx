"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return digits;
}

type Banner = { text: string; error: boolean } | null;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function BannerBox({ banner }: { banner: Banner }) {
  if (!banner) return null;
  return (
    <div
      className={banner.error ? "banner warn pa-msg" : "banner info pa-msg"}
      role={banner.error ? "alert" : undefined}
    >
      <InfoIcon />
      <span>{banner.text}</span>
    </div>
  );
}

/** 프로필(이름·전화) + 비밀번호 변경 + 탈퇴 — 헤어라인으로 나눈 계정 지면. */
export function AccountForms({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(formatPhone(initialPhone));
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Banner>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<Banner>(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<Banner>(null);

  async function deleteAccount() {
    if (deleteBusy) return;
    const ok = window.confirm(
      "탈퇴하면 자녀 연결이 해제되고 개인정보가 익명화되며 되돌릴 수 없습니다. 결제 기록은 법령에 따라 보관됩니다. 계속하시겠습니까?",
    );
    if (!ok) return;
    setDeleteBusy(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteMsg({ text: data.error ?? "탈퇴에 실패했습니다.", error: true });
        setDeleteBusy(false);
        return;
      }
      await signOut({ redirectTo: "/" });
    } catch {
      setDeleteMsg({ text: "네트워크 오류가 발생했습니다.", error: true });
      setDeleteBusy(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (profileBusy) return;
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/parent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ text: data.error ?? "저장에 실패했습니다.", error: true });
      } else {
        setProfileMsg({ text: "프로필을 저장했습니다.", error: false });
      }
    } catch {
      setProfileMsg({ text: "네트워크 오류가 발생했습니다.", error: true });
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwBusy) return;
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ text: data.error ?? "변경에 실패했습니다.", error: true });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setPwMsg({ text: "비밀번호를 변경했습니다.", error: false });
      }
    } catch {
      setPwMsg({ text: "네트워크 오류가 발생했습니다.", error: true });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <>
      <div className="sec pa-acc">
        <h2>프로필</h2>
        <form onSubmit={saveProfile}>
          <div className="field">
            <label htmlFor="pa-acc-name">이름</label>
            <input
              id="pa-acc-name"
              className="inp filled"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pa-acc-phone">전화번호</label>
            <input
              id="pa-acc-phone"
              className="inp filled"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="field">
            <span className="field-label">이메일</span>
            <div className="inp pa-ro">{email}</div>
          </div>
          <div className="pa-act">
            <button type="submit" className="btn btn-ghost" disabled={profileBusy}>
              {profileBusy ? "저장 중…" : "저장"}
            </button>
          </div>
          <BannerBox banner={profileMsg} />
        </form>
      </div>

      <div className="sec pa-acc pa-ruled">
        <h2>비밀번호 변경</h2>
        <form onSubmit={changePassword}>
          <div className="field">
            <label htmlFor="pa-acc-pw-cur">현재 비밀번호</label>
            <input
              id="pa-acc-pw-cur"
              className="inp"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
            />
          </div>
          <div className="field">
            <label htmlFor="pa-acc-pw-new">새 비밀번호 (8자 이상)</label>
            <input
              id="pa-acc-pw-new"
              className="inp"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="pa-act">
            <button type="submit" className="btn pri" disabled={pwBusy}>
              {pwBusy ? "변경 중…" : "변경하기"}
            </button>
          </div>
          <BannerBox banner={pwMsg} />
          <div className="banner info pa-msg">
            <InfoIcon />
            <span>비밀번호를 잊으셨다면 담당 매니저가 대면 확인 후 재설정해 드립니다.</span>
          </div>
        </form>
      </div>

      <div className="sec pa-acc pa-ruled">
        <h2>회원 탈퇴</h2>
        <p className="pa-note">
          탈퇴하면 자녀 연결이 해제되고 개인정보가 익명화됩니다. 되돌릴 수 없으며, 결제
          기록은 관련 법령에 따라 보관됩니다.
        </p>
        <div className="pa-act">
          <button
            type="button"
            className="btn danger"
            onClick={deleteAccount}
            disabled={deleteBusy}
          >
            {deleteBusy ? "탈퇴 처리 중…" : "회원 탈퇴"}
          </button>
        </div>
        <BannerBox banner={deleteMsg} />
      </div>
    </>
  );
}
