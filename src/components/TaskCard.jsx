import { useEffect, useRef, useState } from "react";
import { useTasks } from "../context/TaskContext";
import Avatar from "./Avatar";

const priorityConfig = {
  low: {
    dot: "bg-slate-500",
    label: "Low",
  },
  medium: {
    dot: "bg-blue-500",
    label: "Medium",
  },
  high: {
    dot: "bg-amber-500",
    label: "High",
  },
  urgent: {
    dot: "bg-rose-500",
    label: "Urgent",
  },
};

export default function TaskCard({ task, overdueLabel }) {
  const { currentWorkspace, dispatch } = useTasks();
  const [localCompleted, setLocalCompleted] = useState(task.completed);
  const [isRemoving, setIsRemoving] = useState(false);
  const removeTimeout = useRef(null);

  useEffect(() => {
    setLocalCompleted(task.completed);
  }, [task.completed]);

  useEffect(() => {
    return () => {
      if (removeTimeout.current) {
        clearTimeout(removeTimeout.current);
      }
    };
  }, []);

  const assignee = currentWorkspace?.team?.find(
    (member) => member.id === task.assignedTo
  ) || (task.assignedTo === "self" ? { name: "You" } : null);

  const priority =
    priorityConfig[task.priority] || priorityConfig.medium;

  const handleTaskClick = () => {
    dispatch({
      type: "SELECT_TASK",
      payload: task.id,
    });
  };

  return (
    <div
      className={`
        relative
        group
        flex
        items-start
        gap-3
        px-3
        py-2
        rounded-lg
        transition-all
        duration-300
        transform-gpu
        cursor-pointer
        bg-sky-700/10
        ${isRemoving ? 'translate-x-6 opacity-0 scale-95' : ''}
        ${task.completed ? 'translate-x-2 opacity-70 grayscale-[.18] hover:bg-sky-700/10' : 'hover:bg-sky-700/20'}
      `}
      onClick={handleTaskClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isRemoving) return;
          setLocalCompleted((value) => !value);
          setIsRemoving(true);
          removeTimeout.current = window.setTimeout(() => {
            dispatch({
              type: 'TOGGLE_TASK',
              payload: task.id,
            });
            setIsRemoving(false);
          }, 220);
        }}
        className={`
          mt-[2px]
          flex
          h-6
          w-6
          shrink-0
          items-center
          justify-center
          rounded-full
          border-2
          transition-all
          duration-300
          ${localCompleted ? 'border-blue-500 bg-blue-500 text-white scale-105' : 'border-slate-500 hover:border-slate-300 hover:scale-110'}
        `}
      >
        {localCompleted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : null}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`
            text-[14px]
            leading-5
            truncate
            ${
              task.completed
                ? "line-through text-slate-500 opacity-80"
                : "text-slate-300"
            }
          `}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {task.dueDate && (
            <span>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}

          {assignee && currentWorkspace.teamEnabled && (
            <>
              <span className="font-bold text-xs">•</span>
              <Avatar name={assignee.name} size="sm" />
              <span className="font-semibold">{assignee.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span
          className={`
            h-2
            w-2
            rounded-full
            ${priority.dot}
          `}
        />

        <span className="text-[14px] text-slate-500 font-medium">
          {priority.label} {overdueLabel && <span className="ml-1 text-red-500 font-bold">{overdueLabel}</span>}
        </span>
      </div>

      {/* <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm('Delete this task?')) {
            dispatch({ type: 'DELETE_TASK', payload: task.id });
          }
        }}
        title="Delete task"
        className="absolute right-3 top-3 hidden h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-rose-400 group-hover:flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button> */}
    </div>
  );
}