const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function getDbPath() {
  return path.join(app.getPath('userData'), 'tasks.db');
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      deadline TEXT,
      assignee_id TEXT,
      repeat TEXT DEFAULT 'none',
      list_id TEXT,
      done INTEGER DEFAULT 0,
      created_at INTEGER,
      attachments TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS team (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT,
      color TEXT,
      created_at INTEGER
    );
  `);

  const taskColumns = db.prepare('PRAGMA table_info(tasks)').all().map((column) => column.name);
  if (!taskColumns.includes('attachments')) {
    db.prepare("ALTER TABLE tasks ADD COLUMN attachments TEXT DEFAULT '[]'").run();
  }

  const me = db.prepare('SELECT id FROM team WHERE id = ?').get('me');
  if (!me) {
    db.prepare('INSERT INTO team (id, name, role, color) VALUES (?, ?, ?, ?)').run(
      'me',
      'Me',
      'Owner',
      '#2563eb'
    );
  }
}

function init() {
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  return db;
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    deadline: task.deadline || '',
    assignee_id: task.assignee_id || '',
    repeat: task.repeat || 'none',
    list_id: task.list_id || '',
    done: task.done ? 1 : 0,
    created_at: task.created_at || Date.now(),
    attachments: JSON.stringify(Array.isArray(task.attachments) ? task.attachments : [])
  };
}

function parseTask(task) {
  let attachments = [];
  try {
    attachments = JSON.parse(task.attachments || '[]');
  } catch {
    attachments = [];
  }

  return {
    ...task,
    done: Boolean(task.done),
    attachments
  };
}

function getAllTasks() {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all().map(parseTask);
}

function saveTask(task) {
  const row = normalizeTask(task);
  db.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, title, description, priority, deadline, assignee_id, repeat, list_id, done, created_at, attachments
    ) VALUES (
      @id, @title, @description, @priority, @deadline, @assignee_id, @repeat, @list_id, @done, @created_at, @attachments
    )
  `).run(row);
  return parseTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(row.id));
}

function deleteTask(id) {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return true;
}

function toggleDone(id, done) {
  db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, id);
  return true;
}

function getUser() {
  return db.prepare('SELECT * FROM users WHERE id = ?').get('me') || null;
}

function saveUser(user) {
  const row = {
    id: 'me',
    name: user.name,
    email: user.email,
    role: user.role || '',
    color: user.color || '#2563eb',
    created_at: user.created_at || Date.now()
  };

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, role, color, created_at)
      VALUES (@id, @name, @email, @role, @color, @created_at)
    `).run(row);

    db.prepare(`
      INSERT OR REPLACE INTO team (id, name, role, color)
      VALUES (@id, @name, @role, @color)
    `).run({
      id: 'me',
      name: row.name,
      role: row.role,
      color: row.color
    });
  });

  transaction();
  return getUser();
}

function getAllTeam() {
  return db.prepare("SELECT * FROM team ORDER BY CASE WHEN id = 'me' THEN 0 ELSE 1 END, name COLLATE NOCASE").all();
}

function saveMember(member) {
  db.prepare(`
    INSERT OR REPLACE INTO team (id, name, role, color)
    VALUES (@id, @name, @role, @color)
  `).run({
    id: member.id,
    name: member.name,
    role: member.role || '',
    color: member.color || '#64748b'
  });
  return db.prepare('SELECT * FROM team WHERE id = ?').get(member.id);
}

function deleteMember(id) {
  if (id === 'me') return false;
  const transaction = db.transaction(() => {
    db.prepare('UPDATE tasks SET assignee_id = ? WHERE assignee_id = ?').run('me', id);
    db.prepare('DELETE FROM team WHERE id = ?').run(id);
  });
  transaction();
  return true;
}

function getAllLists() {
  return db.prepare('SELECT * FROM lists ORDER BY name COLLATE NOCASE').all();
}

function saveList(list) {
  db.prepare(`
    INSERT OR REPLACE INTO lists (id, name, color)
    VALUES (@id, @name, @color)
  `).run({
    id: list.id,
    name: list.name,
    color: list.color || '#64748b'
  });
  return db.prepare('SELECT * FROM lists WHERE id = ?').get(list.id);
}

function deleteList(id) {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE tasks SET list_id = ? WHERE list_id = ?').run('', id);
    db.prepare('DELETE FROM lists WHERE id = ?').run(id);
  });
  transaction();
  return true;
}

function getBackupData() {
  return {
    user: getUser(),
    tasks: getAllTasks(),
    team: getAllTeam(),
    lists: getAllLists(),
    exported_at: new Date().toISOString()
  };
}

function restoreBackup(data) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM team').run();
    db.prepare('DELETE FROM lists').run();
    db.prepare('DELETE FROM users').run();

    if (data.user) {
      saveUser(data.user);
    }
    (data.team || []).forEach(saveMember);
    if (!(data.team || []).some((member) => member.id === 'me') && !data.user) {
      saveMember({ id: 'me', name: 'Me', role: 'Owner', color: '#2563eb' });
    }
    (data.lists || []).forEach(saveList);
    (data.tasks || []).forEach(saveTask);
  });
  transaction();
  return getBackupData();
}

module.exports = {
  init,
  getAllTasks,
  saveTask,
  deleteTask,
  toggleDone,
  getUser,
  saveUser,
  getAllTeam,
  saveMember,
  deleteMember,
  getAllLists,
  saveList,
  deleteList,
  getBackupData,
  restoreBackup
};
