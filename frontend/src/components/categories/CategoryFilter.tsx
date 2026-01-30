import { useState } from 'react';
import { useTasks } from '../../context/TaskContext';

export function CategoryFilter() {
  const { categories, filter, setFilter, createCategory, deleteCategory } = useTasks();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#E95420');

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory({ name: newCategoryName, color: newCategoryColor });
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2">
        <select
          value={filter.categoryId || ''}
          onChange={(e) => setFilter({ categoryId: e.target.value || null })}
          className="flex-1 px-3 py-1.5 rounded text-sm focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Tasks</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowNewCategory(!showNewCategory)}
          className="px-2 py-1.5 rounded text-sm font-medium"
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          title="Add category"
        >
          +
        </button>

        {filter.categoryId && (
          <button
            onClick={() => {
              if (confirm('Delete this category?')) {
                deleteCategory(filter.categoryId!);
                setFilter({ categoryId: null });
              }
            }}
            className="px-2 py-1.5 rounded text-sm"
            style={{ color: 'var(--text-muted)' }}
            title="Delete selected category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {showNewCategory && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="w-full px-3 py-1.5 rounded text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCategory();
              if (e.key === 'Escape') setShowNewCategory(false);
            }}
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <button
              onClick={handleCreateCategory}
              className="flex-1 px-3 py-1 rounded text-sm text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowNewCategory(false)}
              className="px-3 py-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
