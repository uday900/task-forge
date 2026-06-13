import { useState } from 'react';
import { useTasks } from '../context/TaskContext';

export default function TaskForm({ onClose, task }) {
  const { currentWorkspace, dispatch, state } = useTasks();
  const team = currentWorkspace?.team || [];

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    deadline: task?.dueDate || '',
    assignee: task?.assignedTo || '',
  });

  const [titleError, setTitleError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);

    if (task) {
      // Edit mode - update existing task
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: task.id,
          title: form.title,
          description: form.description,
          priority: form.priority,
          dueDate: form.deadline || null,
          assignedTo: form.assignee || null,
        },
      });
    } else {
      // Create mode - add new task
      dispatch({
        type: 'ADD_TASK',
        payload: {
          title: form.title,
          description: form.description,
          priority: form.priority,
          dueDate: form.deadline || null,
          assignedTo: form.assignee || null,
        },
      });
    }

    if (!task) {
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        assignee: '',
      });
    }

    if (onClose) onClose();
  };

  const isEditMode = !!task;

  return (
    <div className="bg-slate-900 rounded-3xl p-8 relative">
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white font-bold text-xl transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      <h2 className="text-3xl font-bold text-white mb-6">
        {isEditMode ? 'Edit Task' : 'Create Task'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">
            Task Title *
          </label>
          <input
            placeholder="Enter task title"
            className="
          w-full
          rounded-2xl
          bg-slate-800
          px-4
          py-3
          text-white
          outline-none
          focus:ring-2
          focus:ring-blue-500
        "
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              if (titleError) setTitleError(false);
            }}
            required
          />
          {titleError && (
            <p className="text-red-500 text-sm mt-2">Title is required</p>
          )}
        </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Description
        </label>
        <textarea
          rows={4}
          placeholder="Describe your task..."
          className="
        w-full
        rounded-2xl
        bg-slate-800
        px-4
        py-3
        text-white
        outline-none
        resize-none
        focus:ring-2
        focus:ring-blue-500
      "
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {/* Priority */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Priority
        </label>

        <select
          className="
        w-full
        rounded-2xl
        bg-slate-800
        px-4
        py-3
        text-white
        outline-none
      "
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🟠 High</option>
          <option value="urgent">🔴 Urgent</option>
        </select>
      </div>

      {/* Due Date */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Due Date
        </label>

        <input
          type="datetime-local"
          className="
        w-full
        rounded-2xl
        bg-slate-800
        px-4
        py-3
        text-white
        outline-none
      "
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </div>

      {/* Assignee */}
      {currentWorkspace?.teamEnabled && team.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">
            Assign To
          </label>

          <select
            className="
          w-full
          rounded-2xl
          bg-slate-800
          px-4
          py-3
          text-white
          outline-none
        "
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
          >
            <option value="">Select an assignee</option>
            <option value={state.user.id}>Assign to me</option>

            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="
        flex-1
        rounded-2xl
        bg-slate-800
        py-3
        font-medium
        text-slate-300
        hover:bg-slate-700
      "
        >
          Cancel
        </button>

        <button
          type="submit"
          className="
        flex-1
        rounded-2xl
        bg-blue-500
        py-3
        font-semibold
        text-white
        shadow-lg
        shadow-blue-500/20
        hover:bg-blue-400
        transition-all
      "
        >
          {isEditMode ? 'Update Task' : 'Create Task'}
        </button>
      </div>
      </form>
    </div>
  );
}
