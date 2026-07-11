"use client";

import { useState } from "react";

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return digits;
}

type Banner = { text: string; error: boolean } | null;

function BannerBox({ banner }: { banner: Banner }) {
  if (!banner) return null;
  return (
    <div
      className={banner.error ? "banner warn" : "banner info"}
      style={{ marginTop: "14px" }}
      role={banner.error ? "alert" : undefined}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span>{banner.text}</span>
    </div>
  );
}

/** 프로필(이름·전화) + 비밀번호 변경. 시안 pg-account. */
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
    <div className="sec grid2">
      <div className="card" style={{ padding: "20px" }}>
        <form onSubmit={saveProfile}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>프로필</h2>
          <div className="field">
            <label>이름</label>
            <input className="inp filled" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>전화번호</label>
            <input
              className="inp filled"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="field">
            <label>이메일</label>
            <div className="inp filled">{email}</div>
          </div>
          <button type="submit" className="btn sec" disabled={profileBusy}>
            {profileBusy ? "저장 중…" : "저장"}
          </button>
          <BannerBox banner={profileMsg} />
        </form>
      </div>

      <div className="card" style={{ padding: "20px" }}>
        <form onSubmit={changePassword}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>비밀번호 변경</h2>
          <div className="field">
            <label>현재 비밀번호</label>
            <input
              className="inp"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
            />
          </div>
          <div className="field">
            <label>새 비밀번호 (8자 이상)</label>
            <input
              className="inp"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn pri" disabled={pwBusy}>
            {pwBusy ? "변경 중…" : "변경하기"}
          </button>
          <BannerBox banner={pwMsg} />
          <div className="banner info" style={{ marginTop: "14px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>비밀번호를 잊으셨다면 담당 매니저가 대면 확인 후 재설정해 드립니다.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
