import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import Avatar from '../components/Avatar';

export default function Settings() {
  const { state, currentWorkspace, dispatch } = useTasks();
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingWorkspaceName, setEditingWorkspaceName] = useState(currentWorkspace?.name || '');
  const [teamEnabled, setTeamEnabled] = useState(currentWorkspace?.teamEnabled || false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'developer', customRole: '' });
  const navigate = useNavigate();
  const team = currentWorkspace?.team || [];

  const handleWorkspaceCreate = () => {
    if (!workspaceName.trim()) return;
    dispatch({ type: 'ADD_WORKSPACE', payload: { name: workspaceName.trim() } });
    setWorkspaceName('');
  };

  const handleUpdateWorkspaceName = () => {
    if (!editingWorkspaceName.trim()) return;
    dispatch({ type: 'UPDATE_WORKSPACE', payload: editingWorkspaceName.trim() });
  };

  const handleDeleteWorkspace = () => {
    if (state.workspaces.length === 1) {
      alert('You must have at least one workspace');
      return;
    }
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete "${currentWorkspace?.name}"?\n\n` +
      'Make sure to export your data first to keep it safe.'
    );
    if (confirmed) {
      dispatch({ type: 'DELETE_WORKSPACE' });
      navigate('/');
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      user: state.user,
      workspaces: state.workspaces,
      selectedWorkspaceId: state.selectedWorkspaceId,
    };
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result);
        dispatch({ type: 'IMPORT_DATA', payload: JSON.stringify(imported) });
        alert('Data imported successfully');
      } catch (error) {
        alert('Failed to import data. Make sure the file is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleTeamEnabledChange = (enabled) => {
    setTeamEnabled(enabled);
    dispatch({ type: 'SET_TEAM_ENABLED', payload: { enabled } });
  };

  const handleAddTeamMember = () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) return;
    const selectedRole = memberForm.role === 'custom'
      ? memberForm.customRole.trim() || 'Custom'
      : memberForm.role;

    if (editingMember) {
      dispatch({
        type: 'UPDATE_TEAM_MEMBER',
        payload: { ...memberForm, id: editingMember.id, role: selectedRole },
      });
      setEditingMember(null);
    } else {
      dispatch({
        type: 'ADD_TEAM_MEMBER',
        payload: { name: memberForm.name, email: memberForm.email, role: selectedRole },
      });
    }
    setMemberForm({ name: '', email: '', role: 'developer', customRole: '' });
    setShowAddTeamModal(false);
  };

  const handleEditMember = (member) => {
    const predefinedRoles = ['developer', 'designer', 'manager', 'contributor'];
    const isPredefined = predefinedRoles.includes(member.role);

    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      role: isPredefined ? member.role : 'custom',
      customRole: isPredefined ? '' : member.role,
    });
    setShowAddTeamModal(true);
  };

  const handleDeleteMember = (memberId) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      dispatch({ type: 'DELETE_TEAM_MEMBER', payload: memberId });
    }
  };

  const handleCloseModal = () => {
    setShowAddTeamModal(false);
    setEditingMember(null);
    setMemberForm({ name: '', email: '', role: 'developer' });
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-slate-950 text-white px-6 py-6">

      <div className="rounded-3xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-2 border-blue-500/50 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              {currentWorkspace?.name}
            </h1>

            <p className="mt-2 text-slate-400">
              Manage workspace, team members and backups.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 filter-button"
          >
            Back
          </button>
        </div>
      </div>

      <div className="mt-6 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-slate-900 p-5">
          <p className="text-slate-400 text-sm">Workspaces</p>
          <h3 className="text-3xl font-bold mt-2">
            {state.workspaces.length}
          </h3>
        </div>

        <div className="rounded-3xl bg-slate-900 p-5">
          <p className="text-slate-400 text-sm">Tasks</p>
          <h3 className="text-3xl font-bold mt-2">
            {currentWorkspace?.tasks?.length || 0}
          </h3>
        </div>

        <div className="rounded-3xl bg-slate-900 p-5">
          <p className="text-slate-400 text-sm">Members</p>
          <h3 className="text-3xl font-bold mt-2">
            {team.length}
          </h3>
        </div>

        <div className="rounded-3xl bg-slate-900 p-5">
          <p className="text-slate-400 text-sm">Team Mode</p>
          <h3 className="text-lg font-semibold mt-3">
            {teamEnabled ? 'Enabled' : 'Disabled'}
          </h3>
        </div>
      </div>

      <section className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-semibold text-white mb-6">Workspace settings</h2>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="grid gap-2 sm:grid-cols-[240px_1fr] items-center">
            <span>Workspace name</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={editingWorkspaceName}
                onChange={(e) => setEditingWorkspaceName(e.target.value)}
                className="flex-1 rounded-2xl border-2 border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <button
                className="filter-button bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-400"
                onClick={handleUpdateWorkspaceName}
              >
                Save
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_1fr] items-center">
            <span>Team enabled</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={teamEnabled}
                onChange={(e) => handleTeamEnabledChange(e.target.checked)}
                className="peer sr-only"
              />

              <div
                className="
      relative
      h-7
      w-14
      rounded-full
      bg-slate-700
      transition-colors
      duration-300
      peer-checked:bg-blue-500

      after:absolute
      after:left-1
      after:top-1
      after:h-5
      after:w-5
      after:rounded-full
      after:bg-white
      after:transition-transform
      after:duration-300
      after:content-['']

      peer-checked:after:translate-x-7
    "
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_1fr] items-center">
            <span>Add workspace</span>
            <div>
              <button
                className="bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                onClick={() => {
                  const name = window.prompt('New workspace name');
                  if (name && name.trim()) {
                    dispatch({ type: 'ADD_WORKSPACE', payload: { name: name.trim() } });
                  }
                }}
              >
                + Add workspace
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_1fr] items-center">
            <span>Data Import/Export</span>
            <div className="flex gap-2">
              <button
                className="bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                onClick={handleExportData}
              >
                Export data
              </button>
              <button
                className="bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                onClick={() => document.getElementById('import-input').click()}
              >
                Import data
              </button>
            </div>
          </div>


          <div className="rounded-3xl bg-rose-500/5 border-2 border-rose-500/20 p-5">
            <h3 className="text-rose-400 font-semibold">
              Danger Zone
            </h3>

            <p className="text-slate-400 text-sm mt-2">
              Permanently delete this workspace and all tasks.
            </p>

            <button
              className="
      mt-4
      rounded-2xl
      bg-rose-600
      px-4
      py-2
      text-sm
      font-semibold
    "
            >
              Delete Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Add new workspace section moved into Workspace settings as a prompt-based button */}

      {teamEnabled && (
        <section className="mt-6 rounded-3xl border-2 border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Team members</h2>
            <button
              className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              onClick={() => {
                setEditingMember(null);
                setMemberForm({ name: '', email: '', role: 'developer' });
                setShowAddTeamModal(true);
              }}
            >
              + Add member
            </button>
          </div>

          {team.length === 0 ? (
            <p className="text-slate-400 text-sm">No team members yet.</p>
          ) : (
            <div className="space-y-3">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="
    rounded-3xl
    bg-slate-950
    p-3
    hover:bg-slate-900
    cursor-pointer
    transition-all
    flex justify-between items-center
  "
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} />

                    <div>
                      <h5 className="font-semibold">
                        {member.name}  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                          {member.role}
                        </span>
                      </h5>

                      <p className="text-xs text-slate-400">
                        {member.email}
                      </p>
                    </div>


                  </div>

                  <div className=" flex justify-between items-center">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditMember(member)}>Edit</button>
                      <button onClick={() => handleDeleteMember(member.id)}>Delete</button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="relative w-full max-w-md rounded-3xl border-2 border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <button
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              onClick={handleCloseModal}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold text-white mb-6">
              {editingMember ? 'Edit team member' : 'Add team member'}
            </h3>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="Name"
                className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="Email"
                className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <select
                value={memberForm.role}
                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
                <option value="contributor">Contributor</option>
                <option value="custom">Custom role...</option>
              </select>
              {memberForm.role === 'custom' && (
                <input
                  type="text"
                  value={memberForm.customRole}
                  onChange={(e) => setMemberForm({ ...memberForm, customRole: e.target.value })}
                  placeholder="Enter custom role"
                  className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-400"
                onClick={handleAddTeamMember}
              >
                {editingMember ? 'Save changes' : 'Add member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
