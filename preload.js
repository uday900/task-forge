const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  user: {
    get: () => ipcRenderer.invoke('user:get'),
    save: (user) => ipcRenderer.invoke('user:save', user)
  },
  tasks: {
    getAll: () => ipcRenderer.invoke('tasks:getAll'),
    save: (task) => ipcRenderer.invoke('tasks:save', task),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    toggleDone: (id, done) => ipcRenderer.invoke('tasks:toggleDone', id, done)
  },
  team: {
    getAll: () => ipcRenderer.invoke('team:getAll'),
    save: (member) => ipcRenderer.invoke('team:save', member),
    delete: (id) => ipcRenderer.invoke('team:delete', id)
  },
  lists: {
    getAll: () => ipcRenderer.invoke('lists:getAll'),
    save: (list) => ipcRenderer.invoke('lists:save', list),
    delete: (id) => ipcRenderer.invoke('lists:delete', id)
  },
  data: {
    export: (format) => ipcRenderer.invoke('data:export', format),
    import: () => ipcRenderer.invoke('data:import')
  }
});
