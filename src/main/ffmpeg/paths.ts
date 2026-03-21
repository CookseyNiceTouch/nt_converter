import path from 'path'
import { app } from 'electron'

function getResourceBase(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'ffmpeg')
  }
  const platform = `${process.platform}-${process.arch}`
  return path.join(__dirname, '../../resources/ffmpeg', platform)
}

export function getFfmpegPath(): string {
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(getResourceBase(), `ffmpeg${ext}`)
}

export function getFfprobePath(): string {
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(getResourceBase(), `ffprobe${ext}`)
}
