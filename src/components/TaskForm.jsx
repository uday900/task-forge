import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import AttachmentInput from './AttachmentInput';
import AttachmentsList from './AttachmentsList';
import { deleteAttachmentsForTask, saveAttachment } from '../utils/attachmentUtils';

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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(task?.attachments || []);
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);
    setIsSaving(true);
    setSaveError('');

    try {
      // Save new attachments to disk
      const newAttachments = [];
      for (const fileItem of selectedFiles) {
        const attachment = await saveAttachment(fileItem.file);
        newAttachments.push(attachment);
      }

      const allAttachments = [...existingAttachments, ...newAttachments];

      if (task) {
        // Edit mode - update existing task
        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            ...task,
            title: form.title,
            description: form.description,
            priority: form.priority,
            dueDate: form.deadline || null,
            assignedTo: form.assignee || null,
            attachments: allAttachments,
          },
        });

        if (removedAttachments.length > 0) {
          await deleteAttachmentsForTask(removedAttachments);
        }
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
            attachments: allAttachments,
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
        setSelectedFiles([]);
        setExistingAttachments([]);
        setRemovedAttachments([]);
      }

      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setSaveError('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveExistingAttachment = (attachment) => {
    setExistingAttachments((prev) =>
      prev.filter((att) => att.id !== attachment.id)
    );
    setRemovedAttachments((prev) => [...prev, attachment]);
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
        disabled={isSaving}
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
          px-3
          py-2
          text-white
          outline-none
          focus:ring-2
          focus:ring-blue-500
          disabled:opacity-50
        "
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              if (titleError) setTitleError(false);
            }}
            disabled={isSaving}
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
          px-3
          py-2
          text-white
          outline-none
          resize-none
          focus:ring-2
          focus:ring-blue-500
          disabled:opacity-50
        "
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isSaving}
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
          disabled:opacity-50
        "
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            disabled={isSaving}
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
          disabled:opacity-50
        "
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            disabled={isSaving}
          />
        </div>

        {/* Assignee */}
        {currentWorkspace?.teamEnabled && team.length > 0 && (
          <div className="mb-4">
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
            disabled:opacity-50
          "
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              disabled={isSaving}
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

        {/* Attachments Section */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">
            Attachments
          </label>

          <AttachmentInput
            selectedFiles={selectedFiles}
            onFilesSelected={setSelectedFiles}
          />

          {/* Existing Attachments in Edit Mode */}
          {isEditMode && existingAttachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Current Attachments
              </p>
              <AttachmentsList
                attachments={existingAttachments}
                onRemove={handleRemoveExistingAttachment}
                isEditable={true}
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 mb-4">
            {saveError}
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
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
            disabled={isSaving}
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
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
