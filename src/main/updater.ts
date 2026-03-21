import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export function initAutoUpdater(window: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    window.webContents.send('update-available', {
      version: info.version
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    window.webContents.send('update-download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    window.webContents.send('update-error', { error: err.message })
  })

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // silently fail if offline or no releases exist
  })
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}
