function ProfileModal({ isOpen, formState, onFormChange, onSubmit, onClose }) {
  return (
    <div className={`modal-backdrop ${isOpen ? '' : 'hidden'}`} id="profileModal" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal profile-modal" id="profileForm" onSubmit={onSubmit}>
        <div className="modal-head">
          <h2>Welcome to MyTasks</h2>
          <button type="button" className="icon-button hidden" id="profileCloseBtn" onClick={onClose}>
            x
          </button>
        </div>
        <div className="profile-body">
          <label>
            Name
            <input
              value={formState.name}
              onChange={(event) => onFormChange('name', event.target.value)}
              id="profileName"
              required
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={formState.email}
              onChange={(event) => onFormChange('email', event.target.value)}
              id="profileEmail"
              required
              maxLength={180}
              autoComplete="email"
            />
          </label>
          <label>
            Role
            <input
              value={formState.role}
              onChange={(event) => onFormChange('role', event.target.value)}
              id="profileRole"
              required
              maxLength={120}
              autoComplete="organization-title"
            />
          </label>
        </div>
        <div className="modal-actions profile-actions">
          <span />
          <button type="submit" className="button primary">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileModal;
