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
import { TaskItem } from './TaskItem';
import { ProjectFilter } from '../projects/ProjectFilter';

export function TaskList() {
  const {
    tasks,
    selectedTask,
    selectTask,
    createTask,
    reorderTask,
    filter,
    setFilter,
    isLoading,
  } = useTasks();

  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = tasks.findIndex(t => t.id === active.id);
      const overIndex = tasks.findIndex(t => t.id === over.id);

      if (filter.categoryId) {
        // Category view: place adjacent to the target task (±1)
        // to minimize disruption to the global order
        const targetTask = tasks[overIndex];
        const newOrder = activeIndex > overIndex
          ? targetTask.overall_order - 1  // moving up: just above target
          : targetTask.overall_order + 1; // moving down: just below target
        reorderTask(
          active.id as string,
          'overall',
          undefined,
          undefined,
          newOrder
        );
      } else {
        // Global view: use midpoint placement between neighbors
        const beforeTaskId = overIndex > 0 ? tasks[overIndex - 1]?.id : undefined;
        const afterTaskId = tasks[overIndex]?.id;

        if (activeIndex > overIndex) {
          reorderTask(
            active.id as string,
            'overall',
            beforeTaskId,
            afterTaskId
          );
        } else {
          reorderTask(
            active.id as string,
            'overall',
            afterTaskId,
            tasks[overIndex + 1]?.id
          );
        }
      }
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;
    const task = await createTask({
      name: newTaskName,
      project_id: filter.projectId || undefined,
    });
    setNewTaskName('');
    setShowNewTask(false);
    selectTask(task.id);
  };

  const filterTabStyle = (active: boolean) => ({
    backgroundColor: active ? 'var(--selected-bg)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  });

  return (
    <div className="h-full flex flex-col">
      <ProjectFilter />

      {/* Filter tabs */}
      <div className="px-4 py-2 flex gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setFilter({ active: true })}
          className="px-3 py-1 text-sm rounded"
          style={filterTabStyle(filter.active === true)}
        >
          Active
        </button>
        <button
          onClick={() => setFilter({ active: false })}
          className="px-3 py-1 text-sm rounded"
          style={filterTabStyle(filter.active === false)}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter({ active: null })}
          className="px-3 py-1 text-sm rounded"
          style={filterTabStyle(filter.active === null)}
        >
          All
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>No tasks found</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onSelect={() => selectTask(task.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* New task */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        {showNewTask ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Task name"
              className="w-full px-3 py-2 rounded text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-raised)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTask();
                if (e.key === 'Escape') setShowNewTask(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateTask}
                className="flex-1 px-3 py-1 rounded text-sm text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Add Task
              </button>
              <button
                onClick={() => setShowNewTask(false)}
                className="px-3 py-1 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTask(true)}
            className="w-full px-4 py-2 text-left rounded text-sm"
            style={{
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
            }}
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
}
