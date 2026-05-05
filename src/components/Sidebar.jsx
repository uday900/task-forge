import { displayMemberName, initials, colors } from '../utils';

function Sidebar({ sidebarWidth, onStartResize, user, tasks, team, lists, active, onActiveChange, onNewList, search, onSearchChange }) {
  const fixedSections = [
    { type: 'fixed', id: 'all', label: 'All Tasks' },
    { type: 'fixed', id: 'important', label: 'Important' },
    { type: 'fixed', id: 'assigned', label: 'Assigned to Me' }
  ];

  const countFor = (section) => {
    const sectionTasks = tasks.filter((task) => {
      if (section.id === 'important') return task.priority === 'high' || task.priority === 'urgent';
      if (section.id === 'assigned') return task.assignee_id === 'me';
      return true;
    });
    return sectionTasks.filter((task) => !task.done).length;
  };

  return (
    <aside className="sidebar" style={{ width: sidebarWidth }}>
      <div className="sidebar-top">
        <div className="brand">MyTasks</div>
        {user && (
          <section className="sidebar-user" onClick={() => {}}>
            <div className="avatar sidebar-avatar" style={{ background: user.color || colors[0] }}>
              {initials(user.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name} (me)</div>
              <div className="sidebar-user-email">{user.email}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </section>
        )}
        <div className="sidebar-search">
          <input
            id="taskSearch"
            type="search"
            placeholder="Search tasks"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <nav className="nav" id="sidebarNav">
        {fixedSections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`nav-item ${active.type === section.type && active.id === section.id ? 'active' : ''}`}
            onClick={() => onActiveChange(section)}
          >
            <span className="nav-label">{section.label}</span>
            <span className="count">{countFor(section)}</span>
          </button>
        ))}

        <div className="nav-heading">Team</div>
        {team.map((member) => (
          <button
            key={member.id}
            type="button"
            className={`nav-item ${active.type === 'team' && active.id === member.id ? 'active' : ''}`}
            onClick={() => onActiveChange({ type: 'team', id: member.id })}
          >
            <span className="dot" style={{ background: member.color }} />
            <span className="nav-label">{displayMemberName(member)}</span>
            <span className="count">{tasks.filter((task) => !task.done && task.assignee_id === member.id).length}</span>
          </button>
        ))}

        <div className="nav-heading">Lists</div>
        {lists.map((list) => (
          <button
            key={list.id}
            type="button"
            className={`nav-item ${active.type === 'list' && active.id === list.id ? 'active' : ''}`}
            onClick={() => onActiveChange({ type: 'list', id: list.id })}
          >
            <span className="dot" style={{ background: list.color }} />
            <span className="nav-label">{list.name}</span>
            <span className="count">{tasks.filter((task) => !task.done && task.list_id === list.id).length}</span>
            <span
              className="nav-delete"
              onClick={(event) => {
                event.stopPropagation();
                onNewList(list, true);
              }}
            >
              x
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="button secondary full" onClick={() => onNewList(null, false)}>
          + New list
        </button>
      </div>
      <div className="sidebar-resizer" id="sidebarResizer" title="Resize sidebar" onMouseDown={onStartResize} />
    </aside>
  );
}

export default Sidebar;
