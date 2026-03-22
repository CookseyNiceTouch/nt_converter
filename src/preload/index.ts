import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  probeFile: (filePath: string) => ipcRenderer.invoke('probe-file', filePath),
  getCodecs: () => ipcRenderer.invoke('get-codecs'),
  getFormats: () => ipcRenderer.invoke('get-formats'),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  scanDroppedPaths: (paths: string[]) => ipcRenderer.invoke('scan-dropped-paths', paths),
  startQueue: (jobs: unknown[]) => ipcRenderer.invoke('start-queue', jobs),
  cancelQueue: () => ipcRenderer.invoke('cancel-queue'),

  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  retryUpdate: () => ipcRenderer.invoke('retry-update'),

  onJobProgress: (callback: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown): void => callback(data)
    ipcRenderer.on('job-progress', handler)
    return () => ipcRenderer.removeListener('job-progress', handler)
  },
  onJobComplete: (callback: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown): void => callback(data)
    ipcRenderer.on('job-complete', handler)
    return () => ipcRenderer.removeListener('job-complete', handler)
  },
  onJobError: (callback: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown): void => callback(data)
    ipcRenderer.on('job-error', handler)
    return () => ipcRenderer.removeListener('job-error', handler)
  },
  onUpdateAvailable: (callback: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown): void => callback(data)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },
  onDownloadProgress: (callback: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown): void => callback(data)
    ipcRenderer.on('update-download-progress', handler)
    return () => ipcRenderer.removeListener('update-download-progress', handler)
  },
  onUpdateDownloaded: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },
  onUpdateError: (callback: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown): void => callback(data)
    ipcRenderer.on('update-error', handler)
    return () => ipcRenderer.removeListener('update-error', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch {
    // fallback
  }
} else {
  // @ts-expect-error global augmentation
  window.electron = electronAPI
  // @ts-expect-error global augmentation
  window.api = api
}
