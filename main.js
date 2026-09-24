import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel,
} from '@qvac/sdk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.commandLine.appendSwitch('no-sandbox')

let mainWindow = null
let modelId = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile('index.html')
}

ipcMain.handle('load-model', async () => {
  if (modelId) {
    return {
      success: true,
      message: 'QVAC model is already loaded.',
    }
  }

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: 'llm',

    onProgress: (progress) => {
      if (mainWindow && progress) {
        mainWindow.webContents.send(
          'load-progress',
          progress.percentage ?? 0
        )
      }
    },
  })

  return {
    success: true,
    message: 'QVAC model loaded successfully.',
  }
})

ipcMain.handle('infer', async (_event, history) => {
  if (!modelId) {
    throw new Error('QVAC model is not loaded yet.')
  }

  const result = completion({
    modelId,
    history,
    stream: true,
  })

  for await (const token of result.tokenStream) {
    if (mainWindow) {
      mainWindow.webContents.send('completion-stream', token)
    }
  }

  if (mainWindow) {
    mainWindow.webContents.send('completion-finished')
  }

  return {
    success: true,
  }
})

ipcMain.handle('unload-model', async () => {
  if (modelId) {
    await unloadModel({
      modelId,
    })

    modelId = null
  }

  return {
    success: true,
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  if (modelId) {
    try {
      await unloadModel({
        modelId,
      })
    } catch (error) {
      console.error('Error unloading QVAC model:', error)
    }

    modelId = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})