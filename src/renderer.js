const state = {
  user: null,
  tasks: [],
  team: [],
  lists: [],
  active: { type: 'fixed', id: 'all' },
  filters: { assignee: '', priority: '', list: '' },
  search: '',
  editingTaskId: null,
  editingAttachments: []
};

const colors = ['#2563eb', '#16a34a', '#f97316', '#dc2626', '#7c3aed', '#0891b2', '#be123c', '#4f46e5'];
const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };

const el = {
  sidebarNav: document.getElementById('sidebarNav'),
  sidebarUser: document.getElementById('sidebarUser'),
  sidebarUserAvatar: document.getElementById('sidebarUserAvatar'),
  sidebarUserName: document.getElementById('sidebarUserName'),
  sidebarUserEmail: document.getElementById('sidebarUserEmail'),
  sidebarUserRole: document.getElementById('sidebarUserRole'),
  taskSearch: document.getElementById('taskSearch'),
  sidebarResizer: document.getElementById('sidebarResizer'),
  viewTitle: document.getElementById('viewTitle'),
  viewMeta: document.getElementById('viewMeta'),
  taskBoard: document.getElementById('taskBoard'),
  assigneeFilter: document.getElementById('assigneeFilter'),
  priorityFilter: document.getElementById('priorityFilter'),
  listFilter: document.getElementById('listFilter'),
  newTaskBtn: document.getElementById('newTaskBtn'),
  teamBtn: document.getElementById('teamBtn'),
  importBtn: document.getElementById('importBtn'),
  exportBtn: document.getElementById('exportBtn'),
  exportMenu: document.getElementById('exportMenu'),
  newListBtn: document.getElementById('newListBtn'),
  taskModal: document.getElementById('taskModal'),
  taskForm: document.getElementById('taskForm'),
  taskModalTitle: document.getElementById('taskModalTitle'),
  taskTitle: document.getElementById('taskTitle'),
  taskDescription: document.getElementById('taskDescription'),
  taskPriority: document.getElementById('taskPriority'),
  taskDeadline: document.getElementById('taskDeadline'),
  taskAssignee: document.getElementById('taskAssignee'),
  taskRepeat: document.getElementById('taskRepeat'),
  taskList: document.getElementById('taskList'),
  taskAttachments: document.getElementById('taskAttachments'),
  attachmentPreview: document.getElementById('attachmentPreview'),
  deleteTaskBtn: document.getElementById('deleteTaskBtn'),
  profileModal: document.getElementById('profileModal'),
  profileForm: document.getElementById('profileForm'),
  profileName: document.getElementById('profileName'),
  profileEmail: document.getElementById('profileEmail'),
  profileRole: document.getElementById('profileRole'),
  profileCloseBtn: document.getElementById('profileCloseBtn'),
  teamModal: document.getElementById('teamModal'),
  teamList: document.getElementById('teamList'),
  teamForm: document.getElementById('teamForm'),
  memberName: document.getElementById('memberName'),
  memberRole: document.getElementById('memberRole')
};

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isOverdue(task) {
  const deadline = parseDate(task.deadline);
  return deadline && !task.done && deadline < todayDate();
}

function overdueDays(task) {
  const deadline = parseDate(task.deadline);
  if (!deadline) return 0;
  return Math.max(1, Math.ceil((todayDate() - deadline) / 86400000));
}

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function byId(collection, id) {
  return collection.find((item) => item.id === id);
}

function displayMemberName(member) {
  if (!member) return 'Unassigned';
  return member.id === 'me' ? `${member.name} (me)` : member.name;
}

function titleForActive() {
  if (state.active.type === 'fixed') {
    if (state.active.id === 'important') return 'Important';
    if (state.active.id === 'assigned') return 'Assigned to Me';
    return 'All Tasks';
  }
  if (state.active.type === 'team') return displayMemberName(byId(state.team, state.active.id));
  return byId(state.lists, state.active.id)?.name || 'List';
}

function taskMatchesSection(task, section = state.active) {
  if (section.type === 'fixed') {
    if (section.id === 'important') return task.priority === 'high' || task.priority === 'urgent';
    if (section.id === 'assigned') return task.assignee_id === 'me';
    return true;
  }
  if (section.type === 'team') return task.assignee_id === section.id;
  if (section.type === 'list') return task.list_id === section.id;
  return true;
}

function taskMatchesFilters(task) {
  const query = state.search.trim().toLowerCase();
  const matchesSearch = !query
    || (task.title || '').toLowerCase().includes(query)
    || (task.description || '').toLowerCase().includes(query);

  return matchesSearch
    && (!state.filters.assignee || task.assignee_id === state.filters.assignee)
    && (!state.filters.priority || task.priority === state.filters.priority)
    && (!state.filters.list || task.list_id === state.filters.list);
}

function filteredTasks() {
  return state.tasks
    .filter((task) => taskMatchesSection(task) && taskMatchesFilters(task))
    .sort((a, b) => {
      const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
      if (overdueDiff) return overdueDiff;
      const priorityDiff = (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
      if (priorityDiff) return priorityDiff;
      return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
    });
}

function countFor(section) {
  return state.tasks.filter((task) => !task.done && taskMatchesSection(task, section)).length;
}

function createNavItem(label, section, options = {}) {
  const button = document.createElement('button');
  button.className = 'nav-item';
  if (state.active.type === section.type && state.active.id === section.id) button.classList.add('active');
  button.dataset.type = section.type;
  button.dataset.id = section.id;

  if (options.color) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = options.color;
    button.append(dot);
  }

  const text = document.createElement('span');
  text.className = 'nav-label';
  text.textContent = label;
  const count = document.createElement('span');
  count.className = 'count';
  count.textContent = countFor(section);
  button.append(text, count);

  if (options.deletable) {
    const remove = document.createElement('span');
    remove.className = 'nav-delete';
    remove.textContent = 'x';
    remove.title = 'Delete list';
    remove.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!confirm(`Delete "${label}"? Tasks in this list will be kept.`)) return;
      await window.api.lists.delete(section.id);
      await refresh();
    });
    button.append(remove);
  }

  return button;
}

function renderSidebar() {
  renderSidebarUser();
  el.sidebarNav.innerHTML = '';
  el.sidebarNav.append(
    createNavItem('All Tasks', { type: 'fixed', id: 'all' }),
    createNavItem('Important', { type: 'fixed', id: 'important' }),
    createNavItem('Assigned to Me', { type: 'fixed', id: 'assigned' })
  );

  const teamHeading = document.createElement('div');
  teamHeading.className = 'nav-heading';
  teamHeading.textContent = 'Team';
  el.sidebarNav.append(teamHeading);
  state.team.forEach((member) => {
    el.sidebarNav.append(createNavItem(displayMemberName(member), { type: 'team', id: member.id }, { color: member.color }));
  });

  const listHeading = document.createElement('div');
  listHeading.className = 'nav-heading';
  listHeading.textContent = 'Lists';
  el.sidebarNav.append(listHeading);
  state.lists.forEach((list) => {
    el.sidebarNav.append(createNavItem(list.name, { type: 'list', id: list.id }, { color: list.color, deletable: true }));
  });
}

function renderSidebarUser() {
  if (!state.user) {
    el.sidebarUser.classList.add('hidden');
    return;
  }

  el.sidebarUser.classList.remove('hidden');
  el.sidebarUserAvatar.textContent = initials(state.user.name);
  el.sidebarUserAvatar.style.background = state.user.color || colors[0];
  el.sidebarUserName.textContent = `${state.user.name} (me)`;
  el.sidebarUserEmail.textContent = state.user.email;
  el.sidebarUserRole.textContent = state.user.role;
}

function renderSelects() {
  const memberOptions = ['<option value="">Any assignee</option>']
    .concat(state.team.map((member) => `<option value="${member.id}">${displayMemberName(member)}</option>`));
  el.assigneeFilter.innerHTML = memberOptions.join('');
  el.assigneeFilter.value = state.filters.assignee;

  const listOptions = ['<option value="">Any list</option>']
    .concat(state.lists.map((list) => `<option value="${list.id}">${list.name}</option>`));
  el.listFilter.innerHTML = listOptions.join('');
  el.listFilter.value = state.filters.list;

  el.taskAssignee.innerHTML = '<option value="">Unassigned</option>'
    + state.team.map((member) => `<option value="${member.id}">${displayMemberName(member)}</option>`).join('');
  el.taskList.innerHTML = '<option value="">No list</option>'
    + state.lists.map((list) => `<option value="${list.id}">${list.name}</option>`).join('');
}

function taskRow(task) {
  const member = task.assignee_id ? byId(state.team, task.assignee_id) : null;
  const row = document.createElement('article');
  row.className = `task-row ${task.done ? 'done' : ''} ${isOverdue(task) ? 'overdue-row' : ''}`;
  if (task.priority === 'urgent') row.classList.add('urgent-row');
  row.dataset.id = task.id;

  const completeButton = document.createElement('button');
  completeButton.type = 'button';
  completeButton.className = `complete-circle ${task.done ? 'checked' : ''}`;
  completeButton.title = task.done ? 'Mark incomplete' : 'Mark complete';
  completeButton.setAttribute('aria-label', completeButton.title);
  completeButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    await window.api.tasks.toggleDone(task.id, !task.done);
    await refresh();
  });

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const priority = document.createElement('span');
  priority.className = `badge priority-${task.priority}`;
  priority.textContent = task.priority;

  const repeat = document.createElement('span');
  repeat.className = 'badge repeat-badge';
  repeat.textContent = task.repeat;

  const overdue = document.createElement('span');
  overdue.className = 'badge overdue-badge';
  overdue.textContent = isOverdue(task) ? `Overdue ${overdueDays(task)}d` : '';
  if (!isOverdue(task)) overdue.style.visibility = 'hidden';

  const deadline = document.createElement('span');
  deadline.className = 'deadline';
  deadline.textContent = task.deadline || 'No date';

  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.style.background = member?.color || '#94a3b8';
  avatar.textContent = member ? initials(member.name) : '--';
  avatar.title = displayMemberName(member);

  const attach = document.createElement('span');
  attach.className = 'attachment-icon';
  attach.textContent = task.attachments?.length ? 'Att' : '';

  const del = document.createElement('button');
  del.className = 'delete-row';
  del.type = 'button';
  del.textContent = 'Del';
  del.addEventListener('click', async (event) => {
    event.stopPropagation();
    await window.api.tasks.delete(task.id);
    await refresh();
  });

  row.append(completeButton, title, priority, repeat, overdue, deadline, avatar, attach, del);
  row.addEventListener('click', () => openTaskModal(task));
  return row;
}

function renderGroup(title, tasks, overdue = false) {
  const group = document.createElement('section');
  group.className = 'group';
  const heading = document.createElement('div');
  heading.className = `group-title ${overdue ? 'overdue' : ''}`;
  heading.textContent = `${title} (${tasks.length})`;
  group.append(heading);
  tasks.forEach((task) => group.append(taskRow(task)));
  return group;
}

function renderTasks() {
  const tasks = filteredTasks();
  const openTasks = tasks.filter((task) => !task.done);
  const completed = tasks.filter((task) => task.done);
  const overdue = openTasks.filter(isOverdue);
  const upcoming = openTasks.filter((task) => !isOverdue(task));

  el.viewTitle.textContent = titleForActive();
  el.viewMeta.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  el.taskBoard.innerHTML = '';

  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No tasks here yet.';
    el.taskBoard.append(empty);
    return;
  }

  if (overdue.length) el.taskBoard.append(renderGroup('Overdue', overdue, true));
  if (upcoming.length) el.taskBoard.append(renderGroup('Upcoming', upcoming));
  if (completed.length) {
    const details = document.createElement('details');
    details.className = 'completed-panel';
    const summary = document.createElement('summary');
    summary.textContent = `Completed (${completed.length})`;
    details.append(summary);
    completed.forEach((task) => details.append(taskRow(task)));
    el.taskBoard.append(details);
  }
}

function renderTeamModal() {
  el.teamList.innerHTML = '';
  state.team.forEach((member) => {
    const row = document.createElement('div');
    row.className = 'team-row';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.style.background = member.color || '#64748b';
    avatar.textContent = initials(member.name);

    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = displayMemberName(member);
    const role = document.createElement('div');
    role.className = 'team-role';
    role.textContent = member.role || 'No role';
    info.append(name, role);

    const remove = document.createElement('button');
    remove.className = 'button secondary';
    remove.type = 'button';
    remove.textContent = member.id === 'me' ? 'You' : 'Delete';
    remove.disabled = member.id === 'me';
    remove.addEventListener('click', async () => {
      await window.api.team.delete(member.id);
      await refresh();
      renderTeamModal();
    });

    row.append(avatar, info, remove);
    el.teamList.append(row);
  });
}

function renderAttachmentPreview() {
  el.attachmentPreview.innerHTML = '';
  state.editingAttachments.forEach((src, index) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'attachment-thumb';
    wrap.title = 'Remove image';
    const image = document.createElement('img');
    image.src = src;
    wrap.append(image);
    wrap.addEventListener('click', () => {
      state.editingAttachments.splice(index, 1);
      renderAttachmentPreview();
    });
    el.attachmentPreview.append(wrap);
  });
}

function openTaskModal(task = null) {
  state.editingTaskId = task?.id || null;
  state.editingAttachments = [...(task?.attachments || [])];
  el.taskModalTitle.textContent = task ? 'Edit Task' : 'New Task';
  el.taskTitle.value = task?.title || '';
  el.taskDescription.value = task?.description || '';
  el.taskPriority.value = task?.priority || 'medium';
  el.taskDeadline.value = task?.deadline || '';
  el.taskAssignee.value = task?.assignee_id || '';
  el.taskRepeat.value = task?.repeat || 'none';
  el.taskList.value = task?.list_id || (state.active.type === 'list' ? state.active.id : '');
  el.taskAttachments.value = '';
  el.deleteTaskBtn.classList.toggle('hidden', !task);
  renderAttachmentPreview();
  el.taskModal.classList.remove('hidden');
  el.taskTitle.focus();
}

function closeTaskModal() {
  el.taskModal.classList.add('hidden');
}

function closeTeamModal() {
  el.teamModal.classList.add('hidden');
}

function readFilesAsDataUrls(files) {
  return Promise.all([...files].map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

async function refresh() {
  const [user, tasks, team, lists] = await Promise.all([
    window.api.user.get(),
    window.api.tasks.getAll(),
    window.api.team.getAll(),
    window.api.lists.getAll()
  ]);
  state.user = user;
  state.tasks = tasks;
  state.team = team;
  state.lists = lists;
  if (state.active.type === 'team' && !byId(state.team, state.active.id)) state.active = { type: 'fixed', id: 'all' };
  if (state.active.type === 'list' && !byId(state.lists, state.active.id)) state.active = { type: 'fixed', id: 'all' };
  renderSelects();
  renderSidebar();
  renderTasks();
}

function openProfileModal() {
  el.profileName.value = state.user?.name || '';
  el.profileEmail.value = state.user?.email || '';
  el.profileRole.value = state.user?.role || '';
  el.profileCloseBtn.classList.toggle('hidden', !state.user);
  el.profileModal.classList.remove('hidden');
  el.profileName.focus();
}

function closeProfileModal() {
  el.profileModal.classList.add('hidden');
}

async function boot() {
  await refresh();
  if (!state.user) openProfileModal();
}

el.sidebarNav.addEventListener('click', (event) => {
  const item = event.target.closest('.nav-item');
  if (!item) return;
  state.active = { type: item.dataset.type, id: item.dataset.id };
  renderSidebar();
  renderTasks();
});

el.sidebarUser.addEventListener('click', () => {
  if (state.user) openProfileModal();
});

el.taskSearch.addEventListener('input', () => {
  state.search = el.taskSearch.value;
  renderTasks();
});

el.sidebarResizer.addEventListener('mousedown', (event) => {
  event.preventDefault();
  const sidebar = document.querySelector('.sidebar');
  const startX = event.clientX;
  const startWidth = sidebar.getBoundingClientRect().width;

  function resize(moveEvent) {
    const nextWidth = Math.min(340, Math.max(180, startWidth + moveEvent.clientX - startX));
    sidebar.style.flexBasis = `${nextWidth}px`;
    sidebar.style.width = `${nextWidth}px`;
  }

  function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    document.body.classList.remove('resizing-sidebar');
  }

  document.body.classList.add('resizing-sidebar');
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
});

el.assigneeFilter.addEventListener('change', () => {
  state.filters.assignee = el.assigneeFilter.value;
  renderTasks();
});

el.priorityFilter.addEventListener('change', () => {
  state.filters.priority = el.priorityFilter.value;
  renderTasks();
});

el.listFilter.addEventListener('change', () => {
  state.filters.list = el.listFilter.value;
  renderTasks();
});

el.newTaskBtn.addEventListener('click', () => openTaskModal());

el.newListBtn.addEventListener('click', async () => {
  const name = (prompt('List name') || '').trim();
  if (!name) {
    alert('List name is required.');
    return;
  }
  await window.api.lists.save({ id: crypto.randomUUID(), name, color: colors[state.lists.length % colors.length] });
  await refresh();
});

el.teamBtn.addEventListener('click', () => {
  renderTeamModal();
  el.teamModal.classList.remove('hidden');
});

el.importBtn.addEventListener('click', async () => {
  await window.api.data.import();
  await refresh();
});

el.exportBtn.addEventListener('click', () => {
  el.exportMenu.classList.toggle('open');
});

el.exportMenu.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  el.exportMenu.classList.remove('open');
  await window.api.data.export(button.dataset.format);
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.menu-wrap')) el.exportMenu.classList.remove('open');
});

document.querySelectorAll('[data-close="task"]').forEach((button) => {
  button.addEventListener('click', closeTaskModal);
});

document.querySelectorAll('[data-close="team"]').forEach((button) => {
  button.addEventListener('click', closeTeamModal);
});

el.taskModal.addEventListener('click', (event) => {
  if (event.target === el.taskModal) closeTaskModal();
});

el.teamModal.addEventListener('click', (event) => {
  if (event.target === el.teamModal) closeTeamModal();
});

el.profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = el.profileName.value.trim();
  const email = el.profileEmail.value.trim();
  const role = el.profileRole.value.trim();
  if (!name || !email || !role) return;

  await window.api.user.save({
    name,
    email,
    role,
    color: colors[0]
  });
  closeProfileModal();
  await refresh();
});

el.profileCloseBtn.addEventListener('click', closeProfileModal);

el.taskAttachments.addEventListener('change', async () => {
  const images = await readFilesAsDataUrls(el.taskAttachments.files);
  state.editingAttachments.push(...images);
  renderAttachmentPreview();
});

el.taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const existing = state.tasks.find((task) => task.id === state.editingTaskId);
  const task = {
    id: existing?.id || crypto.randomUUID(),
    title: el.taskTitle.value.trim(),
    description: el.taskDescription.value.trim(),
    priority: el.taskPriority.value,
    deadline: el.taskDeadline.value,
    assignee_id: el.taskAssignee.value,
    repeat: el.taskRepeat.value,
    list_id: el.taskList.value,
    done: existing?.done || false,
    created_at: existing?.created_at || Date.now(),
    attachments: state.editingAttachments
  };
  if (!task.title) return;
  await window.api.tasks.save(task);
  closeTaskModal();
  await refresh();
});

el.deleteTaskBtn.addEventListener('click', async () => {
  if (!state.editingTaskId) return;
  await window.api.tasks.delete(state.editingTaskId);
  closeTaskModal();
  await refresh();
});

el.teamForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = el.memberName.value.trim();
  if (!name) return;
  await window.api.team.save({
    id: crypto.randomUUID(),
    name,
    role: el.memberRole.value.trim(),
    color: colors[state.team.length % colors.length]
  });
  el.teamForm.reset();
  await refresh();
  renderTeamModal();
});

boot();
