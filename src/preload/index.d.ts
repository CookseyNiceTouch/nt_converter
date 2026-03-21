import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  getPathForFile: (file: File) => string
  probeFile: (filePath: string) => Promise<import('../renderer/src/types').FileMetadata>
  getCodecs: () => Promise<import('../renderer/src/types').CodecInfo[]>
  getFormats: () => Promise<import('../renderer/src/types').FormatInfo[]>
  getPresets: () => Promise<import('../renderer/src/types').Preset[]>
  openFileDialog: () => Promise<string[]>
  openFolderDialog: () => Promise<string[]>
  scanDroppedPaths: (paths: string[]) => Promise<string[]>
  startQueue: (jobs: unknown[]) => Promise<void>
  cancelQueue: () => Promise<void>

  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  installUpdate: () => Promise<void>

  onJobProgress: (callback: (data: import('../renderer/src/types').JobProgress) => void) => () => void
  onJobComplete: (callback: (data: import('../renderer/src/types').JobResult) => void) => () => void
  onJobError: (callback: (data: import('../renderer/src/types').JobError) => void) => () => void
  onUpdateAvailable: (callback: (data: { version: string }) => void) => () => void
  onUpdateDownloaded: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
