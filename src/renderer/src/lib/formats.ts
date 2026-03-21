export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function formatResolution(width: number, height: number): string {
  if (!width || !height) return '—'
  return `${width}×${height}`
}

export function formatBitrate(bps: number): string {
  if (!bps || bps <= 0) return '—'
  if (bps < 1000) return `${bps} bps`
  if (bps < 1_000_000) return `${(bps / 1000).toFixed(0)} kbps`
  return `${(bps / 1_000_000).toFixed(1)} Mbps`
}

export function codecDisplayName(codec: string): string {
  const map: Record<string, string> = {
    h264: 'H.264',
    h265: 'H.265',
    hevc: 'H.265/HEVC',
    prores: 'ProRes',
    vp9: 'VP9',
    av1: 'AV1',
    aac: 'AAC',
    mp3: 'MP3',
    opus: 'Opus',
    flac: 'FLAC',
    pcm_s16le: 'PCM 16-bit',
    pcm_s24le: 'PCM 24-bit',
    dnxhd: 'DNxHD/DNxHR'
  }
  return map[codec] || codec.toUpperCase()
}

const encoderShortNames: Record<string, string> = {
  libx264: 'H.264',
  libx265: 'H.265',
  prores_ks: 'ProRes',
  dnxhd: 'DNxHR',
  'libvpx-vp9': 'VP9',
  'libaom-av1': 'AV1',
  gif: 'GIF',
  aac: 'AAC',
  libmp3lame: 'MP3',
  libopus: 'Opus',
  pcm_s16le: 'PCM16',
  pcm_s24le: 'PCM24',
  flac: 'FLAC',
  copy: 'Copy'
}

export function shortCodecName(encoder: string): string {
  return encoderShortNames[encoder] || encoder
}

const resolutionLabels: Record<string, string> = {
  '3840:2160': '4K',
  '2560:1440': '1440p',
  '1920:1080': '1080p',
  '1280:720': '720p',
  '854:480': '480p',
  '640:-1': '640w',
  '480:-1': '480w'
}

export function shortResolution(res: string): string {
  return resolutionLabels[res] || res || 'Original'
}

import type { ConversionSettings } from '../types'

export function settingsSummary(s: ConversionSettings): string {
  const parts: string[] = []
  if (s.videoCodec) parts.push(shortCodecName(s.videoCodec))
  if (s.container) parts.push(s.container.toUpperCase())
  if (s.resolution) parts.push(shortResolution(s.resolution))
  return parts.join(' / ') || 'No settings'
}
