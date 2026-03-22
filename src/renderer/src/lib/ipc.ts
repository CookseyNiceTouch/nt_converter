import type { FileMetadata, CodecInfo, FormatInfo, Preset, JobProgress, JobResult, JobError } from '../types'

function getApi(): Window['api'] {
  return window.api
}

export const ipc = {
  getPathForFile: (file: File): string => getApi().getPathForFile(file),
  probeFile: (filePath: string): Promise<FileMetadata> => getApi().probeFile(filePath),
  getCodecs: (): Promise<CodecInfo[]> => getApi().getCodecs(),
  getFormats: (): Promise<FormatInfo[]> => getApi().getFormats(),
  getPresets: (): Promise<Preset[]> => getApi().getPresets(),
  openFileDialog: (): Promise<string[]> => getApi().openFileDialog(),
  openFolderDialog: (): Promise<string[]> => getApi().openFolderDialog(),
  scanDroppedPaths: (paths: string[]): Promise<string[]> => getApi().scanDroppedPaths(paths),
  startQueue: (jobs: unknown[]): Promise<void> => getApi().startQueue(jobs),
  cancelQueue: (): Promise<void> => getApi().cancelQueue(),

  windowMinimize: (): Promise<void> => getApi().windowMinimize(),
  windowMaximize: (): Promise<void> => getApi().windowMaximize(),
  windowClose: (): Promise<void> => getApi().windowClose(),
  installUpdate: (): Promise<void> => getApi().installUpdate(),
  retryUpdate: (): Promise<void> => getApi().retryUpdate(),

  onJobProgress: (cb: (data: JobProgress) => void) => getApi().onJobProgress(cb),
  onJobComplete: (cb: (data: JobResult) => void) => getApi().onJobComplete(cb),
  onJobError: (cb: (data: JobError) => void) => getApi().onJobError(cb),
  onUpdateAvailable: (cb: (data: { version: string }) => void) => getApi().onUpdateAvailable(cb),
  onDownloadProgress: (cb: (data: { percent: number }) => void) => getApi().onDownloadProgress(cb),
  onUpdateDownloaded: (cb: () => void) => getApi().onUpdateDownloaded(cb),
  onUpdateError: (cb: (data: { error: string }) => void) => getApi().onUpdateError(cb)
}
