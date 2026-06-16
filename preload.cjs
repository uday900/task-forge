const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure "api" object to your React frontend window
contextBridge.exposeInMainWorld('api', {
  saveTasks: (tasks) => ipcRenderer.send('save-tasks', tasks),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  
  // Attachment APIs
  saveAttachment: (fileBuffer, fileName) => ipcRenderer.invoke('save-attachment', fileBuffer, fileName),
  deleteAttachment: (filePath) => ipcRenderer.invoke('delete-attachment', filePath),
  openAttachment: (filePath) => ipcRenderer.invoke('open-attachment', filePath),
  getAttachmentPreview: (filePath) => ipcRenderer.invoke('get-attachment-preview', filePath),
  deleteAttachmentsForTask: (attachments) => ipcRenderer.invoke('delete-attachments-for-task', attachments),
  exportBackup: (state) => ipcRenderer.invoke('export-backup', state),
  importBackup: () => ipcRenderer.invoke('import-backup'),
});
