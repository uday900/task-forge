import { initials, displayMemberName, isOverdue, overdueDays } from '../utils';

function TaskRow({ task, team, onToggleDone, onEdit }) {
  const member = team.find((member) => member.id === task.assignee_id) || null;

  return (
    <article
      className={`task-row ${task.done ? 'done' : ''} ${isOverdue(task) ? 'overdue-row' : ''}`}
      onClick={() => onEdit(task)}
    >
      <button
        type="button"
        className={`complete-circle ${task.done ? 'checked' : ''}`}
        title={task.done ? 'Mark incomplete' : 'Mark complete'}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        onClick={(event) => {
          event.stopPropagation();
          onToggleDone(task);
        }}
      />
      <div className="task-title">{task.title}</div>
      <span className={`badge priority-${task.priority}`}>{task.priority}</span>
      <span className="badge repeat-badge">{task.repeat}</span>
      <span className="badge overdue-badge" style={{ visibility: isOverdue(task) ? 'visible' : 'hidden' }}>
        {isOverdue(task) ? `Overdue ${overdueDays(task)}d` : ''}
      </span>
      <span className="deadline">{task.deadline || 'No date'}</span>
      <span className="avatar" style={{ background: member?.color || '#94a3b8' }} title={displayMemberName(member)}>
        {member ? initials(member.name) : '--'}
      </span>
      <span className="attachment-icon">{task.attachments?.length ? 'Att' : ''}</span>
    </article>
  );
}

export default TaskRow;
