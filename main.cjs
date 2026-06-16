const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Store = require('electron-store').default

const store = new Store({ name: 'config' });
const legacyStore = new Store({ name: 'task-manager' });

const mimeTypes = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

const supportedExtensions = new Set(Object.keys(mimeTypes));

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

// Get attachments directory path
function getAttachmentsDir() {
  const userDataPath = app.getPath('userData');
  const attachmentsDir = path.join(userDataPath, 'attachments');
  
  // Create attachments directory if it doesn't exist
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }
  
  return attachmentsDir;
}

function getMimeType(fileName) {
  return mimeTypes[path.extname(fileName).toLowerCase()] || 'application/octet-stream';
}

function sanitizeFileName(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, path.extname(fileName));
  const safeBase = baseName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'attachment';

  return `${safeBase}${extension}`;
}

function createAttachmentFilePath(originalName) {
  const attachmentsDir = getAttachmentsDir();
  const safeName = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return path.join(attachmentsDir, `${timestamp}-${random}-${safeName}`);
}

function isInsideAttachmentsDir(filePath) {
  const attachmentsDir = getAttachmentsDir();
  const resolvedDir = path.resolve(attachmentsDir);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile === resolvedDir || resolvedFile.startsWith(`${resolvedDir}${path.sep}`);
}

function safeUnlinkAttachment(filePath) {
  if (!filePath || !isInsideAttachmentsDir(filePath)) {
    return false;
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
}

function collectAttachmentsFromState(state) {
  const attachments = [];
  for (const workspace of state?.workspaces || []) {
    for (const task of workspace?.tasks || []) {
      for (const attachment of task?.attachments || []) {
        attachments.push(attachment);
      }
    }
  }
  return attachments;
}

function cloneStateForBackup(state) {
  const backupState = JSON.parse(JSON.stringify(state || {}));
  const usedArchiveNames = new Set();
  const files = [];

  for (const workspace of backupState.workspaces || []) {
    for (const task of workspace.tasks || []) {
      for (const attachment of task.attachments || []) {
        if (!attachment.path || !fs.existsSync(attachment.path)) {
          continue;
        }

        const sourceName = sanitizeFileName(path.basename(attachment.path));
        let archiveName = sourceName;
        let index = 1;
        while (usedArchiveNames.has(archiveName)) {
          const ext = path.extname(sourceName);
          const base = path.basename(sourceName, ext);
          archiveName = `${base}-${index}${ext}`;
          index += 1;
        }

        usedArchiveNames.add(archiveName);
        attachment.backupFileName = archiveName;
        files.push({
          archivePath: `attachments/${archiveName}`,
          sourcePath: attachment.path,
        });
      }
    }
  }

  return { backupState, files };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { dosDate, dosTime };
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function readZip(zipBuffer) {
  const entries = new Map();
  let offset = 0;

  while (offset < zipBuffer.length - 4) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }

    const compression = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const uncompressedSize = zipBuffer.readUInt32LE(offset + 22);
    const nameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraLength = zipBuffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = zipBuffer.toString('utf8', nameStart, nameStart + nameLength);
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (compression !== 0) {
      throw new Error('Only uncompressed TaskForge backup ZIP files are supported.');
    }

    if (compressedSize !== uncompressedSize || dataEnd > zipBuffer.length) {
      throw new Error('Invalid TaskForge backup ZIP file.');
    }

    entries.set(name.replace(/\\/g, '/'), zipBuffer.subarray(dataStart, dataEnd));
    offset = dataEnd;
  }

  return entries;
}

function restoreBackupState(zipEntries) {
  const tasksBuffer = zipEntries.get('tasks.json');
  if (!tasksBuffer) {
    throw new Error('Backup is missing tasks.json.');
  }

  const restoredState = JSON.parse(tasksBuffer.toString('utf8'));

  for (const workspace of restoredState.workspaces || []) {
    for (const task of workspace.tasks || []) {
      task.attachments = (task.attachments || []).map((attachment) => {
        const backupFileName = sanitizeFileName(
          attachment.backupFileName || path.basename(attachment.path || attachment.name || '')
        );
        const archivePath = `attachments/${backupFileName}`;
        const fileData = zipEntries.get(archivePath);

        const nextAttachment = { ...attachment };
        delete nextAttachment.backupFileName;

        if (fileData) {
          const targetPath = createAttachmentFilePath(nextAttachment.name || backupFileName);
          fs.writeFileSync(targetPath, fileData);
          const stats = fs.statSync(targetPath);
          nextAttachment.path = targetPath;
          nextAttachment.size = stats.size;
          nextAttachment.type = nextAttachment.type || getMimeType(nextAttachment.name || backupFileName);
        }

        return nextAttachment;
      });
    }
  }

  return restoredState;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
     icon: path.join(__dirname, 'dist', 'app-logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
      title: "TaskForge Premium",
  });

  // Load the built index.html from your React build folder
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

ipcMain.handle('get-tasks', () => {
  return store.get('task-manager-data', legacyStore.get('task-manager-data', null));
});

ipcMain.on('save-tasks', (_event, tasks) => {
  try {
    store.set('task-manager-data', tasks);
  } catch (error) {
    console.error('Failed to save tasks to electron-store', error);
  }
});

// Attachment IPC Handlers
ipcMain.handle('save-attachment', async (_event, fileBuffer, fileName) => {
  try {
    const fileExtension = path.extname(fileName).toLowerCase();
    if (!supportedExtensions.has(fileExtension)) {
      throw new Error('Unsupported attachment type.');
    }

    const filePath = createAttachmentFilePath(fileName);
    const buffer = Buffer.from(fileBuffer);
    
    // Write file to disk
    fs.writeFileSync(filePath, buffer);
    
    // Get file stats for size
    const stats = fs.statSync(filePath);
    const timestamp = Date.now();
    
    return {
      id: `att-${timestamp}-${crypto.randomBytes(4).toString('hex')}`,
      name: fileName,
      path: filePath,
      type: getMimeType(fileName),
      size: stats.size,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to save attachment:', error);
    throw error;
  }
});

ipcMain.handle('delete-attachment', async (_event, filePath) => {
  try {
    safeUnlinkAttachment(filePath);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    throw error;
  }
});

ipcMain.handle('open-attachment', async (_event, filePath) => {
  try {
    const result = await shell.openPath(filePath);
    if (result) {
      console.error('Failed to open file:', result);
      return { success: false, error: result };
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to open attachment:', error);
    throw error;
  }
});

ipcMain.handle('get-attachment-preview', async (_event, filePath) => {
  try {
    // Check if file is an image
    const ext = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    
    if (imageExtensions.includes(ext) && fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString('base64');
      return {
        isImage: true,
        data: base64,
        mimeType: {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
        }[ext],
      };
    }
    
    return { isImage: false };
  } catch (error) {
    console.error('Failed to get attachment preview:', error);
    return { isImage: false };
  }
});

ipcMain.handle('delete-attachments-for-task', async (_event, attachments) => {
  try {
    for (const attachment of attachments) {
      safeUnlinkAttachment(attachment.path);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to delete task attachments:', error);
    throw error;
  }
});

ipcMain.handle('export-backup', async (_event, state) => {
  const result = await dialog.showSaveDialog({
    title: 'Export TaskForge Backup',
    defaultPath: `TaskForge Backup ${new Date().toISOString().slice(0, 10)}.zip`,
    filters: [{ name: 'TaskForge Backup', extensions: ['zip'] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const { backupState, files } = cloneStateForBackup(state);
  const entries = [
    {
      name: 'tasks.json',
      data: Buffer.from(JSON.stringify(backupState, null, 2), 'utf8'),
    },
  ];

  for (const file of files) {
    entries.push({
      name: file.archivePath,
      data: fs.readFileSync(file.sourcePath),
    });
  }

  fs.writeFileSync(result.filePath, createZip(entries));
  return {
    success: true,
    path: result.filePath,
    attachmentCount: files.length,
  };
});

ipcMain.handle('import-backup', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Import TaskForge Backup',
    properties: ['openFile'],
    filters: [
      { name: 'TaskForge Backup', extensions: ['zip', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePaths?.[0]) {
    return { canceled: true };
  }

  const selectedPath = result.filePaths[0];
  const extension = path.extname(selectedPath).toLowerCase();

  if (extension === '.json') {
    const state = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
    return { success: true, state, path: selectedPath, attachmentCount: 0 };
  }

  const zipEntries = readZip(fs.readFileSync(selectedPath));
  const state = restoreBackupState(zipEntries);
  const attachmentCount = collectAttachmentsFromState(state).filter((attachment) => attachment.path).length;

  return {
    success: true,
    state,
    path: selectedPath,
    attachmentCount,
  };
});

app.whenReady().then(createWindow);
