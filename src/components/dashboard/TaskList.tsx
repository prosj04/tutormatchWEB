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
          <ul className="space-y-1">
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

      <button
        type="button"
        onClick={onAddTask}
        className="mt-3 w-full rounded-xl border border-dashed border-gray-200 py-3 text-sm font-medium text-text-secondary transition hover:border-primary hover:text-primary"
      >
        할 일 추가
      </button>
    </div>
  );
}
