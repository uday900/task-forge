import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { useTasks } from '../context/TaskContext';

export default function Sidebar() {
  const { state, currentWorkspace, dispatch } = useTasks();
  const tasks = currentWorkspace?.tasks || [];
  const user = state.user;
  const team = currentWorkspace?.team || [];
  const teamEnabled = currentWorkspace?.teamEnabled;

  const importantCount = tasks.filter(
    (task) => (task.priority === 'high' || task.priority === 'urgent') && !task.completed
  ).length;
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  return (
    <aside className="w-[280px] min-w-[240px] max-w-[360px] flex h-screen flex-col bg-slate-900 border-r border-slate-800 text-white">
      <div className="overflow-y-auto flex-1 px-3 py-4 space-y-6 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        <div className="mb-4 ">
          <Link to="/" className="flex items-center gap-3 text-decoration-none">
            <img src="/app-logo.png" alt="TaskForge logo" className="h-14 w-14 rounded-xl object-cover" />
            <span className="text-lg font-semibold text-white">TaskForge</span>
          </Link>
        </div>

        <div className="rounded-xl p-3 bg-slate-800">
          <div className="flex items-center gap-2">
            <Avatar name={user?.name} />
            <div>
              <div className="font-semibold text-sm text-white">
                {user?.name || 'Guest User'}
              </div>
              <div className="text-slate-400 text-xs">{user?.role ? user.role : 'Developer'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 bg-slate-800 mb-6 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Important</span>
              <span>{importantCount}</span>
            </div>

            {currentWorkspace.teamEnabled && (
              <div className="flex justify-between">
                <span>My tasks</span>
                <span>{tasks.filter((task) => task.assignedTo === user?.id && !task.completed).length}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pending tasks</span>
              <span>{pendingTasks}</span>
            </div>
          </div>
        </div>

        {teamEnabled && (
          <div className="rounded-xl p-3 bg-slate-800">
            <p className="text-lg font-semibold mb-2">Team details</p>

            <div className="space-y-4">
              {team.length === 0 && (
                <p className="text-sm text-slate-400">No team members yet.</p>
              )}
              {team.map((member) => {
                const count = tasks.filter((task) => task.assignedTo === member.id && !task.completed).length;
                return (
                  <div key={member.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} />
                      <span>{member.name}</span>
                    </div>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-800 bg-slate-900 px-3 py-4">
          <button
            className="mb-3 new-task-button"
            onClick={() => dispatch({ type: 'OPEN_TASK_MODAL' })}
          >
            + New Task
          </button>
      </div>
    </aside>
  );
}
