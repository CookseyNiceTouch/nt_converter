export interface FileMetadata {
  duration: number
  width: number
  height: number
  videoCodec: string
  audioCodec: string
  bitrate: number
  fps: number
  size: number
}

export interface ConversionSettings {
  preset: string | null
  videoCodec: string
  audioCodec: string
  container: string
  resolution: string
  videoBitrate: string
  audioBitrate: string
  fps: string
  extraArgs: string
}

export interface FileItem {
  id: string
  path: string
  name: string
  metadata: FileMetadata | null
  probing: boolean
  selected: boolean
  settings: ConversionSettings
}

export interface JobProgress {
  fileId: string
  percent: number
  fps: number
  bitrate: string
  speed: string
  eta: string
  currentTime: number
}

export interface JobResult {
  fileId: string
  outputPath: string
}

export interface JobError {
  fileId: string
  error: string
}

export type JobStatus = 'pending' | 'converting' | 'done' | 'error'

export interface Job {
  fileId: string
  status: JobStatus
  progress: JobProgress | null
  outputPath: string | null
  error: string | null
}

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

export interface Preset {
  id: string
  name: string
  category: string
  settings: Partial<ConversionSettings>
}

export const MIXED = Symbol('mixed')
export type MixedValue = typeof MIXED

export type ResolvedSettings = {
  [K in keyof ConversionSettings]: ConversionSettings[K] | MixedValue
}

export function resolveSettings(files: FileItem[]): ResolvedSettings {
  if (files.length === 0) {
    return {
      preset: MIXED, videoCodec: MIXED, audioCodec: MIXED, container: MIXED,
      resolution: MIXED, videoBitrate: MIXED, audioBitrate: MIXED, fps: MIXED, extraArgs: MIXED
    }
  }

  const first = files[0].settings
  const result: ResolvedSettings = { ...first }

  for (const key of Object.keys(first) as (keyof ConversionSettings)[]) {
    const allSame = files.every((f) => f.settings[key] === first[key])
    if (!allSame) {
      (result as Record<string, unknown>)[key] = MIXED
    }
  }

  return result
}
