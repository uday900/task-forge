import { initials, displayMemberName } from '../utils';

function TeamModal({ isOpen, team, formState, onFormChange, onSubmit, onDeleteMember, onClose }) {
  return (
    <div className={`modal-backdrop ${isOpen ? '' : 'hidden'}`} id="teamModal" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal">
        <div className="modal-head">
          <h2>Team</h2>
          <button type="button" className="icon-button" data-close="team" onClick={onClose}>
            x
          </button>
        </div>
        <div className="team-list" id="teamList">
          {team.map((member) => (
            <div key={member.id} className="team-row">
              <span className="avatar" style={{ background: member.color || '#64748b' }}>
                {initials(member.name)}
              </span>
              <div>
                <div className="team-name">{displayMemberName(member)}</div>
                <div className="team-role">{member.role || 'No role'}</div>
              </div>
              <button
                className="button secondary"
                type="button"
                disabled={member.id === 'me'}
                onClick={() => onDeleteMember(member.id)}
              >
                {member.id === 'me' ? 'You' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
        <form className="team-add" id="teamForm" onSubmit={onSubmit}>
          <input
            value={formState.name}
            onChange={(event) => onFormChange('name', event.target.value)}
            id="memberName"
            placeholder="Name"
            required
            autoComplete="off"
          />
          <input
            value={formState.role}
            onChange={(event) => onFormChange('role', event.target.value)}
            id="memberRole"
            placeholder="Role"
            autoComplete="off"
          />
          <button className="button primary" type="submit">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

export default TeamModal;
