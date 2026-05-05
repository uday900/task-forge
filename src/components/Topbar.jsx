import { useState } from 'react';

function Topbar({ title, taskCount, onTeamClick, onImportClick, onExportClick, onNewTaskClick }) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="topbar">
      <div>
        <h1 id="viewTitle">{title}</h1>
        <p id="viewMeta">{taskCount} task{taskCount === 1 ? '' : 's'}</p>
      </div>
      <div className="topbar-actions">
        <button className="button secondary" id="teamBtn" type="button" onClick={onTeamClick}>
          Team
        </button>
        <button className="button secondary" id="importBtn" type="button" onClick={onImportClick}>
          Import
        </button>
        <div className="menu-wrap">
          <button className="button secondary" id="exportBtn" type="button" onClick={() => setShowExportMenu((prev) => !prev)}>
            Export
          </button>
          <div className={`export-menu ${showExportMenu ? 'open' : ''}`} id="exportMenu">
            <button type="button" data-format="json" onClick={() => {
              setShowExportMenu(false);
              onExportClick('json');
            }}>
              Full backup (.json)
            </button>
            <button type="button" data-format="csv" onClick={() => {
              setShowExportMenu(false);
              onExportClick('csv');
            }}>
              Tasks only (.csv)
            </button>
          </div>
        </div>
        <button className="button primary" id="newTaskBtn" type="button" onClick={onNewTaskClick}>
          New task
        </button>
      </div>
    </header>
  );
}

export default Topbar;
