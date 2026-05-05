import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Filters from './components/Filters';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import ProfileModal from './components/ProfileModal';
import TeamModal from './components/TeamModal';
import ImagePreviewModal from './components/ImagePreviewModal';
import { colors, isOverdue, readFilesAsDataUrls } from './utils';
import './style.css';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [lists, setLists] = useState([]);
  const [active, setActive] = useState({ type: 'fixed', id: 'all' });
  const [filters, setFilters] = useState({ assignee: '', priority: '', list: '' });
  const [search, setSearch] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingAttachments, setEditingAttachments] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [taskFormState, setTaskFormState] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assignee_id: '',
    repeat: 'none',
    list_id: ''
  });
  const [profileFormState, setProfileFormState] = useState({ name: '', email: '', role: '' });
  const [teamFormState, setTeamFormState] = useState({ name: '', role: '' });
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const startXRef = useRef(0);
  const startWidthRef = useRef(240);
  const resizingRef = useRef(false);

  const titleForActive = useMemo(() => {
    if (active.type === 'fixed') {
      if (active.id === 'important') return 'Important';
      if (active.id === 'assigned') return 'Assigned to Me';
      return 'All Tasks';
    }
    if (active.type === 'team') {
      const member = team.find((m) => m.id === active.id);
      return member ? (member.id === 'me' ? `${member.name} (me)` : member.name) : 'Team Member';
    }
    return lists.find((list) => list.id === active.id)?.name || 'List';
  }, [active, lists, team]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (active.type === 'fixed') {
          if (active.id === 'important') return task.priority === 'high' || task.priority === 'urgent';
          if (active.id === 'assigned') return task.assignee_id === 'me';
          return true;
        }
        if (active.type === 'team') return task.assignee_id === active.id;
        if (active.type === 'list') return task.list_id === active.id;
        return true;
      })
      .filter((task) => {
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query);
        return (
          matchesSearch &&
          (!filters.assignee || task.assignee_id === filters.assignee) &&
          (!filters.priority || task.priority === filters.priority) &&
          (!filters.list || task.list_id === filters.list)
        );
      })
      .sort((a, b) => {
        const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdueDiff) return overdueDiff;
        const prioritiesDef = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (prioritiesDef[b.priority] || 0) - (prioritiesDef[a.priority] || 0);
        if (priorityDiff) return priorityDiff;
        return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
      });
  }, [active, filters, search, tasks]);

  const teamOptions = useMemo(() => [{ value: '', label: 'Any assignee' }].concat(team.map((member) => ({ value: member.id, label: member.id === 'me' ? `${member.name} (me)` : member.name }))), [team]);
  const listOptions = useMemo(() => [{ value: '', label: 'Any list' }].concat(lists.map((list) => ({ value: list.id, label: list.name }))), [lists]);
  const assigneeOptions = useMemo(() => [{ value: '', label: 'Unassigned' }].concat(team.map((member) => ({ value: member.id, label: member.id === 'me' ? `${member.name} (me)` : member.name }))), [team]);

  const refresh = useCallback(async () => {
    const [nextUser, nextTasks, nextTeam, nextLists] = await Promise.all([
      window.api.user.get(),
      window.api.tasks.getAll(),
      window.api.team.getAll(),
      window.api.lists.getAll()
    ]);

    setUser(nextUser);
    setTasks(nextTasks);
    setTeam(nextTeam);
    setLists(nextLists);

    if (active.type === 'team' && !nextTeam.some((member) => member.id === active.id)) {
      setActive({ type: 'fixed', id: 'all' });
    }
    if (active.type === 'list' && !nextLists.some((list) => list.id === active.id)) {
      setActive({ type: 'fixed', id: 'all' });
    }

    if (!nextUser) {
      setProfileFormState({ name: '', email: '', role: '' });
      setShowProfileModal(true);
    }
  }, [active.id, active.type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!resizingRef.current) return;
      const nextWidth = Math.min(360, Math.max(180, startWidthRef.current + event.clientX - startXRef.current));
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.classList.remove('resizing-sidebar');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreviewIndex(null);
        return;
      }
      if (previewIndex === null) return;
      if (event.key === 'ArrowLeft') {
        setPreviewIndex((previewIndex - 1 + editingAttachments.length) % editingAttachments.length);
      }
      if (event.key === 'ArrowRight') {
        setPreviewIndex((previewIndex + 1) % editingAttachments.length);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingAttachments.length, previewIndex]);

  const handleStartResize = (event) => {
    event.preventDefault();
    resizingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.classList.add('resizing-sidebar');
  };

  const handleTaskFormChange = (field, value) => {
    setTaskFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileFormChange = (field, value) => {
    setProfileFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleTeamFormChange = (field, value) => {
    setTeamFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    const task = {
      id: editingTask?.id || crypto.randomUUID(),
      title: taskFormState.title.trim(),
      description: taskFormState.description.trim(),
      priority: taskFormState.priority,
      deadline: taskFormState.deadline,
      assignee_id: taskFormState.assignee_id,
      repeat: taskFormState.repeat,
      list_id: taskFormState.list_id,
      done: editingTask?.done || false,
      created_at: editingTask?.created_at || Date.now(),
      attachments: editingAttachments
    };
    if (!task.title) return;
    await window.api.tasks.save(task);
    setShowTaskModal(false);
    await refresh();
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const name = profileFormState.name.trim();
    const email = profileFormState.email.trim();
    const role = profileFormState.role.trim();
    if (!name || !email || !role) return;

    await window.api.user.save({ name, email, role, color: colors[0] });
    setShowProfileModal(false);
    await refresh();
  };

  const handleTeamSubmit = async (event) => {
    event.preventDefault();
    const name = teamFormState.name.trim();
    if (!name) return;
    await window.api.team.save({
      id: crypto.randomUUID(),
      name,
      role: teamFormState.role.trim(),
      color: colors[team.length % colors.length]
    });
    setTeamFormState({ name: '', role: '' });
    await refresh();
  };

  const handleAttachmentsChange = async (event) => {
    const images = await readFilesAsDataUrls(event.target.files);
    setEditingAttachments((prev) => [...prev, ...images]);
  };

  const toggleTaskDone = async (task) => {
    await window.api.tasks.toggleDone(task.id, !task.done);
    await refresh();
  };

  const deleteTask = async () => {
    if (!editingTask) return;
    await window.api.tasks.delete(editingTask.id);
    setShowTaskModal(false);
    await refresh();
  };

  const deleteList = async (list) => {
    if (!confirm(`Delete "${list.name}"? Tasks in this list will be kept.`)) return;
    await window.api.lists.delete(list.id);
    await refresh();
  };

  const deleteTeamMember = async (memberId) => {
    await window.api.team.delete(memberId);
    await refresh();
  };

  const exportData = async (format) => {
    await window.api.data.export(format);
  };

  const importData = async () => {
    await window.api.data.import();
    await refresh();
  };

  const openTaskModal = (task = null) => {
    setEditingTask(task);
    setEditingAttachments(task?.attachments ? [...task.attachments] : []);
    setTaskFormState({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      deadline: task?.deadline || '',
      assignee_id: task?.assignee_id || '',
      repeat: task?.repeat || 'none',
      list_id: task?.list_id || (active.type === 'list' ? active.id : '')
    });
    setShowTaskModal(true);
  };

  const handleNewList = async (list, isDelete) => {
    if (isDelete) {
      deleteList(list);
    } else {
      const name = (prompt('List name') || '').trim();
      if (!name) {
        alert('List name is required.');
        return;
      }
      await window.api.lists.save({ id: crypto.randomUUID(), name, color: colors[lists.length % colors.length] });
      await refresh();
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        sidebarWidth={sidebarWidth}
        onStartResize={handleStartResize}
        user={user}
        tasks={tasks}
        team={team}
        lists={lists}
        active={active}
        onActiveChange={setActive}
        onNewList={handleNewList}
        search={search}
        onSearchChange={setSearch}
      />

      <main className="main">
        <div className="main-head">
          <Topbar
            title={titleForActive}
            taskCount={filteredTasks.length}
            onTeamClick={() => setShowTeamModal(true)}
            onImportClick={importData}
            onExportClick={exportData}
            onNewTaskClick={() => openTaskModal()}
          />

          <Filters
            filters={filters}
            onFilterChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
            teamOptions={teamOptions}
            listOptions={listOptions}
          />
        </div>

        <TaskBoard
          filteredTasks={filteredTasks}
          team={team}
          onToggleDone={toggleTaskDone}
          onEdit={openTaskModal}
        />
      </main>

      <TaskModal
        isOpen={showTaskModal}
        isEditing={!!editingTask}
        taskFormState={taskFormState}
        onFormChange={handleTaskFormChange}
        editingAttachments={editingAttachments}
        onAttachmentsChange={handleAttachmentsChange}
        onRemoveAttachment={(index) => setEditingAttachments((prev) => prev.filter((_, i) => i !== index))}
        onShowImagePreview={(index) => setPreviewIndex(index)}
        onSubmit={handleTaskSubmit}
        onDelete={deleteTask}
        onClose={() => setShowTaskModal(false)}
        assigneeOptions={assigneeOptions}
        listOptions={listOptions}
      />

      <ProfileModal
        isOpen={showProfileModal}
        formState={profileFormState}
        onFormChange={handleProfileFormChange}
        onSubmit={handleProfileSubmit}
        onClose={() => setShowProfileModal(false)}
      />

      <TeamModal
        isOpen={showTeamModal}
        team={team}
        formState={teamFormState}
        onFormChange={handleTeamFormChange}
        onSubmit={handleTeamSubmit}
        onDeleteMember={deleteTeamMember}
        onClose={() => setShowTeamModal(false)}
      />

      <ImagePreviewModal
        isOpen={previewIndex !== null}
        attachments={editingAttachments}
        previewIndex={previewIndex}
        onPrevious={() => previewIndex !== null && setPreviewIndex((previewIndex - 1 + editingAttachments.length) % editingAttachments.length)}
        onNext={() => previewIndex !== null && setPreviewIndex((previewIndex + 1) % editingAttachments.length)}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  );
}

export default App;
