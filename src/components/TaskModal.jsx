function TaskModal({
  isOpen,
  isEditing,
  taskFormState,
  onFormChange,
  editingAttachments,
  onAttachmentsChange,
  onRemoveAttachment,
  onShowImagePreview,
  onSubmit,
  onDelete,
  onClose,
  assigneeOptions,
  listOptions
}) {
  return (
    <div className={`modal-backdrop ${isOpen ? '' : 'hidden'}`} id="taskModal" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" id="taskForm" onSubmit={onSubmit}>
        <div className="modal-head">
          <h2 id="taskModalTitle">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" className="icon-button" data-close="task" onClick={onClose}>
            x
          </button>
        </div>
        <div className="form-grid">
          <label className="span-2">
            Title
            <input
              value={taskFormState.title}
              onChange={(event) => onFormChange('title', event.target.value)}
              id="taskTitle"
              required
              maxLength={160}
              autoComplete="off"
            />
          </label>
          <label className="span-2">
            Description
            <textarea
              value={taskFormState.description}
              onChange={(event) => onFormChange('description', event.target.value)}
              id="taskDescription"
              rows={4}
            />
          </label>
          <label>
            Priority
            <select value={taskFormState.priority} onChange={(event) => onFormChange('priority', event.target.value)} id="taskPriority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label>
            Deadline
            <input
              type="date"
              value={taskFormState.deadline}
              onChange={(event) => onFormChange('deadline', event.target.value)}
              id="taskDeadline"
            />
          </label>
          <label>
            Assign to
            <select value={taskFormState.assignee_id} onChange={(event) => onFormChange('assignee_id', event.target.value)} id="taskAssignee">
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Repeat
            <select value={taskFormState.repeat} onChange={(event) => onFormChange('repeat', event.target.value)} id="taskRepeat">
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label>
            List
            <select value={taskFormState.list_id} onChange={(event) => onFormChange('list_id', event.target.value)} id="taskList">
              <option value="">No list</option>
              {listOptions.slice(1).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Images
            <input id="taskAttachments" type="file" accept="image/*" multiple onChange={onAttachmentsChange} />
          </label>
        </div>
        <div className="attachment-preview" id="attachmentPreview">
          {editingAttachments.map((src, index) => (
            <div
              key={index}
              className="attachment-thumb"
              title="Preview image"
              onClick={() => onShowImagePreview(index)}
            >
              <img src={src} alt={`Attachment ${index + 1}`} />
              <button
                type="button"
                className="thumb-remove"
                title="Remove image"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveAttachment(index);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className={`button danger ${isEditing ? '' : 'hidden'}`} id="deleteTaskBtn" onClick={onDelete}>
            Delete
          </button>
          <span />
          <button type="button" className="button secondary" data-close="task" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskModal;
