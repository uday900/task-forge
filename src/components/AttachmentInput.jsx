import { useRef, useState } from 'react';
import { formatFileSize, getFileIcon, isValidFileType } from '../utils/attachmentUtils';

export default function AttachmentInput({ selectedFiles = [], onFilesSelected = () => {} }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (isValidFileType(file)) {
        validFiles.push({
          id: window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : Math.random().toString(36).slice(2),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    setError(invalidFiles.length ? `Unsupported file types: ${invalidFiles.join(', ')}` : '');
    onFilesSelected([...selectedFiles, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.txt"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={handleDrop}
        className="relative w-full rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/30 px-4 py-6 text-center transition-all hover:border-blue-500 hover:bg-slate-800/60"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-lg font-semibold text-blue-300">
            +
          </span>
          <div>
            <p className="text-sm font-medium text-slate-200">Add Attachment</p>
            <p className="mt-1 text-xs text-slate-400">
              PNG, JPG, WEBP, PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>
      </button>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Selected Files ({selectedFiles.length})
          </p>
          <div className="space-y-2">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 transition-colors hover:border-slate-600"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-slate-300">
                    {getFileIcon(item.type, item.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(item.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onFilesSelected(selectedFiles.filter((file) => file.id !== item.id))}
                  className="ml-2 shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                  title="Remove"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
