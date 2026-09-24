const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('qvacAPI', {
  loadModel: () => {
    return ipcRenderer.invoke('load-model')
  },

  infer: (history) => {
    return ipcRenderer.invoke('infer', history)
  },

  unloadModel: () => {
    return ipcRenderer.invoke('unload-model')
  },

  onLoadProgress: (callback) => {
    ipcRenderer.on('load-progress', (_event, progress) => {
      callback(progress)
    })
  },

  onCompletionStream: (callback) => {
    ipcRenderer.on('completion-stream', (_event, token) => {
      callback(token)
    })
  },

  onCompletionFinished: (callback) => {
    ipcRenderer.on('completion-finished', () => {
      callback()
    })
  },
})