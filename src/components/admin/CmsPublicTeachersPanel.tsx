"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { GenderSelect } from "@/components/ui/GenderSelect";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import type { ProfileGender } from "@/lib/profile-gender";

type TeacherPublicRow = {
  id: string;
  name: string;
  subjects: string;
  education: string;
  experience: string;
  bio: string;
  approved: boolean;
  gender: string | null;
  photoUrl: string | null;
  email: string;
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary";

export function CmsPublicTeachersPanel() {
  const [rows, setRows] = useState<TeacherPublicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    const merged: TeacherPublicRow[] = [];
    let page = 1;
    const limit = 50;
    try {
      while (true) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const res = await fetch(`/api/admin/teachers?${params}`);
        if (!res.ok) break;
        const data = (await res.json()) as {
          teachers: TeacherPublicRow[];
          pagination: { totalPages: number };
        };
        merged.push(...data.teachers);
        if (page >= data.pagination.totalPages) break;
        page += 1;
      }
      setRows(merged);
      const next: Record<string, Record<string, string>> = {};
      for (const t of merged) {
        next[t.id] = {
          name: t.name,
          subjects: t.subjects,
          education: t.education,
          experience: t.experience,
          bio: t.bio,
          gender:
            t.gender === "FEMALE" ? "FEMALE" : t.gender === "MALE" ? "MALE" : "",
        };
      }
      setForms(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function setField(id: string, key: string, value: string) {
    setForms((f) => ({
      ...f,
      [id]: { ...(f[id] ?? {}), [key]: value },
    }));
  }

  async function saveTeacher(id: string) {
    const form = forms[id];
    if (!form) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          subjects: form.subjects,
          education: form.education,
          experience: form.experience,
          bio: form.bio,
          gender:
            form.gender === "FEMALE" ? "FEMALE" : form.gender === "MALE" ? "MALE" : null,
        }),
      });
      if (res.ok) await loadAll();
    } finally {
      setSavingId(null);
    }
  }

  async function toggleApproved(t: TeacherPublicRow) {
    setSavingId(t.id);
    try {
      await fetch(`/api/admin/teachers/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !t.approved }),
      });
      await loadAll();
    } finally {
      setSavingId(null);
    }
  }

  async function uploadPhoto(t: TeacherPublicRow, file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadId(t.id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/teachers/${t.id}/photo`, { method: "POST", body: fd });
      if (res.ok) await loadAll();
    } finally {
      setUploadId(null);
    }
  }

  if (loading) {
    return <p className="mt-4 text-sm text-text-secondary">강사 목록을 불러오는 중...</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-gray-100 bg-background px-4 py-3 text-sm text-text-secondary">
        등록된 선생님이 없습니다. 「선생님 관리」에서 먼저 계정을 만들 수 있습니다.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      <p className="text-sm text-text-secondary">
        각 선생님의 공개 프로필 카드·상세에 쓰이는 필드를 여기서 바로 수정합니다. 승인 상태는 공개 강사 목록(`/tutors`) 표시에
        영향을 줍니다.
      </p>
      {rows.map((t) => {
        const form = forms[t.id] ?? {
          name: t.name,
          subjects: t.subjects,
          education: t.education,
          experience: t.experience,
          bio: t.bio,
          gender:
            t.gender === "FEMALE" ? "FEMALE" : t.gender === "MALE" ? "MALE" : "",
        };
        const open = openId === t.id;
        return (
          <div key={t.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : t.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={getEffectivePhotoUrl(t.photoUrl, t.gender)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-text-primary">{t.name}</span>
                  <span className="truncate text-xs text-text-muted">{t.email}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    t.approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {t.approved ? "승인됨" : "대기"}
                </span>
                <span className="text-xs text-text-muted">{open ? "접기" : "펼치기"}</span>
              </span>
            </button>
            {open ? (
              <div className="space-y-3 border-t border-gray-100 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingId === t.id}
                    onClick={() => void toggleApproved(t)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t.approved ? "승인 취소" : "승인"}
                  </button>
                  <label className="cursor-pointer rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadId === t.id}
                      onChange={(e) => void uploadPhoto(t, e.target.files?.[0])}
                    />
                    {uploadId === t.id ? "업로드 중…" : "내부용 사진 업로드"}
                  </label>
                </div>

                <input
                  className={inputClass}
                  value={form.name}
                  placeholder="이름"
                  onChange={(e) => setField(t.id, "name", e.target.value)}
                />
                <input
                  className={inputClass}
                  value={form.subjects}
                  placeholder="담당 과목"
                  onChange={(e) => setField(t.id, "subjects", e.target.value)}
                />
                <input
                  className={inputClass}
                  value={form.education}
                  placeholder="학력"
                  onChange={(e) => setField(t.id, "education", e.target.value)}
                />
                <input
                  className={inputClass}
                  value={form.experience}
                  placeholder="경력"
                  onChange={(e) => setField(t.id, "experience", e.target.value)}
                />
                <textarea
                  className={`${inputClass} resize-y`}
                  rows={3}
                  value={form.bio}
                  placeholder="자기소개 (카드 노출)"
                  onChange={(e) => setField(t.id, "bio", e.target.value)}
                />
                <GenderSelect
                  value={(form.gender === "FEMALE" ? "FEMALE" : form.gender === "MALE" ? "MALE" : "") as ProfileGender | ""}
                  onChange={(g) => setField(t.id, "gender", g)}
                />

                <button
                  type="button"
                  disabled={savingId === t.id}
                  onClick={() => void saveTeacher(t.id)}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingId === t.id ? "저장 중..." : `${t.name} 정보 저장`}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
