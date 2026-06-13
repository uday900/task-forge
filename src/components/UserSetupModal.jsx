import { useState } from 'react';
import { useTasks } from '../context/TaskContext';

export default function UserSetupModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [customRole, setCustomRole] = useState('');
  const { dispatch } = useTasks();

  const handleSave = () => {
    if (!name || !email) return;

    const selectedRole = role === 'custom' ? customRole.trim() || 'Custom' : role;
    dispatch({ type: 'SET_USER', payload: { id: 'self', name, email, role: selectedRole } });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-xl w-[420px]">
        <h2 className="text-xl text-white font-bold mb-4">Setup Profile</h2>

        <input
          placeholder="Name"
          className="w-full p-3 rounded bg-slate-800 mb-3 text-white placeholder:text-slate-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full p-3 rounded bg-slate-800 mb-4 text-white placeholder:text-slate-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-3 mb-4 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="developer">Developer</option>
          <option value="designer">Designer</option>
          <option value="manager">Manager</option>
          <option value="contributor">Contributor</option>
          <option value="custom">Custom role...</option>
        </select>

        {role === 'custom' && (
          <input
            placeholder="Enter custom role"
            className="w-full p-3 rounded bg-slate-800 mb-4 text-white placeholder:text-slate-500"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
          />
        )}

        <button
          onClick={handleSave}
          className="w-full bg-blue-500 py-3 rounded"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
