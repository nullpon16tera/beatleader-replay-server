const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  enableServer: () => ipcRenderer.send('enable-server'),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_event, value) => callback(value)),
  onReplayPath: (callback) => ipcRenderer.on('replay-path', (_event, value) => callback(value)),
}); 