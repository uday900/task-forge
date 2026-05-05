import { isOverdue } from '../utils';
import TaskRow from './TaskRow';

function TaskBoard({ filteredTasks, team, onToggleDone, onEdit }) {
  const completeTasks = filteredTasks.filter((task) => task.done);
  const openTasks = filteredTasks.filter((task) => !task.done);
  const overdueTasks = openTasks.filter(isOverdue);
  const upcomingTasks = openTasks.filter((task) => !isOverdue(task));

  return (
    <section className="task-board" id="taskBoard">
      {filteredTasks.length === 0 && <div className="empty">No tasks here yet.</div>}

      {overdueTasks.length > 0 && (
        <section className="group">
          <div className="group-title overdue">Overdue ({overdueTasks.length})</div>
          {overdueTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              team={team}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
            />
          ))}
        </section>
      )}

      {upcomingTasks.length > 0 && (
        <section className="group">
          <div className="group-title">Upcoming ({upcomingTasks.length})</div>
          {upcomingTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              team={team}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
            />
          ))}
        </section>
      )}

      {completeTasks.length > 0 && (
        <details className="completed-panel">
          <summary>Completed ({completeTasks.length})</summary>
          {completeTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              team={team}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
            />
          ))}
        </details>
      )}
    </section>
  );
}

export default TaskBoard;
