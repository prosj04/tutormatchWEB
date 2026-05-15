"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";

import { formatDoneTime } from "@/lib/study-plan-dates";

import { GripIcon, TrashIcon } from "./icons";
import type { StudyTask } from "./types";

type SortableTaskItemProps = {
  task: StudyTask;
  onToggle: (taskId: string, isDone: boolean) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onDelete: (taskId: string) => void;
};

export function SortableTaskItem({
  task,
  onToggle,
  onTitleChange,
  onDelete,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(task.title);
  }, [task.title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  function commitTitle() {
    setEditing(false);
    const trimmed = draft.trim() || "새 할 일";
    setDraft(trimmed);
    if (trimmed !== task.title) onTitleChange(task.id, trimmed);
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 hover:border-gray-100 hover:bg-background/60"
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-text-light hover:text-text-mid active:cursor-grabbing"
        aria-label="순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      <input
        type="checkbox"
        checked={task.isDone}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setDraft(task.title);
                setEditing(false);
              }
            }}
            className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1 text-sm outline-none focus:border-primary"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`block w-full truncate text-left text-sm ${
              task.isDone ? "text-text-light line-through" : "text-text-dark"
            }`}
          >
            {task.title}
          </button>
        )}
        {task.isDone && task.doneAt && (
          <p className="mt-0.5 text-xs text-text-light">{formatDoneTime(task.doneAt)}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded-lg p-1.5 text-text-light opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        aria-label="삭제"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
