"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

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

/**
 * 학생 계정 — 프로필(읽기 전용), 비밀번호 변경, 학부모 연결 코드/QR, 회원 탈퇴.
 * 시안 pg-account. 데이터·API는 기존 로직 유지:
 *  - POST /api/account/password
 *  - GET/POST /api/student/parent-link-code
 *  - POST /api/account/delete
 */
export function AccountClient({
  name,
  grade,
  phone,
}: {
  name: string;
  grade: string;
  phone: string;
}) {
  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<Banner>(null);

  // 학부모 연결 코드
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeMsg, setCodeMsg] = useState<Banner>(null);

  // 회원 탈퇴
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitConfirm, setQuitConfirm] = useState("");
  const [quitBusy, setQuitBusy] = useState(false);
  const [quitError, setQuitError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/student/parent-link-code");
        if (!res.ok) return;
        const data = (await res.json()) as { code: string | null };
        if (active) setLinkCode(data.code);
      } catch {
        /* 무시 — 코드 없음 상태로 둔다 */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwBusy) return;
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: "새 비밀번호가 일치하지 않습니다.", error: true });
      return;
    }
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
        setConfirmPassword("");
        setPwMsg({ text: "비밀번호가 변경되었습니다.", error: false });
      }
    } catch {
      setPwMsg({ text: "네트워크 오류가 발생했습니다.", error: true });
    } finally {
      setPwBusy(false);
    }
  }

  async function reissueCode() {
    if (codeBusy) return;
    setCodeBusy(true);
    setCodeMsg(null);
    try {
      const res = await fetch("/api/student/parent-link-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCodeMsg({ text: data.error ?? "코드 발급에 실패했습니다.", error: true });
      } else {
        setLinkCode(data.code);
        setCodeMsg({ text: "새 연결 코드가 발급되었습니다.", error: false });
      }
    } catch {
      setCodeMsg({ text: "네트워크 오류가 발생했습니다.", error: true });
    } finally {
      setCodeBusy(false);
    }
  }

  async function handleQuit() {
    if (quitBusy) return;
    setQuitError("");
    setQuitBusy(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        setQuitError("탈퇴 처리에 실패했습니다. 잠시 후 다시 시도하거나 help@concordedu.kr 로 문의해 주세요.");
        return;
      }
      await signOut({ redirectTo: "/" });
    } finally {
      setQuitBusy(false);
    }
  }

  return (
    <>
      <div className="sec grid2">
        <div className="card" style={{ padding: "22px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>프로필</h2>
          <div className="field">
            <label>이름</label>
            <div className="inp filled">{name}</div>
          </div>
          <div className="field">
            <label>학년</label>
            <div className="inp filled">{grade}</div>
          </div>
          <div className="field">
            <label>연락처</label>
            <div className="inp filled">{phone}</div>
          </div>
          <div className="banner info" style={{ marginTop: "14px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>정보 수정이 필요하면 담당 매니저 또는 help@concordedu.kr 로 문의해 주세요.</span>
          </div>
        </div>

        <div className="card" style={{ padding: "22px" }}>
          <form onSubmit={changePassword}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>비밀번호 변경</h2>
            <div className="field">
              <label htmlFor="account-current-password">현재 비밀번호</label>
              <input
                id="account-current-password"
                type="password"
                className="inp"
                placeholder="현재 비밀번호"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="field">
              <label htmlFor="account-new-password">새 비밀번호</label>
              <input
                id="account-new-password"
                type="password"
                className="inp"
                placeholder="8자 이상, 영문+숫자"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="account-confirm-password">새 비밀번호 확인</label>
              <input
                id="account-confirm-password"
                type="password"
                className="inp"
                placeholder="한 번 더 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn sec" disabled={pwBusy}>
              {pwBusy ? "변경 중…" : "비밀번호 변경"}
            </button>
            <BannerBox banner={pwMsg} />
          </form>
        </div>
      </div>

      <div className="sec grid2">
        <div className="card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 0" }}>학부모 연결</h2>
          <div className="codebox">
            <span className="qr" aria-label="연결 QR 코드">
              <svg viewBox="0 0 64 64" fill="currentColor">
                <path d="M4 4h20v20H4zM9 9v10h10V9zM40 4h20v20H40zM45 9v10h10V9zM4 40h20v20H4zM9 45v10h10V45zM40 40h6v6h-6zM52 40h8v6h-8zM40 52h6v8h-6zM52 52h8v8h-8zM28 4h6v10h-6zM28 22h6v12h-6zM28 40h6v6h-6zM28 52h6v8h-6zM4 28h10v6H4zM22 28h12v6H22zM40 28h10v6h-10zM56 28h4v6h-4z" />
              </svg>
            </span>
            <div>
              <b className="code">{linkCode ?? "코드 없음"}</b>
              <p>학부모 앱에서 이 코드를 입력하면 자녀 계정과 연결됩니다. 유효기간 24시간.</p>
              <button
                type="button"
                className="btn ghost sm"
                style={{ marginTop: "10px" }}
                onClick={reissueCode}
                disabled={codeBusy}
              >
                {codeBusy ? "발급 중…" : linkCode ? "코드 재발급" : "코드 발급"}
              </button>
              <BannerBox banner={codeMsg} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "22px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>계정 관리</h2>
          <p style={{ fontSize: "13px", color: "var(--mut)", marginBottom: "14px" }}>
            탈퇴 시 학습 기록과 리포트가 모두 삭제되며 복구할 수 없습니다.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="btn sec" onClick={() => void signOut({ redirectTo: "/" })}>
              로그아웃
            </button>
            <button type="button" className="btn danger" onClick={() => setQuitOpen(true)}>
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      <div className={`scrim${quitOpen ? " on" : ""}`} onClick={(e) => { if (e.target === e.currentTarget && !quitBusy) setQuitOpen(false); }}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="회원 탈퇴 확인">
          <div className="m-b">
            <h3>정말 탈퇴하시겠어요?</h3>
            <p className="m-p">
              학습 기록·리포트·질문 내역이 모두 삭제되며 복구할 수 없습니다. 진행 중인 구독은 말일까지 유지 후 종료됩니다.
            </p>
            <div className="field" style={{ marginTop: "14px" }}>
              <label htmlFor="account-quit-confirm">확인을 위해 ‘탈퇴합니다’를 입력하세요</label>
              <input
                id="account-quit-confirm"
                className="inp"
                placeholder="탈퇴합니다"
                value={quitConfirm}
                onChange={(e) => setQuitConfirm(e.target.value)}
              />
            </div>
            {quitError ? (
              <div className="banner warn" style={{ marginTop: "12px" }} role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{quitError}</span>
              </div>
            ) : null}
          </div>
          <div className="m-f">
            <button type="button" className="btn sec" onClick={() => setQuitOpen(false)} disabled={quitBusy}>
              취소
            </button>
            <button
              type="button"
              className="btn danger solid"
              onClick={() => void handleQuit()}
              disabled={quitConfirm.trim() !== "탈퇴합니다" || quitBusy}
            >
              {quitBusy ? "처리 중…" : "탈퇴하기"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
