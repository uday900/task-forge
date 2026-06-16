import { useEffect, useState } from 'react';
import {
  deleteAttachment,
  formatFileSize,
  getAttachmentPreview,
  getFileIcon,
  isImage,
  openAttachment,
} from '../utils/attachmentUtils';

export default function AttachmentsList({
  attachments = [],
  onRemove = null,
  isEditable = false,
  onOpen = null,
}) {
  const [previews, setPreviews] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let canceled = false;

    const loadPreviews = async () => {
      const imageAttachments = attachments.filter(
        (attachment) => isImage(attachment.type, attachment.name) && !previews[attachment.id]
      );

      for (const attachment of imageAttachments) {
        try {
          const preview = await getAttachmentPreview(attachment.path);
          if (!canceled && preview.isImage) {
            setPreviews((current) => ({
              ...current,
              [attachment.id]: preview,
            }));
          }
        } catch (error) {
          console.error('Failed to load attachment preview:', error);
        }
      }
    };

    loadPreviews();

    return () => {
      canceled = true;
    };
  }, [attachments, previews]);

  const handleOpen = async (attachment) => {
    if (onOpen) {
      await onOpen(attachment);
      return;
    }

    await openAttachment(attachment.path);
  };

  const handleDelete = async (attachment) => {
    setBusyId(attachment.id);
    try {
      if (onRemove) {
        await onRemove(attachment);
      } else {
        await deleteAttachment(attachment.path);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (!attachments.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => {
        const preview = previews[attachment.id];
        const imageAttachment = isImage(attachment.type, attachment.name);

        return (
          <div
            key={attachment.id}
            className="group overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-800/50 transition-colors hover:border-slate-600"
          >
            {imageAttachment && preview?.isImage && (
              <button
                type="button"
                className="relative block h-36 w-full overflow-hidden bg-slate-950"
                onClick={() => handleOpen(attachment)}
                title="Open image"
              >
                <img
                  src={`data:${preview.mimeType};base64,${preview.data}`}
                  alt={attachment.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                  Open
                </span>
              </button>
            )}

            <div className="p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-slate-300">
                  {getFileIcon(attachment.type, attachment.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-white">
                    {attachment.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{formatFileSize(attachment.size)}</span>
                    {attachment.createdAt && (
                      <>
                        <span>|</span>
                        <span>
                          {new Date(attachment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpen(attachment)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    title="Open"
                  >
                    Open
                  </button>

                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => handleDelete(attachment)}
                      disabled={busyId === attachment.id}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
