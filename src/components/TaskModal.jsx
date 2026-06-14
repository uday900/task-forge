import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';
import { useTasks } from '../context/TaskContext';

export default function TaskModal() {
  const { state, currentWorkspace, dispatch } = useTasks();
  const { showTaskModal, selectedTaskId, editingTaskId } = state;

  if (!showTaskModal) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
      onClick={() => dispatch({ type: 'CLOSE_TASK_MODAL' })}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          {editingTaskId ? (
            <TaskForm
              task={currentWorkspace?.tasks?.find((t) => t.id === editingTaskId)}
              onClose={() => dispatch({ type: 'CLOSE_TASK_MODAL' })}
            />
          ) : selectedTaskId ? (
            <TaskDetails
              task={currentWorkspace?.tasks?.find((t) => t.id === selectedTaskId)}
              onClose={() => dispatch({ type: 'CLOSE_TASK_MODAL' })}
              onEdit={() =>
                dispatch({
                  type: 'START_EDITING_TASK',
                  payload: selectedTaskId,
                })
              }
            />
          ) : (
            <TaskForm
              onClose={() => dispatch({ type: 'CLOSE_TASK_MODAL' })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
