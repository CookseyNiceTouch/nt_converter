import { spawn } from 'child_process'
import { getFfmpegPath } from './paths'

export interface CodecInfo {
  name: string
  description: string
  type: 'video' | 'audio' | 'subtitle'
  canEncode: boolean
  canDecode: boolean
}

export interface FormatInfo {
  name: string
  description: string
  canMux: boolean
  canDemux: boolean
}

function runFfmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpeg = getFfmpegPath()
    const proc = spawn(ffmpeg, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`))
        return
      }
      resolve(stdout)
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`))
    })
  })
}

export async function getCodecs(): Promise<CodecInfo[]> {
  const output = await runFfmpeg(['-codecs', '-hide_banner'])
  const lines = output.split('\n')
  const codecs: CodecInfo[] = []

  for (const line of lines) {
    // Format: " DEV.LS codec_name  Description"
    // D=Decode, E=Encode, V=Video, A=Audio, S=Subtitle
    const match = line.match(/^\s*([D.])([E.])([VAS])[.I][L.][S.]\s+(\S+)\s+(.+)$/)
    if (!match) continue

    const [, canDecode, canEncode, typeChar, name, description] = match
    const type = typeChar === 'V' ? 'video' : typeChar === 'A' ? 'audio' : 'subtitle'

    codecs.push({
      name,
      description: description.trim(),
      type,
      canEncode: canEncode === 'E',
      canDecode: canDecode === 'D'
    })
  }

  return codecs
}

export async function getFormats(): Promise<FormatInfo[]> {
  const output = await runFfmpeg(['-formats', '-hide_banner'])
  const lines = output.split('\n')
  const formats: FormatInfo[] = []

  for (const line of lines) {
    // Format: " DE format_name  Description"
    const match = line.match(/^\s*([D ])([E ])\s+(\S+)\s+(.+)$/)
    if (!match) continue

    const [, canDemux, canMux, name, description] = match

    if (name === '---' || name === 'Flags:') continue

    formats.push({
      name,
      description: description.trim(),
      canMux: canMux === 'E',
      canDemux: canDemux === 'D'
    })
  }

  return formats
}
