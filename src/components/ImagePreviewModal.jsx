function ImagePreviewModal({ isOpen, attachments, previewIndex, onPrevious, onNext, onClose }) {
  return (
    <div
      className={`modal-backdrop ${isOpen ? '' : 'hidden'}`}
      id="imagePreviewModal"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="image-viewer" role="dialog" aria-modal="true">
        <button
          type="button"
          className="icon-button image-viewer-close"
          id="imagePreviewCloseBtn"
          aria-label="Close preview"
          onClick={onClose}
        >
          ×
        </button>
        <button
          type="button"
          className={`icon-button image-viewer-arrow prev ${attachments.length <= 1 ? 'hidden' : ''}`}
          id="imagePreviewPrevBtn"
          aria-label="Previous image"
          onClick={onPrevious}
        >
          ‹
        </button>
        <button
          type="button"
          className={`icon-button image-viewer-arrow next ${attachments.length <= 1 ? 'hidden' : ''}`}
          id="imagePreviewNextBtn"
          aria-label="Next image"
          onClick={onNext}
        >
          ›
        </button>
        <img
          id="previewImage"
          alt="Attachment preview"
          src={attachments[previewIndex] || ''}
        />
      </div>
    </div>
  );
}

export default ImagePreviewModal;
