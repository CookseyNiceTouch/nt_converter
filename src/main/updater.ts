import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import log from 'electron-log'

export function initAutoUpdater(window: BrowserWindow): void {
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    log.info(`[updater] update available: v${info.version}`)
    window.webContents.send('update-available', {
      version: info.version
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    log.info(`[updater] download progress: ${progress.percent.toFixed(1)}%`)
    window.webContents.send('update-download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('[updater] download complete')
    window.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    log.error('[updater] error:', err)
    window.webContents.send('update-error', { error: err.message })
  })

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error('[updater] check failed:', err)
  })
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}

export function retryUpdate(): void {
  autoUpdater.checkForUpdatesAndNotify().catch(() => {})
}
