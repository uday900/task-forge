import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';

export default function UserSetupModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [customRole, setCustomRole] = useState('');
  const [pendingImport, setPendingImport] = useState(null);
  const [importFilename, setImportFilename] = useState('');
  const [importError, setImportError] = useState('');

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { dispatch } = useTasks();

  const handleSave = () => {
    if (!pendingImport && (!name || !email)) return;

    if (pendingImport) {
      console.log('Importing backup:', pendingImport);
      dispatch({
        type: 'IMPORT_DATA',
        payload: JSON.stringify(pendingImport),
      });
      navigate('/');
      return;
    }

    const selectedRole =
      role === 'custom'
        ? customRole.trim() || 'Custom'
        : role;

    dispatch({
      type: 'SET_USER',
      payload: {
        id: 'self',
        name,
        email,
        role: selectedRole,
      },
    });

    navigate('/');
  };

  const handleImportBackup = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportError('Please select a JSON backup file.');
      setImportFilename('');
      setPendingImport(null);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result);
        setPendingImport(imported);
        setImportFilename(file.name);
        setImportError('');
      } catch (error) {
        setImportError('Failed to import backup. Make sure the file is valid JSON.');
        setImportFilename('');
        setPendingImport(null);
      } finally {
        if (event.target) {
          event.target.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const openImportDialog = () => {
    fileInputRef.current?.click();
  };

  const inputClass =
    'w-full h-11 rounded-xl border-2 border-slate-700 bg-slate-800/50 px-4 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500';
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950 p-6">
      <div className="mx-auto mt-8 w-full max-w-[620px] rounded-2xl border-2 border-slate-800 bg-slate-900 p-8 shadow-2xl">
        {/* Header */}
        <div className=" text-center">
          <img
            src="/app-logo.png"
            alt="TaskForge Logo"
            className="mx-auto h-30 object-cover"
          />
          <h1 className="text-3xl font-bold text-white">
            Setup TaskForge
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Create your profile or restore from backup
          </p>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="mb-1 block text-sm text-slate-300">
            Name
          </label>

          <input
            placeholder="John Doe"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="mb-1 block text-sm text-slate-300">
            Email
          </label>

          <input
            type="email"
            placeholder="john@example.com"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Role */}
        <div className="mb-3">
          <label className="mb-1 block text-sm text-slate-300">
            Role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
            <option value="contributor">Contributor</option>
            <option value="custom">Other</option>
          </select>
        </div>

        {/* Custom Role */}
        {role === 'custom' && (
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-300">
              Custom Role
            </label>

            <input
              placeholder="Enter custom role"
              className={inputClass}
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          </div>
        )}

        {/* Divider */}
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-slate-800" />
          <span className="mx-3 text-xs text-slate-500">
            OR
          </span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Import Backup */}
        <div className="mb-4 rounded-xl border-2 border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-200">
                Import Backup
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {importFilename || 'No backup selected'}
              </p>
            </div>

            <button
              type="button"
              onClick={openImportDialog}
              className="
              shrink-0
              rounded-lg
              bg-slate-800
              px-4
              py-2
              text-sm
              text-white
              transition
              hover:bg-slate-700
              rounded-button
            "
            >
              Choose File
            </button>
          </div>

          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            onChange={handleImportBackup}
            className="hidden"
          />

          {importError && (
            <p className="mt-2 text-xs text-rose-400">
              {importError}
            </p>
          )}
        </div>

        {/* Continue */}
        <button
          onClick={handleSave}
          disabled={!(pendingImport || (name.trim() && email.trim()))}
          className="
          h-11
          w-full
          rounded-xl
          bg-blue-600
          font-medium
          text-white
          transition
          hover:bg-blue-500
          disabled:cursor-not-allowed
          disabled:opacity-50
          rounded-button
        "
        >
          Continue
        </button>
      </div>
    </div>
  );
}