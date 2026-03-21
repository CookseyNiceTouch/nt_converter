import { spawn } from 'child_process'
import { getFfprobePath } from './paths'

export interface ProbeResult {
  duration: number
  width: number
  height: number
  videoCodec: string
  audioCodec: string
  bitrate: number
  fps: number
  size: number
}

export function probeFile(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const ffprobe = getFfprobePath()
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]

    const proc = spawn(ffprobe, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const data = JSON.parse(stdout)
        const videoStream = data.streams?.find(
          (s: Record<string, unknown>) => s.codec_type === 'video'
        )
        const audioStream = data.streams?.find(
          (s: Record<string, unknown>) => s.codec_type === 'audio'
        )
        const format = data.format || {}

        let fps = 0
        if (videoStream?.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/')
          fps = den ? Math.round((parseInt(num) / parseInt(den)) * 100) / 100 : parseFloat(num)
        }

        resolve({
          duration: parseFloat(format.duration || '0'),
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          videoCodec: videoStream?.codec_name || '',
          audioCodec: audioStream?.codec_name || '',
          bitrate: parseInt(format.bit_rate || '0'),
          fps,
          size: parseInt(format.size || '0')
        })
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ffprobe: ${err.message}`))
    })
  })
}
