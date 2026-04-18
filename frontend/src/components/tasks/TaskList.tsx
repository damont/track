import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTasks } from '../../context/TaskContext';
import { useApp } from '../../context/AppContext';
import { TaskItem } from './TaskItem';

export function TaskList() {
  const {
    tasks,
    selectedTask,
    createTask,
    reorderTask,
    filter,
    setFilter,
    isLoading,
  } = useTasks();
  const { selectedProjectId, openTask } = useApp();

  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = tasks.findIndex((t) => t.id === active.id);
    const overIndex = tasks.findIndex((t) => t.id === over.id);

    const targetTask = tasks[overIndex];
    const newOrder =
      activeIndex > overIndex
        ? targetTask.overall_order - 1
        : targetTask.overall_order + 1;
    reorderTask(active.id as string, 'overall', undefined, undefined, newOrder);
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim() || !selectedProjectId) return;
    const task = await createTask({
      name: newTaskName.trim(),
      project_id: selectedProjectId,
    });
    setNewTaskName('');
    setShowNewTask(false);
    openTask(task.id, selectedProjectId);
  };

  const filterChipStyle = (active: boolean) => ({
    padding: '4px 12px',
    borderRadius: 9999,
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--panel-border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    background: active ? 'var(--accent-soft)' : 'transparent',
  });

  return (
    <div className="h-full flex flex-col" style={{ gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter({ active: true })} style={filterChipStyle(filter.active === true)}>
          Active
        </button>
        <button onClick={() => setFilter({ active: false })} style={filterChipStyle(filter.active === false)}>
          Completed
        </button>
        <button onClick={() => setFilter({ active: null })} style={filterChipStyle(filter.active === null)}>
          All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No protocols yet.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onSelect={() => openTask(task.id, selectedProjectId)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div>
        {showNewTask ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="New sequence"
              className="accent-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTask();
                if (e.key === 'Escape') setShowNewTask(false);
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreateTask} className="pill-tab is-active" style={{ flex: 1, justifyContent: 'center' }}>
                Add
              </button>
              <button onClick={() => setShowNewTask(false)} className="pill-tab">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="ghost-btn" style={{ width: '100%' }} onClick={() => setShowNewTask(true)}>
            <span style={{ fontSize: 14 }}>＋</span> New Sequence
          </button>
        )}
      </div>
    </div>
  );
}
