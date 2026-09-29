"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";

import { SortableTaskItem } from "./SortableTaskItem";
import type { StudyTask } from "./types";

type TaskListProps = {
  tasks: StudyTask[];
  onReorder: (tasks: StudyTask[]) => void;
  onToggle: (taskId: string, isDone: boolean) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
};

export function TaskList({
  tasks,
  onReorder,
  onToggle,
  onTitleChange,
  onDelete,
  onAddTask,
}: TaskListProps) {
  const btnAddTask = usePortalCopy("student_task_list", "btn_add_task", "할 일 추가");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, i) => ({
      ...t,
      order: i,
    }));
    onReorder(reordered);
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="st-list">
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onTitleChange={onTitleChange}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <button type="button" onClick={onAddTask} className="st-add">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        {btnAddTask}
      </button>
    </div>
  );
}
