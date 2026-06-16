import { createContext, useContext, useEffect, useReducer, useState } from "react";

const TaskContext = createContext();

// Utility function to calculate overdue display
export function getOverdueDays(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = now - due;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null;
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m`;
  return `${Math.floor(diffDays / 365)}y`;
}

const initialState = {
  // user: { id: "self", name: "Uday Kiran", email: "uday@darla.com" },
  user: null,
  selectedWorkspaceId: "default",
  showTaskModal: false,
  selectedTaskId: null,
  editingTaskId: null,
  workspaces: [
    {
      id: "default",
      name: "Default workspace",
      teamEnabled: false,
      team: [
        // {
        //   id: "u13",
        //   name: "Vishnu darla",
        //   email: "vishnudarla@darla.com",
        //   role: "developer",
        // }
      ],
      tasks: [
        // {
        //   id: "t1",
        //   title: "Sample Task",
        //   description: "This is a sample task",
        //   completed: false,
        //   createdAt: new Date().toISOString(),
        //   priority: "high",
        //   dueDate: null,
        //   assignedTo: "self",
        // }
      ],
    },
  ],
};

function taskReducer(state, action) {
  const workspaceIndex = state.workspaces.findIndex(
    (workspace) => workspace.id === state.selectedWorkspaceId
  );

  const updateWorkspace = (updater) => {
    const workspaces = [...state.workspaces];
    workspaces[workspaceIndex] = updater(workspaces[workspaceIndex]);
    return workspaces;
  };

  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: {
          id: action.payload?.id || state.user?.id || 'self',
          name: action.payload?.name || state.user?.name || '',
          email: action.payload?.email || state.user?.email || '',
          role: action.payload?.role || state.user?.role || 'developer',
        },
      };

    case "ADD_TASK":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          tasks: [
            {
              id: Date.now().toString(),
              completed: false,
              createdAt: new Date().toISOString(),
              ...action.payload,
            },
            ...workspace.tasks,
          ],
        })),
      };

    case "UPDATE_TASK":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          tasks: workspace.tasks.map((task) =>
            task.id === action.payload.id ? action.payload : task
          ),
        })),
      };

    case "DELETE_TASK":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          tasks: workspace.tasks.filter((task) => task.id !== action.payload),
        })),
      };

    case "UPDATE_TASK_ATTACHMENTS":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          tasks: workspace.tasks.map((task) =>
            task.id === action.payload.taskId 
              ? { ...task, attachments: action.payload.attachments }
              : task
          ),
        })),
      };

    case "DELETE_ALL_COMPLETED":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          tasks: workspace.tasks.filter((task) => !task.completed),
        })),
      };

    case "TOGGLE_TASK":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          tasks: workspace.tasks.map((task) =>
            task.id === action.payload
              ? { ...task, completed: !task.completed }
              : task
          ),
        })),
      };

    case "OPEN_TASK_MODAL":
      return {
        ...state,
        showTaskModal: true,
      };

    case "CLOSE_TASK_MODAL":
      return {
        ...state,
        showTaskModal: false,
        selectedTaskId: null,
        editingTaskId: null,
      };

    case "SELECT_TASK":
      return {
        ...state,
        selectedTaskId: action.payload,
        editingTaskId: null,
        showTaskModal: true,
      };

    case "START_EDITING_TASK":
      return {
        ...state,
        editingTaskId: action.payload,
      };

    case "STOP_EDITING_TASK":
      return {
        ...state,
        editingTaskId: null,
      };

    case "SET_TEAM_ENABLED":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          teamEnabled: action.payload.enabled,
        })),
      };

    case "ADD_WORKSPACE":
      const newWorkspaceId = Date.now().toString();
      return {
        ...state,
        workspaces: [
          ...state.workspaces,
          {
            id: newWorkspaceId,
            name: action.payload.name,
            teamEnabled: false,
            team: [],
            tasks: [],
          },
        ],
        selectedWorkspaceId: newWorkspaceId,
      };

    case "SET_ACTIVE_WORKSPACE":
      return {
        ...state,
        selectedWorkspaceId: action.payload,
      };

    case "ADD_TEAM_MEMBER":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          team: [
            ...workspace.team,
            {
              id: Date.now().toString(),
              ...action.payload,
            },
          ],
        })),
      };

    case "UPDATE_TEAM_MEMBER":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          team: workspace.team.map((member) =>
            member.id === action.payload.id ? action.payload : member
          ),
        })),
      };

    case "DELETE_TEAM_MEMBER":
      return {
        ...state,
        workspaces: updateWorkspace((workspace) => ({
          ...workspace,
          team: workspace.team.filter((member) => member.id !== action.payload),
        })),
      };

    case "UPDATE_WORKSPACE":
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === state.selectedWorkspaceId
            ? { ...workspace, name: action.payload }
            : workspace
        ),
      };

    case "DELETE_WORKSPACE":
      const remainingWorkspaces = state.workspaces.filter(
        (workspace) => workspace.id !== state.selectedWorkspaceId
      );
      return {
        ...state,
        workspaces: remainingWorkspaces.length > 0 ? remainingWorkspaces : state.workspaces,
        selectedWorkspaceId: remainingWorkspaces.length > 0 ? remainingWorkspaces[0].id : state.selectedWorkspaceId,
      };

    case "IMPORT_DATA":
      try {
        const imported = JSON.parse(action.payload);
        return {
          ...state,
          ...imported,
        };
      } catch (error) {
        console.error('Failed to import data:', error);
        return state;
      }

    case "RESET_DATA":
      return initialState;

    case "SET_STATE":
      return {
        ...initialState,
        ...action.payload,
      };

    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      if (window.api?.getTasks) {
        try {
          const saved = await window.api.getTasks();
          if (saved && typeof saved === "object") {
            dispatch({ type: "SET_STATE", payload: saved });
          }
        } catch (err) {
          console.error("Failed to load saved state from electron-store", err);
        }
      }
      setHasLoaded(true);
    };

    loadState();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    try {
      if (window.api?.saveTasks) {
        window.api.saveTasks(state);
      }
    } catch (err) {
      console.error("Failed to save state to electron-store", err);
    }
  }, [state, hasLoaded]);

  const currentWorkspace =
    state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId) ||
    state.workspaces[0];

  return (
    <TaskContext.Provider value={{ state, dispatch, currentWorkspace }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within TaskProvider");
  }
  return context;
}
