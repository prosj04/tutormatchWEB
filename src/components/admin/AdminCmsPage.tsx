"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "content" | "testimonials" | "faq" | "images";
type SaveStatus = "idle" | "saving" | "saved" | "error";

type CmsContent = Record<string, Record<string, string>>;

type TestimonialRow = {
  id: string;
  quote: string;
  author: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
};

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary";
const textareaClass = `${inputClass} resize-y`;

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "content", label: "텍스트 콘텐츠" },
  { id: "testimonials", label: "후기 관리" },
  { id: "faq", label: "FAQ 관리" },
  { id: "images", label: "이미지 관리" },
];

const contentSections = [
  {
    id: "hero",
    title: "HERO 섹션",
    fields: [
      { label: "메인 헤드라인", section: "hero", keyName: "headline", kind: "textarea", rows: 2 },
      { label: "서브텍스트", section: "hero", keyName: "subtext", kind: "textarea", rows: 3 },
      { label: "버튼1 텍스트", section: "hero", keyName: "cta_primary", kind: "input" },
      { label: "버튼2 텍스트", section: "hero", keyName: "cta_secondary", kind: "input" },
    ],
  },
  {
    id: "stats",
    title: "통계 섹션",
    fields: [
      { label: "통계 1 숫자", section: "stats", keyName: "stat1_number", kind: "input" },
      { label: "통계 1 레이블", section: "stats", keyName: "stat1_label", kind: "input" },
      { label: "통계 2 숫자", section: "stats", keyName: "stat2_number", kind: "input" },
      { label: "통계 2 레이블", section: "stats", keyName: "stat2_label", kind: "input" },
      { label: "통계 3 숫자", section: "stats", keyName: "stat3_number", kind: "input" },
      { label: "통계 3 레이블", section: "stats", keyName: "stat3_label", kind: "input" },
    ],
  },
  {
    id: "features",
    title: "진행 방식 섹션",
    fields: [
      { label: "섹션 제목", section: "features", keyName: "section_title", kind: "input" },
      { label: "Step 1 제목", section: "features", keyName: "step1_title", kind: "input" },
      { label: "Step 1 설명", section: "features", keyName: "step1_desc", kind: "textarea", rows: 2 },
      { label: "Step 2 제목", section: "features", keyName: "step2_title", kind: "input" },
      { label: "Step 2 설명", section: "features", keyName: "step2_desc", kind: "textarea", rows: 2 },
      { label: "Step 3 제목", section: "features", keyName: "step3_title", kind: "input" },
      { label: "Step 3 설명", section: "features", keyName: "step3_desc", kind: "textarea", rows: 2 },
    ],
  },
  {
    id: "cta",
    title: "하단 CTA 섹션",
    fields: [
      { label: "헤드라인", section: "cta", keyName: "headline", kind: "textarea", rows: 2 },
      { label: "서브텍스트", section: "cta", keyName: "subtext", kind: "input" },
      { label: "버튼 텍스트", section: "cta", keyName: "button", kind: "input" },
    ],
  },
] as const;

export function AdminCmsPage() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [tab, setTab] = useState<Tab>("content");
  const [content, setContent] = useState<CmsContent>({});
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    stats: true,
    features: true,
    cta: true,
  });
  const [modal, setModal] = useState<
    | { kind: "testimonial"; item: TestimonialRow | null }
    | { kind: "faq"; item: FaqRow | null }
    | null
  >(null);
  const hasNoContent =
    !loading &&
    Object.keys(content).length === 0 &&
    testimonials.length === 0 &&
    faqs.length === 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, testimonialRes, faqRes] = await Promise.all([
        fetch("/api/admin/cms/content"),
        fetch("/api/admin/cms/testimonials"),
        fetch("/api/admin/cms/faq"),
      ]);

      if (contentRes.ok) setContent((await contentRes.json()) as CmsContent);
      if (testimonialRes.ok) {
        setTestimonials((await testimonialRes.json()) as TestimonialRow[]);
      }
      if (faqRes.ok) setFaqs((await faqRes.json()) as FaqRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchContent(section: string, key: string, value: string) {
    const res = await fetch("/api/admin/cms/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, key, value }),
    });
    if (!res.ok) throw new Error("Content save failed");
    setContent((current) => ({
      ...current,
      [section]: { ...(current[section] ?? {}), [key]: value },
    }));
  }

  async function initDefaults() {
    const res = await fetch("/api/admin/cms/init", { method: "POST" });
    if (res.ok) await load();
  }

  async function toggleTestimonial(item: TestimonialRow) {
    const res = await fetch(`/api/admin/cms/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) await load();
  }

  async function toggleFaq(item: FaqRow) {
    const res = await fetch(`/api/admin/cms/faq/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) await load();
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("후기를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/cms/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function deleteFaq(id: string) {
    if (!confirm("FAQ를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/cms/faq/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function reorderTestimonials(activeId: string, overId: string) {
    const oldIndex = testimonials.findIndex((item) => item.id === activeId);
    const newIndex = testimonials.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(testimonials, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setTestimonials(next);

    await Promise.all(
      next.map((item) =>
        fetch(`/api/admin/cms/testimonials/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: item.order }),
        }),
      ),
    );
  }

  async function reorderFaqs(activeId: string, overId: string) {
    const oldIndex = faqs.findIndex((item) => item.id === activeId);
    const newIndex = faqs.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(faqs, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setFaqs(next);

    await Promise.all(
      next.map((item) =>
        fetch(`/api/admin/cms/faq/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: item.order }),
        }),
      ),
    );
  }

  function handleTestimonialDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    void reorderTestimonials(String(event.active.id), String(event.over.id));
  }

  function handleFaqDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    void reorderFaqs(String(event.active.id), String(event.over.id));
  }

  return (
    <div className="relative">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="fixed right-6 top-20 z-40 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg"
      >
        홈페이지 미리보기
      </a>

      <div>
        <h2 className="text-2xl font-black text-text-primary">홈페이지 관리</h2>
        <p className="mt-2 text-sm text-text-secondary">
          변경사항은 최대 60초 내에 홈페이지에 반영됩니다.
        </p>
      </div>

      {hasNoContent ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-950">기본 콘텐츠가 없습니다.</p>
          <button
            type="button"
            onClick={() => void initDefaults()}
            className="mt-3 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
          >
            기본값으로 초기화
          </button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-4 py-3 text-sm font-bold ${
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-text-secondary">불러오는 중…</p>
      ) : (
        <div className="mt-8">
          {tab === "content" ? (
            <div className="space-y-4">
              {contentSections.map((section) => (
                <section
                  key={section.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((current) => ({
                        ...current,
                        [section.id]: !current[section.id],
                      }))
                    }
                    className="flex w-full items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="text-lg font-black text-text-primary">
                      {section.title}
                    </span>
                    <span className="text-text-muted">
                      {openSections[section.id] ? "접기" : "펼치기"}
                    </span>
                  </button>
                  {openSections[section.id] ? (
                    <div className="grid gap-4 border-t border-gray-100 p-6 lg:grid-cols-2">
                      {section.fields.map((field) => (
                        <AutoSaveField
                          key={`${field.section}-${field.keyName}`}
                          label={field.label}
                          section={field.section}
                          fieldKey={field.keyName}
                          value={content[field.section]?.[field.keyName] ?? ""}
                          kind={field.kind}
                          rows={"rows" in field ? field.rows : undefined}
                          onSave={patchContent}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          ) : null}

          {tab === "testimonials" ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-text-primary">후기 관리</h3>
                <button
                  type="button"
                  onClick={() => setModal({ kind: "testimonial", item: null })}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  후기 추가
                </button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTestimonialDragEnd}
              >
                <SortableContext
                  items={testimonials.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-5 space-y-3">
                    {testimonials.map((item) => (
                      <SortableTestimonial
                        key={item.id}
                        item={item}
                        onToggle={() => void toggleTestimonial(item)}
                        onEdit={() => setModal({ kind: "testimonial", item })}
                        onDelete={() => void deleteTestimonial(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          ) : null}

          {tab === "faq" ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-text-primary">FAQ 관리</h3>
                <button
                  type="button"
                  onClick={() => setModal({ kind: "faq", item: null })}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  FAQ 추가
                </button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFaqDragEnd}
              >
                <SortableContext
                  items={faqs.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-5 space-y-3">
                    {faqs.map((item) => (
                      <SortableFaq
                        key={item.id}
                        item={item}
                        onToggle={() => void toggleFaq(item)}
                        onEdit={() => setModal({ kind: "faq", item })}
                        onDelete={() => void deleteFaq(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          ) : null}

          {tab === "images" ? (
            <ImageManager
              imageUrl={content.hero?.bg_image_url ?? ""}
              onSave={(value) => patchContent("hero", "bg_image_url", value)}
            />
          ) : null}
        </div>
      )}

      {modal ? (
        <EditModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function AutoSaveField({
  label,
  section,
  fieldKey,
  value,
  kind,
  rows,
  onSave,
}: {
  label: string;
  section: string;
  fieldKey: string;
  value: string;
  kind: "input" | "textarea";
  rows?: number;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const firstRender = useRef(true);
  const latestSavedValue = useRef(value);

  useEffect(() => {
    setLocalValue(value);
    latestSavedValue.current = value;
  }, [value]);

  const save = useCallback(
    async (nextValue: string) => {
      if (nextValue === latestSavedValue.current) return;
      setStatus("saving");
      try {
        await onSave(section, fieldKey, nextValue);
        latestSavedValue.current = nextValue;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [fieldKey, onSave, section],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void save(localValue);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [localValue, save]);

  return (
    <label className="block rounded-xl bg-background p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <SaveIndicator status={status} />
      </div>
      {kind === "textarea" ? (
        <textarea
          value={localValue}
          rows={rows ?? 2}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => void save(localValue)}
          className={textareaClass}
        />
      ) : (
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => void save(localValue)}
          className={inputClass}
        />
      )}
    </label>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") return <span className="text-xs text-text-muted">저장 중...</span>;
  if (status === "saved") return <span className="text-xs font-semibold text-emerald-700">저장됨 ✓</span>;
  if (status === "error") return <span className="text-xs font-semibold text-accent">저장 실패</span>;
  return <span className="text-xs text-text-muted">자동 저장</span>;
}

function SortableTestimonial({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: TestimonialRow;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid items-center gap-4 rounded-xl border border-gray-100 bg-background p-4 md:grid-cols-[2rem_1fr_12rem_8rem_8rem]"
    >
      <button
        type="button"
        className="cursor-grab text-xl text-text-muted"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <p className="line-clamp-2 text-sm text-text-secondary">{item.quote}</p>
      <p className="text-sm font-semibold text-text-primary">{item.author}</p>
      <ToggleButton active={item.isActive} onClick={onToggle} />
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-primary hover:underline">
          수정
        </button>
        <button type="button" onClick={onDelete} className="text-sm font-semibold text-accent hover:underline">
          삭제
        </button>
      </div>
    </div>
  );
}

function SortableFaq({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: FaqRow;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid items-center gap-4 rounded-xl border border-gray-100 bg-background p-4 md:grid-cols-[2rem_1fr_8rem_8rem]"
    >
      <button
        type="button"
        className="cursor-grab text-xl text-text-muted"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <p className="line-clamp-2 text-sm font-semibold text-text-primary">{item.question}</p>
      <ToggleButton active={item.isActive} onClick={onToggle} />
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-primary hover:underline">
          수정
        </button>
        <button type="button" onClick={onDelete} className="text-sm font-semibold text-accent hover:underline">
          삭제
        </button>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-text-muted"
      }`}
    >
      {active ? "활성" : "비활성"}
    </button>
  );
}

function EditModal({
  modal,
  onClose,
  onSaved,
}: {
  modal:
    | { kind: "testimonial"; item: TestimonialRow | null }
    | { kind: "faq"; item: FaqRow | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [quote, setQuote] = useState(
    modal.kind === "testimonial" ? modal.item?.quote ?? "" : "",
  );
  const [author, setAuthor] = useState(
    modal.kind === "testimonial" ? modal.item?.author ?? "" : "",
  );
  const [imageUrl, setImageUrl] = useState(
    modal.kind === "testimonial" ? modal.item?.imageUrl ?? "" : "",
  );
  const [question, setQuestion] = useState(
    modal.kind === "faq" ? modal.item?.question ?? "" : "",
  );
  const [answer, setAnswer] = useState(modal.kind === "faq" ? modal.item?.answer ?? "" : "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/cms/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { imageUrl: string };
      setImageUrl(data.imageUrl);
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      if (modal.kind === "testimonial") {
        const payload = { quote, author, imageUrl: imageUrl || null };
        const url = modal.item
          ? `/api/admin/cms/testimonials/${modal.item.id}`
          : "/api/admin/cms/testimonials";
        const method = modal.item ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
      } else {
        const payload = { question, answer };
        const url = modal.item ? `/api/admin/cms/faq/${modal.item.id}` : "/api/admin/cms/faq";
        const method = modal.item ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
      }
      onSaved();
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-black text-text-primary">
          {modal.kind === "testimonial" ? "후기 편집" : "FAQ 편집"}
        </h3>
        {modal.kind === "testimonial" ? (
          <div className="mt-4 space-y-3">
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className={textareaClass}
              rows={5}
              placeholder="후기 내용"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={inputClass}
              placeholder="작성자 (예: 고2 · 수학 · 학부모)"
            />
            <div>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
                placeholder="이미지 URL"
              />
              <label className="mt-2 inline-flex cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-text-secondary">
                {uploading ? "업로드 중..." : "사진 업로드"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void uploadImage(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={textareaClass}
              rows={2}
              placeholder="질문"
            />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={textareaClass}
              rows={5}
              placeholder="답변"
            />
          </div>
        )}
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2 text-sm">
            취소
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageManager({
  imageUrl,
  onSave,
}: {
  imageUrl: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [preview, setPreview] = useState(imageUrl);
  const [status, setStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    setPreview(imageUrl);
  }, [imageUrl]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setStatus("saving");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/cms/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { imageUrl: string };
      setPreview(data.imageUrl);
      await onSave(data.imageUrl);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  async function remove() {
    setStatus("saving");
    try {
      setPreview("");
      await onSave("");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-text-primary">이미지 관리</h3>
      <div className="mt-5 grid gap-6 md:grid-cols-[32rem_1fr]">
        <div className="flex aspect-square max-w-[512px] items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Hero background" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-text-muted">이미지 없음</span>
          )}
        </div>
        <div>
          <p className="text-sm font-black text-text-primary">Hero 배경 이미지</p>
          <p className="mt-2 text-sm text-text-secondary">권장: 1920x1080, JPG/WebP</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {preview ? (
              <button
                type="button"
                onClick={() => void remove()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-accent"
              >
                이미지 삭제
              </button>
            ) : null}
          </div>
          <div className="mt-4">
            <SaveIndicator status={status} />
          </div>
        </div>
      </div>
    </section>
  );
}
