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
      className={`chk st-task${task.isDone ? " on" : ""}`}
    >
      <button
        type="button"
        className="grip"
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
      />

      <div className="g">
        {editing ? (
          <input
            ref={inputRef}
            className="ti"
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
          />
        ) : (
          <button type="button" className="tt" onClick={() => setEditing(true)}>
            {task.title}
          </button>
        )}
        {task.isDone && task.doneAt && (
          <span className="dn">{formatDoneTime(task.doneAt)}</span>
        )}
      </div>

      <button type="button" className="del" onClick={() => onDelete(task.id)} aria-label="삭제">
        <TrashIcon />
      </button>
    </li>
  );
}
