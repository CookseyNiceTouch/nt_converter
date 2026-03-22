import { useState, useEffect, useMemo } from 'react'
import type { FileItem, ConversionSettings, Preset, CodecInfo, FormatInfo, ResolvedSettings } from '../types'
import { MIXED, resolveSettings } from '../types'
import { ipc } from '../lib/ipc'

interface Props {
  selectedFiles: FileItem[]
  templateSettings: ConversionSettings
  hasFiles: boolean
  onFieldChange: (field: keyof ConversionSettings, value: string) => void
  onPresetApply: (preset: Preset) => void
  onTemplateChange: (settings: ConversionSettings) => void
}

export default function ConversionPanel({
  selectedFiles,
  templateSettings,
  hasFiles,
  onFieldChange,
  onPresetApply,
  onTemplateChange
}: Props): JSX.Element {
  const [presets, setPresets] = useState<Preset[]>([])
  const [codecs, setCodecs] = useState<CodecInfo[]>([])
  const [formats, setFormats] = useState<FormatInfo[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    ipc.getPresets().then(setPresets).catch(() => {})
    ipc.getCodecs().then(setCodecs).catch(() => {})
    ipc.getFormats().then(setFormats).catch(() => {})
  }, [])

  const isEditingFiles = selectedFiles.length > 0
  const disabled = !hasFiles || !isEditingFiles

  const resolved: ResolvedSettings = useMemo(() => {
    if (isEditingFiles) return resolveSettings(selectedFiles)
    return templateSettings as ResolvedSettings
  }, [selectedFiles, templateSettings, isEditingFiles])

  const videoEncoders = codecs.filter((c) => c.type === 'video' && c.canEncode)
  const audioEncoders = codecs.filter((c) => c.type === 'audio' && c.canEncode)
  const muxFormats = formats.filter((f) => f.canMux)

  const presetsByCategory: Record<string, Preset[]> = {}
  for (const p of presets) {
    if (!presetsByCategory[p.category]) presetsByCategory[p.category] = []
    presetsByCategory[p.category].push(p)
  }

  function handlePresetChange(presetId: string): void {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return

    if (isEditingFiles) {
      onPresetApply(preset)
    } else {
      const newSettings: ConversionSettings = {
        ...templateSettings,
        ...preset.settings,
        preset: preset.id
      } as ConversionSettings
      onTemplateChange(newSettings)
    }
  }

  function handleFieldChange(key: keyof ConversionSettings, value: string): void {
    if (isEditingFiles) {
      onFieldChange(key, value)
    } else {
      onTemplateChange({ ...templateSettings, [key]: value, preset: null })
    }
  }

  function val(key: keyof ConversionSettings): string {
    const v = resolved[key]
    if (v === MIXED) return ''
    return (v ?? '') as string
  }

  function isMixed(key: keyof ConversionSettings): boolean {
    return resolved[key] === MIXED
  }

  const selectClass = (key: keyof ConversionSettings): string =>
    `w-full bg-bg-primary border px-2.5 py-1.5 text-[13px] text-text-primary focus:outline-none transition-all duration-150 appearance-none ${
      isMixed(key)
        ? 'border-warning/30 text-text-muted italic'
        : 'border-border hover:border-text-muted/40 focus:border-border-focus focus:ring-1 focus:ring-border-focus/20'
    }`

  const inputClass = (key: keyof ConversionSettings): string =>
    `w-full bg-bg-primary border px-2.5 py-1.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none transition-all duration-150 ${
      isMixed(key)
        ? 'border-warning/30'
        : 'border-border hover:border-text-muted/40 focus:border-border-focus focus:ring-1 focus:ring-border-focus/20'
    }`

  const labelClass = 'block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider'

  const contextLabel = isEditingFiles
    ? `Editing ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
    : hasFiles
      ? 'Select files to edit'
      : 'Default output settings'

  return (
    <div className="border-l border-border bg-bg-secondary w-[280px] flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">Output Settings</h2>
        <p className={`text-xs mt-0.5 ${isEditingFiles ? 'text-pink' : 'text-text-muted'}`}>
          {contextLabel}
        </p>
      </div>

      {/* Controls */}
      <div className={`px-4 py-3 space-y-3.5 flex-1 overflow-y-auto transition-opacity duration-200 ${
        disabled && hasFiles ? 'opacity-35 pointer-events-none' : ''
      } ${!hasFiles ? 'opacity-50' : ''}`}>

        {/* Preset */}
        <div>
          <label className={labelClass}>Preset</label>
          <select
            value={isMixed('preset') ? '' : (val('preset') || '')}
            onChange={(e) => handlePresetChange(e.target.value)}
            className={selectClass('preset')}
          >
            {isMixed('preset') && <option value="">Mixed</option>}
            <option value="">Custom</option>
            {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
              <optgroup key={category} label={category}>
                {categoryPresets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Container */}
        <div>
          <label className={labelClass}>Container</label>
          <select
            value={val('container')}
            onChange={(e) => handleFieldChange('container', e.target.value)}
            className={selectClass('container')}
          >
            {isMixed('container') && <option value="">Mixed</option>}
            <option value="">Auto</option>
            {muxFormats.length > 0 ? (
              muxFormats.map((f) => (
                <option key={f.name} value={f.name}>{f.name} — {f.description}</option>
              ))
            ) : (
              <>
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="mkv">MKV</option>
                <option value="mxf">MXF</option>
                <option value="avi">AVI</option>
                <option value="webm">WebM</option>
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
                <option value="gif">GIF</option>
              </>
            )}
          </select>
        </div>

        {/* Video Codec */}
        <div>
          <label className={labelClass}>Video Codec</label>
          <select
            value={val('videoCodec')}
            onChange={(e) => handleFieldChange('videoCodec', e.target.value)}
            className={selectClass('videoCodec')}
          >
            {isMixed('videoCodec') && <option value="">Mixed</option>}
            <option value="">None / Copy</option>
            {videoEncoders.length > 0 ? (
              videoEncoders.map((c) => (
                <option key={c.name} value={c.name}>{c.name} — {c.description}</option>
              ))
            ) : (
              <>
                <option value="libx264">libx264 (H.264)</option>
                <option value="libx265">libx265 (H.265)</option>
                <option value="prores_ks">ProRes</option>
                <option value="dnxhd">DNxHD/DNxHR</option>
                <option value="libvpx-vp9">VP9</option>
                <option value="libaom-av1">AV1</option>
                <option value="gif">GIF</option>
              </>
            )}
          </select>
        </div>

        {/* Audio Codec */}
        <div>
          <label className={labelClass}>Audio Codec</label>
          <select
            value={val('audioCodec')}
            onChange={(e) => handleFieldChange('audioCodec', e.target.value)}
            className={selectClass('audioCodec')}
          >
            {isMixed('audioCodec') && <option value="">Mixed</option>}
            <option value="">None</option>
            <option value="copy">Copy (passthrough)</option>
            {audioEncoders.length > 0 ? (
              audioEncoders.map((c) => (
                <option key={c.name} value={c.name}>{c.name} — {c.description}</option>
              ))
            ) : (
              <>
                <option value="aac">AAC</option>
                <option value="libmp3lame">MP3</option>
                <option value="libopus">Opus</option>
                <option value="pcm_s16le">PCM 16-bit</option>
                <option value="pcm_s24le">PCM 24-bit</option>
                <option value="flac">FLAC</option>
              </>
            )}
          </select>
        </div>

        {/* Resolution */}
        <div>
          <label className={labelClass}>Resolution</label>
          <select
            value={val('resolution')}
            onChange={(e) => handleFieldChange('resolution', e.target.value)}
            className={selectClass('resolution')}
          >
            {isMixed('resolution') && <option value="">Mixed</option>}
            <option value="">Original</option>
            <option value="3840:2160">3840x2160 (4K UHD)</option>
            <option value="2560:1440">2560x1440 (1440p)</option>
            <option value="1920:1080">1920x1080 (1080p)</option>
            <option value="1280:720">1280x720 (720p)</option>
            <option value="854:480">854x480 (480p)</option>
            <option value="640:-1">640w (auto height)</option>
            <option value="480:-1">480w (auto height)</option>
          </select>
        </div>

        {/* Divider + Advanced toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-0 py-0.5 text-xs text-text-muted hover:text-text-secondary transition-colors w-full group"
          >
            <div className="h-px flex-1 bg-border" />
            <span className="flex items-center gap-1.5 shrink-0">
              <svg
                width="8" height="8" viewBox="0 0 10 10" fill="currentColor"
                className={`transition-transform duration-150 ${showAdvanced ? 'rotate-90' : ''}`}
              >
                <polygon points="2,0 8,5 2,10" />
              </svg>
              Advanced
            </span>
            <div className="h-px flex-1 bg-border" />
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Video Bitrate</label>
              <input
                type="text"
                value={val('videoBitrate')}
                onChange={(e) => handleFieldChange('videoBitrate', e.target.value)}
                placeholder={isMixed('videoBitrate') ? 'Mixed' : 'e.g. 8000k, 10M'}
                className={inputClass('videoBitrate')}
              />
            </div>
            <div>
              <label className={labelClass}>Audio Bitrate</label>
              <input
                type="text"
                value={val('audioBitrate')}
                onChange={(e) => handleFieldChange('audioBitrate', e.target.value)}
                placeholder={isMixed('audioBitrate') ? 'Mixed' : 'e.g. 192k, 320k'}
                className={inputClass('audioBitrate')}
              />
            </div>
            <div>
              <label className={labelClass}>Frame Rate</label>
              <input
                type="text"
                value={val('fps')}
                onChange={(e) => handleFieldChange('fps', e.target.value)}
                placeholder={isMixed('fps') ? 'Mixed' : 'e.g. 24, 30, 60'}
                className={inputClass('fps')}
              />
            </div>
            <div>
              <label className={labelClass}>Extra ffmpeg Args</label>
              <input
                type="text"
                value={val('extraArgs')}
                onChange={(e) => handleFieldChange('extraArgs', e.target.value)}
                placeholder={isMixed('extraArgs') ? 'Mixed' : 'e.g. -preset slow -crf 18'}
                className={inputClass('extraArgs')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
