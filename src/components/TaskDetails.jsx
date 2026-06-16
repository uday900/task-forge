import { useTasks } from '../context/TaskContext';
import AttachmentsList from './AttachmentsList';
import { deleteAttachment, deleteAttachmentsForTask } from '../utils/attachmentUtils';

const priorityConfig = {
  low: {
    label: 'Low',
    icon: '🟢',
    bg: 'bg-green-500/15',
    color: 'text-green-400',
  },
  medium: {
    label: 'Medium',
    icon: '🔵',
    bg: 'bg-blue-500/15',
    color: 'text-blue-400',
  },
  high: {
    label: 'High',
    icon: '🟠',
    bg: 'bg-orange-500/15',
    color: 'text-orange-400',
  },
  urgent: {
    label: 'Urgent',
    icon: '🔴',
    bg: 'bg-rose-500/15',
    color: 'text-rose-400',
  },
};

export default function TaskDetails({ task, onClose, onEdit }) {
  const { currentWorkspace, state, dispatch } = useTasks();

  const assignee =
    currentWorkspace?.team?.find(
      (member) => member.id === task.assignedTo
    ) || state.user.id === task.assignedTo;

  const priority =
    priorityConfig[task.priority] || priorityConfig.medium;

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No due date';

  const formattedCreatedDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not available';

  const handleRemoveAttachment = async (attachment) => {
    await deleteAttachment(attachment.path);
    const updatedAttachments = (task.attachments || []).filter(
      (att) => att.id !== attachment.id
    );
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        ...task,
        attachments: updatedAttachments,
      },
    });
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Delete this task? This action cannot be undone.')) {
      try {
        // Delete all attachment files from disk
        if (task.attachments && task.attachments.length > 0) {
          await deleteAttachmentsForTask(task.attachments);
        }
        
        dispatch({ type: 'DELETE_TASK', payload: task.id });
        dispatch({ type: 'CLOSE_TASK_MODAL' });
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task attachments. Please try again.');
      }
    }
  };

  return (
    <div className="relative rounded-3xl bg-slate-900 p-8 text-white">
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="
          absolute
          right-5
          top-5
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-slate-800
          text-slate-400
          transition-all
          hover:bg-slate-700
          hover:text-white
        "
      >
        ✕
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-bold">
            {task.title}
          </h2>

          {task.completed && (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              ✓ Completed
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 rounded-2xl bg-slate-800/40 p-3">
        <h3 className="mb-3 text-xs uppercase tracking-wider text-slate-400">
          Description
        </h3>

        <p className="leading-7 text-slate-300">
          {task.description || 'No description provided'}
        </p>
      </div>

      {/* Metadata Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Priority */}
        <div className="rounded-2xl bg-slate-800/50 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            Priority
          </p>

          <span
            className={`
              inline-flex
              items-center
              gap-2
              rounded-full
              px-3
              py-1
              text-sm
              font-medium
              ${priority.bg}
              ${priority.color}
            `}
          >
            <span>{priority.icon}</span>
            {priority.label}
          </span>
        </div>

        {/* Due Date */}
        <div className="rounded-2xl bg-slate-800/50 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            Due Date
          </p>

          <p className="text-slate-200">
            {formattedDueDate}
          </p>
        </div>

        {/* Assigned To */}
        {currentWorkspace?.teamEnabled && (
          <div className="rounded-2xl bg-slate-800/50 p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Assigned To
            </p>

            <p className="text-slate-200">
              {assignee?.name || 'Unassigned'}
            </p>
          </div>
        )}

        {/* Created */}
        <div className="rounded-2xl bg-slate-800/50 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            Created
          </p>

          <p className="text-slate-200">
            {formattedCreatedDate}
          </p>
        </div>
      </div>

      {/* Attachments Section */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mb-8 rounded-2xl bg-slate-800/40 p-4">
          <h3 className="mb-4 text-xs uppercase tracking-wider text-slate-400">
            Attachments ({task.attachments.length})
          </h3>
          <AttachmentsList
            attachments={task.attachments}
            onRemove={handleRemoveAttachment}
            isEditable={true}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onClose}
          className="
            flex-1
            rounded-2xl
            bg-slate-800
            py-3.5
            font-medium
            text-slate-300
            transition-colors
            hover:bg-slate-700
          "
        >
          Close
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="
            flex-1
            rounded-2xl
            bg-blue-500
            py-3.5
            font-semibold
            text-white
            shadow-lg
            shadow-blue-500/20
            transition-all
            hover:bg-blue-400
          "
        >
          Edit Task
        </button>

        <button
          type="button"
          onClick={handleDeleteTask}
          className="
            flex-1
            rounded-2xl
            bg-rose-600
            py-3.5
            font-semibold
            text-white
            shadow-lg
            shadow-rose-600/20
            transition-all
            hover:bg-rose-500
          "
        >
          Delete Task
        </button>
      </div>
    </div>
  );
}
