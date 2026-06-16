/**
 * Attachment Utilities Module
 * Handles attachment file handling, preview generation, and IPC communication.
 */

export async function saveAttachment(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await window.api.saveAttachment(arrayBuffer, file.name);
  } catch (error) {
    console.error('Failed to save attachment:', error);
    throw error;
  }
}

export async function deleteAttachment(filePath) {
  try {
    return await window.api.deleteAttachment(filePath);
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    throw error;
  }
}

export async function openAttachment(filePath) {
  try {
    return await window.api.openAttachment(filePath);
  } catch (error) {
    console.error('Failed to open attachment:', error);
    throw error;
  }
}

export async function getAttachmentPreview(filePath) {
  try {
    return await window.api.getAttachmentPreview(filePath);
  } catch (error) {
    console.error('Failed to get attachment preview:', error);
    return { isImage: false };
  }
}

export async function deleteAttachmentsForTask(attachments) {
  if (!attachments || attachments.length === 0) {
    return { success: true };
  }

  try {
    return await window.api.deleteAttachmentsForTask(attachments);
  } catch (error) {
    console.error('Failed to delete task attachments:', error);
    throw error;
  }
}

export async function exportBackup(state) {
  return window.api.exportBackup(state);
}

export async function importBackup() {
  return window.api.importBackup();
}

export function collectAttachmentsFromWorkspaces(workspaces = []) {
  return workspaces.flatMap((workspace) =>
    (workspace.tasks || []).flatMap((task) => task.attachments || [])
  );
}

export function formatFileSize(bytes = 0) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function getFileIcon(mimeType, fileName = '') {
  const lowerName = fileName.toLowerCase();

  if (mimeType?.startsWith('image/')) return 'IMG';
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'PDF';
  if (mimeType?.includes('word') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return 'DOC';
  if (mimeType === 'text/plain' || lowerName.endsWith('.txt')) return 'TXT';

  return 'FILE';
}

export function isImage(mimeType, fileName = '') {
  return (
    mimeType?.startsWith('image/') ||
    /\.(png|jpe?g|webp)$/i.test(fileName)
  );
}

export function isValidFileType(file) {
  const validTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.doc', '.docx', '.txt'];
  const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;

  return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
}

export function getFileTypeName(mimeType) {
  const typeMap = {
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/webp': 'WebP Image',
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'text/plain': 'Text File',
  };

  return typeMap[mimeType] || 'File';
}
