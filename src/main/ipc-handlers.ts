import { ipcMain, BrowserWindow, dialog, shell } from 'electron'
import { probeFile } from './ffmpeg/probe'
import { getCodecs, getFormats } from './ffmpeg/codecs'
import { presets } from './ffmpeg/presets'
import { runConversionQueue, cancelQueue, ConversionJob } from './ffmpeg/manager'
import fs from 'fs'
import path from 'path'

const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mov', '.mkv', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.ts',
  '.mp3', '.wav', '.aac', '.flac', '.ogg', '.wma', '.m4a', '.aiff', '.alac',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.tga', '.exr', '.dpx'
])

function isMediaFile(filePath: string): boolean {
  return MEDIA_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

function scanDirectory(dirPath: string): string[] {
  const results: string[] = []

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (isMediaFile(full)) {
        results.push(full)
      }
    }
  }

  walk(dirPath)
  return results
}

export function registerIpcHandlers(): void {
  ipcMain.handle('probe-file', async (_event, filePath: string) => {
    return probeFile(filePath)
  })

  ipcMain.handle('get-codecs', async () => {
    return getCodecs()
  })

  ipcMain.handle('get-formats', async () => {
    return getFormats()
  })

  ipcMain.handle('get-presets', () => {
    return presets
  })

  ipcMain.handle('open-file-dialog', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return []

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Media Files',
          extensions: [...MEDIA_EXTENSIONS].map((e) => e.slice(1))
        }
      ]
    })

    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('open-folder-dialog', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return []

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })

    if (result.canceled || !result.filePaths.length) return []
    return scanDirectory(result.filePaths[0])
  })

  ipcMain.handle('scan-dropped-paths', async (_event, paths: string[]) => {
    const files: string[] = []
    for (const p of paths) {
      try {
        const stat = fs.statSync(p)
        if (stat.isDirectory()) {
          files.push(...scanDirectory(p))
        } else if (isMediaFile(p)) {
          files.push(p)
        }
      } catch {
        // skip inaccessible paths
      }
    }
    return files
  })

  ipcMain.handle('start-queue', async (_event, jobs: ConversionJob[]) => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) throw new Error('No active window')
    await runConversionQueue(jobs, window)
  })

  ipcMain.handle('cancel-queue', () => {
    cancelQueue()
  })

  ipcMain.handle('choose-output-dir', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return ''

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })

    return result.canceled || !result.filePaths.length ? '' : result.filePaths[0]
  })

  ipcMain.handle('show-item-in-folder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}
