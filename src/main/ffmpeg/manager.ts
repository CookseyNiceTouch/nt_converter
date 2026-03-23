import path from 'path'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import { getFfmpegPath } from './paths'

export interface ConversionJob {
  fileId: string
  inputPath: string
  settings: {
    videoCodec: string
    audioCodec: string
    container: string
    resolution: string
    videoBitrate: string
    audioBitrate: string
    fps: string
    extraArgs: string
    outputDir: string
  }
  duration: number
}

let currentProcess: ChildProcess | null = null
let cancelled = false

function buildOutputPath(inputPath: string, settings: ConversionJob['settings']): string {
  const dir = settings.outputDir || path.dirname(inputPath)
  const ext = path.extname(inputPath)
  const base = path.basename(inputPath, ext)

  const codecTag = settings.videoCodec
    ? settings.videoCodec.replace(/^lib/, '')
    : settings.audioCodec.replace(/^lib/, '')

  const resTag = settings.resolution
    ? `_${settings.resolution.replace(':', 'x').replace('-1', 'auto')}`
    : ''

  const outputExt = settings.container ? `.${settings.container}` : ext
  const baseName = `${base}_nt_${codecTag}${resTag}`
  let finalPath = path.join(dir, `${baseName}${outputExt}`)
  let counter = 2
  while (fs.existsSync(finalPath)) {
    finalPath = path.join(dir, `${baseName}_${counter}${outputExt}`)
    counter++
  }
  return finalPath
}

function buildFfmpegArgs(job: ConversionJob): string[] {
  const { settings } = job
  const outputPath = buildOutputPath(job.inputPath, settings)

  const args: string[] = ['-y', '-i', job.inputPath]

  if (settings.videoCodec) {
    args.push('-c:v', settings.videoCodec)
  }

  if (settings.audioCodec) {
    args.push('-c:a', settings.audioCodec)
  }

  if (settings.resolution) {
    args.push('-vf', `scale=${settings.resolution}`)
  }

  if (settings.videoBitrate) {
    args.push('-b:v', settings.videoBitrate)
  }

  if (settings.audioBitrate) {
    args.push('-b:a', settings.audioBitrate)
  }

  if (settings.fps) {
    args.push('-r', settings.fps)
  }

  if (settings.extraArgs) {
    const extra = settings.extraArgs.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    args.push(...extra.map((a) => a.replace(/^"|"$/g, '')))
  }

  args.push('-progress', 'pipe:1', '-nostats')
  args.push(outputPath)

  return args
}

function parseProgressLine(
  line: string,
  duration: number
): { percent: number; fps: number; bitrate: string; speed: string } | null {
  if (!line.includes('=')) return null

  const data: Record<string, string> = {}
  for (const part of line.split('\n')) {
    const [key, ...rest] = part.split('=')
    if (key && rest.length) {
      data[key.trim()] = rest.join('=').trim()
    }
  }

  if (data['out_time_us'] || data['out_time_ms']) {
    const timeUs = parseInt(data['out_time_us'] || '0') ||
      parseInt(data['out_time_ms'] || '0') * 1000
    const currentSec = timeUs / 1_000_000
    const percent = duration > 0 ? Math.min(100, (currentSec / duration) * 100) : 0

    return {
      percent: Math.round(percent * 10) / 10,
      fps: parseFloat(data['fps'] || '0'),
      bitrate: data['bitrate'] || '',
      speed: data['speed'] || ''
    }
  }

  return null
}

export async function runConversionQueue(
  jobs: ConversionJob[],
  window: BrowserWindow
): Promise<void> {
  cancelled = false

  for (const job of jobs) {
    if (cancelled) break

    const outputPath = buildOutputPath(job.inputPath, job.settings)
    const args = buildFfmpegArgs(job)
    const ffmpeg = getFfmpegPath()

    try {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpeg, args)
        currentProcess = proc

        let progressBuffer = ''

        proc.stdout.on('data', (data: Buffer) => {
          progressBuffer += data.toString()
          const lines = progressBuffer.split('progress=')
          progressBuffer = lines.pop() || ''

          for (const block of lines) {
            const parsed = parseProgressLine(block, job.duration)
            if (parsed) {
              const eta = parsed.speed
                ? formatEta(job.duration, parsed.percent, parsed.speed)
                : ''

              window.webContents.send('job-progress', {
                fileId: job.fileId,
                percent: parsed.percent,
                fps: parsed.fps,
                bitrate: parsed.bitrate,
                speed: parsed.speed,
                eta,
                currentTime: (parsed.percent / 100) * job.duration
              })
            }
          }
        })

        proc.stderr.on('data', () => {
          // ffmpeg sends diagnostic info to stderr; we use -progress pipe:1 instead
        })

        proc.on('close', (code) => {
          currentProcess = null
          if (cancelled) {
            reject(new Error('Cancelled'))
          } else if (code !== 0) {
            reject(new Error(`ffmpeg exited with code ${code}`))
          } else {
            resolve()
          }
        })

        proc.on('error', (err) => {
          currentProcess = null
          reject(err)
        })
      })

      window.webContents.send('job-complete', {
        fileId: job.fileId,
        outputPath
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message !== 'Cancelled') {
        window.webContents.send('job-error', {
          fileId: job.fileId,
          error: message
        })
      }
    }
  }
}

function formatEta(duration: number, percent: number, speedStr: string): string {
  const speed = parseFloat(speedStr)
  if (!speed || speed <= 0 || percent <= 0) return ''

  const remainingSec = ((100 - percent) / 100) * duration
  const etaSec = remainingSec / speed

  if (etaSec < 60) return `${Math.round(etaSec)}s`
  if (etaSec < 3600) return `${Math.floor(etaSec / 60)}m ${Math.round(etaSec % 60)}s`
  return `${Math.floor(etaSec / 3600)}h ${Math.floor((etaSec % 3600) / 60)}m`
}

export function cancelQueue(): void {
  cancelled = true
  if (currentProcess) {
    currentProcess.kill('SIGTERM')
    currentProcess = null
  }
}
