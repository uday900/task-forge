import { useState } from 'react';
import { Link } from 'react-router-dom';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';
import { useTasks, getOverdueDays } from '../context/TaskContext';

export default function MainContent() {

  const { state, currentWorkspace, dispatch } = useTasks();
  const [search, setSearch] = useState('');
  const [filterAssignees, setFilterAssignees] = useState([]);
  const [filterPriorities, setFilterPriorities] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showOverdue, setShowOverdue] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const showTaskModal = state.showTaskModal;
  const selectedTaskId = state.selectedTaskId;
  const editingTaskId = state.editingTaskId;

  const now = new Date();
  const tasks = currentWorkspace?.tasks || [];
  const assignees = currentWorkspace?.team || [];

  const filteredTasks = tasks
    .filter((task) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    })
    .filter((task) => filterAssignees.length === 0 || filterAssignees.includes(task.assignedTo))
    .filter((task) => filterPriorities.length === 0 || filterPriorities.includes(task.priority));

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOrder === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortOrder === 'due') {
      const aDue = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
      const bDue = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
      return aDue - bDue;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const overdueTasks = sortedTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < now && !task.completed
  );

  const upcomingTasks = sortedTasks.filter(
    (task) => !task.completed && (!task.dueDate || new Date(task.dueDate) >= now)
  );

  const completedTasks = sortedTasks.filter((task) => task.completed);

  const toggleAssigneeFilter = (assigneeId) => {
    setFilterAssignees((prev) =>
      prev.includes(assigneeId)
        ? prev.filter((id) => id !== assigneeId)
        : [...prev, assigneeId]
    );
  };

  const togglePriorityFilter = (priority) => {
    setFilterPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const clearAllFilters = () => {
    setSearch('');
    setFilterAssignees([]);
    setFilterPriorities([]);
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-100">{currentWorkspace?.name || 'Workspace'}</h1>
            <p className="text-xs text-slate-400">{tasks.length} tasks in this workspace</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="bg-slate-900 px-4 py-2.5 rounded-xl text-sm"
              value={currentWorkspace?.id}
              onChange={(e) => dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: e.target.value })}
            >
              {state.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <Link
              to="/settings"
              className="bg-slate-900 px-4 py-2.5 rounded-xl text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="">
          <div className="flex items-center gap-3">
            
           <div className="relative flex-1">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>

  <input
    placeholder="Search tasks..."
    className="
      w-full
      rounded-xl
      bg-slate-900
      py-2.5
      pl-12
      pr-10
      text-sm
      outline-none
      focus:ring-2
      focus:ring-blue-500
    "
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  {search.trim() && (
    <button
      type="button"
      onClick={() => setSearch('')}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-slate-400
        hover:text-white
      "
    >
      ✕
    </button>
  )}
</div>

            {/* Filter Button */}
            <div className="relative">
              <button
                className="bg-slate-800 px-4 py-2.5 filter-button"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
                {(filterPriorities.length > 0 || filterAssignees.length > 0) && (
                  <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs">
                    {filterPriorities.length + filterAssignees.length}
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-96 rounded-lg bg-slate-800 p-4 shadow-xl z-50">
                  {/* Priority */}
                  <h3 className="mb-2 text-sm font-semibold">Priority</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <button
                        key={priority}
                        className={`rounded-lg px-3 py-2 text-xs rounded-button ${filterPriorities.includes(priority)
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700'
                          }`}
                        onClick={() => togglePriorityFilter(priority)}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>

                  {/* Assignee */}
                  {currentWorkspace?.teamEnabled && (
                    <><h3 className="mb-2 text-sm font-semibold">Assignee</h3>

                      <div className="flex flex-wrap gap-2">
                        {assignees.map((member) => (
                          <button
                            key={member.id}
                            className={`rounded-lg px-3 py-2 text-xs rounded-button ${filterAssignees.includes(member.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700'
                              }`}
                            onClick={() => toggleAssigneeFilter(member.id)}
                          >
                            {member.name}
                          </button>
                        ))}
                        <button
                            key={state.user.id}
                            className={`rounded-lg px-3 py-2 text-xs filter-button ${filterAssignees.includes(state.user.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700'
                              }`}
                            onClick={() => toggleAssigneeFilter(state.user.id)}
                          >
                            {state.user.name} (You)
                          </button>
                      </div></>
                  )}
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="rounded-button bg-slate-500 px-3 py-2 text-xs font-medium hover:bg-slate-600 "
                    >
                      Close
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="rounded-button bg-slate-700 px-3 py-2 text-xs font-medium hover:bg-slate-600 "
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <select
              className="bg-slate-900 px-4 py-2.5 rounded-xl text-sm outline-none"
              value={sortOrder}
              name="sort"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="due">Due Date</option>
            </select>
          </div>

          {/* Selected Filter Chips */}
          {(filterPriorities.length > 0 || filterAssignees.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filterPriorities.map((priority) => (
                <span
                  key={priority}
                  className="flex items-center gap-1 rounded-button bg-slate-700 px-3 py-1 text-xs"
                >
                  {priority}
                  <button onClick={() => togglePriorityFilter(priority)}>✕</button>
                </span>
              ))}

              {filterAssignees.map((id) => {
                const user = assignees.find((a) => a.id === id);
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 text-xs"
                  >
                    {user?.name || (id === state.user.id ? `${state.user.name} (You)` : 'Unknown')}
                    <button onClick={() => toggleAssigneeFilter(id)}>✕</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {overdueTasks.length > 0 && (
          <section className="rounded-xl bg-slate-900">
            <button
              onClick={() => setShowOverdue(!showOverdue)}
              className="flex w-full items-center justify-between p-4"
            >
              <span className="text-red-400 font-semibold">
                {showOverdue ? "▾" : "▸"} Overdue ({overdueTasks.length})
              </span>
            </button>

            {showOverdue && (
              <div className="space-y-2 px-4 pb-4">
                {overdueTasks.map((task) => {
                  const overdueLabel = getOverdueDays(task.dueDate);
                  return (
                    <div key={task.id} className="relative">
                      <TaskCard task={task} overdueLabel={overdueLabel} />

                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl bg-slate-900">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="flex w-full items-center justify-between p-4"
          >
            <span className="text-slate-300 font-semibold">
              {showUpcoming ? "▾" : "▸"} Upcoming ({upcomingTasks.length})
            </span>
          </button>

          {showUpcoming && (
            <div className="space-y-2 px-4 pb-4">
              {upcomingTasks.length ? (
                upcomingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <p className="text-slate-500">
                  No upcoming tasks
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-slate-900">
          <div
            className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-sm font-semibold text-white"
            role="button"
            onClick={() => setShowCompleted((value) => !value)}
          >
            <span className="inline-flex items-center gap-2 text-slate-300">
              <span className="text-lg">{showCompleted ? '▾' : '▸'}</span>
              Completed ({completedTasks.length})
            </span>
            {completedTasks.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete all completed tasks? This cannot be undone.')) {
                    dispatch({ type: 'DELETE_ALL_COMPLETED' });
                  }
                }}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>

          {showCompleted && (
            <div className="space-y-3 border-t border-slate-700 p-4 pt-0">
              
              {completedTasks.length ? (
                completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <p className="text-slate-400">No completed tasks.</p>
              )}
            </div>
          )}
        </section>
        
      </div>

      {showTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
          onClick={() => dispatch({ type: 'CLOSE_TASK_MODAL' })}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >


            {/* Modal Content */}
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
      )}
    </main>
  );
}
