const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    title: 'MyTasks',
    backgroundColor: '#f7f7f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function tasksToCsv(tasks) {
  const headers = [
    'id',
    'title',
    'description',
    'priority',
    'deadline',
    'assignee_id',
    'repeat',
    'list_id',
    'done',
    'created_at',
    'attachments_count'
  ];
  const rows = tasks.map((task) => [
    task.id,
    task.title,
    task.description,
    task.priority,
    task.deadline,
    task.assignee_id,
    task.repeat,
    task.list_id,
    task.done ? 1 : 0,
    task.created_at,
    Array.isArray(task.attachments) ? task.attachments.length : 0
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function registerIpc() {
  ipcMain.handle('user:get', () => db.getUser());
  ipcMain.handle('user:save', (_event, user) => db.saveUser(user));

  ipcMain.handle('tasks:getAll', () => db.getAllTasks());
  ipcMain.handle('tasks:save', (_event, task) => db.saveTask(task));
  ipcMain.handle('tasks:delete', (_event, id) => db.deleteTask(id));
  ipcMain.handle('tasks:toggleDone', (_event, id, done) => db.toggleDone(id, done));

  ipcMain.handle('team:getAll', () => db.getAllTeam());
  ipcMain.handle('team:save', (_event, member) => db.saveMember(member));
  ipcMain.handle('team:delete', (_event, id) => db.deleteMember(id));

  ipcMain.handle('lists:getAll', () => db.getAllLists());
  ipcMain.handle('lists:save', (_event, list) => db.saveList(list));
  ipcMain.handle('lists:delete', (_event, id) => db.deleteList(id));

  ipcMain.handle('data:export', async (_event, format) => {
    const selectedFormat = format === 'csv' ? 'csv' : 'json';
    const filters = selectedFormat === 'csv'
      ? [{ name: 'CSV Files', extensions: ['csv'] }]
      : [{ name: 'JSON Backup', extensions: ['json'] }];

    const result = await dialog.showSaveDialog(mainWindow, {
      title: selectedFormat === 'csv' ? 'Export Tasks CSV' : 'Export MyTasks Backup',
      defaultPath: selectedFormat === 'csv' ? 'mytasks-tasks.csv' : 'mytasks-backup.json',
      filters
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    const backup = db.getBackupData();
    const content = selectedFormat === 'csv'
      ? tasksToCsv(backup.tasks)
      : JSON.stringify(backup, null, 2);

    fs.writeFileSync(result.filePath, content, 'utf8');
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle('data:import', async () => {
    const selected = await dialog.showOpenDialog(mainWindow, {
      title: 'Import MyTasks Backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });

    if (selected.canceled || !selected.filePaths.length) {
      return { canceled: true };
    }

    const confirmed = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Cancel', 'Import'],
      defaultId: 0,
      cancelId: 0,
      title: 'Replace existing data?',
      message: 'Importing this backup will replace all current tasks, team members, and lists.',
      detail: 'This cannot be undone unless you export your current data first.'
    });

    if (confirmed.response !== 1) {
      return { canceled: true };
    }

    const raw = fs.readFileSync(selected.filePaths[0], 'utf8');
    const data = JSON.parse(raw);
    return {
      canceled: false,
      data: db.restoreBackup(data)
    };
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  db.init();
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
