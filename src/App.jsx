import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { useTasks } from './context/TaskContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import UserSetupModal from './components/UserSetupModal';
import TaskModal from './components/TaskModal';

export default function App() {
  const { state } = useTasks();
  const user = state.user;
console.log('Current user:', user);
  return (
    <HashRouter>
      {(!user?.name || !user?.email || !user?.role) && <UserSetupModal />}
     
      <div className="flex min-h-screen overflow-hidden bg-slate-950 text-white">
        
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </div>

      <TaskModal />
    </HashRouter>
  );
}