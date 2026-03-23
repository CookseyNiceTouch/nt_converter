import React, { useState, useCallback, useRef, DragEvent, MouseEvent } from 'react'
import type { FileItem, Job } from '../types'
import { formatDuration, formatFileSize, formatResolution, codecDisplayName, settingsSummary } from '../lib/formats'
import { ipc } from '../lib/ipc'
import logoUrl from '../assets/logo.png'
import LineWaves from './LineWaves'

interface Props {
  files: FileItem[]
  jobs: Map<string, Job>
  converting: boolean
  onFilesAdded: (paths: string[]) => void
  onRemoveFile: (id: string) => void
  onSelectFile: (id: string, e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

function StatusBadge({ job }: { job: Job | undefined }): JSX.Element | null {
  if (!job) return null

  if (job.status === 'converting') {
    return (
      <span className="text-[11px] leading-none px-2.5 py-1 rounded-full bg-accent/12 text-accent font-medium whitespace-nowrap">
        {job.progress ? `${job.progress.percent.toFixed(1)}%` : 'Starting...'}
      </span>
    )
  }

  if (job.status === 'done') {
    return (
      <span className="text-[11px] leading-none px-2.5 py-1 rounded-full bg-success/12 text-success font-medium">
        Done
      </span>
    )
  }

  if (job.status === 'error') {
    return (
      <span className="text-[11px] leading-none px-2.5 py-1 rounded-full bg-error/12 text-error font-medium" title={job.error || ''}>
        Error
      </span>
    )
  }

  return (
    <span className="text-[11px] leading-none px-2.5 py-1 rounded-full bg-bg-elevated text-text-muted font-medium">
      Queued
    </span>
  )
}

export default function QueuePanel({
  files,
  jobs,
  converting,
  onFilesAdded,
  onRemoveFile,
  onSelectFile,
  onSelectAll,
  onDeselectAll
}: Props): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      const paths: string[] = []
      for (const file of Array.from(e.dataTransfer.files)) {
        const filePath = ipc.getPathForFile(file)
        if (filePath) paths.push(filePath)
      }
      if (paths.length > 0) {
        const resolved = await ipc.scanDroppedPaths(paths)
        if (resolved.length > 0) onFilesAdded(resolved)
      }
    },
    [onFilesAdded]
  )

  const handlePickFiles = useCallback(async () => {
    const paths = await ipc.openFileDialog()
    if (paths.length > 0) onFilesAdded(paths)
  }, [onFilesAdded])

  const handlePickFolder = useCallback(async () => {
    const paths = await ipc.openFolderDialog()
    if (paths.length > 0) onFilesAdded(paths)
  }, [onFilesAdded])

  const selectedCount = files.filter((f) => f.selected).length
  const allSelected = files.length > 0 && selectedCount === files.length

  const handleRowClick = (id: string, e: MouseEvent) => {
    onSelectFile(id, { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey })
  }

  return (
    <div
      className="flex flex-col flex-1 min-w-0 relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-accent/6 border-2 border-dashed border-accent/60 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-accent font-medium text-sm">Drop to add files</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-stretch border-b border-border bg-bg-secondary shrink-0 min-h-[36px]">
        <button
          onClick={handlePickFiles}
          className="text-xs px-4 bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors border-r border-border"
        >
          + Files
        </button>
        <button
          onClick={handlePickFolder}
          className="text-xs px-4 bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors border-r border-border"
        >
          + Folder
        </button>

        {files.length > 0 && (
          <>
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="text-xs px-3 py-1.5 hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {selectedCount > 0 && (
              <span className="text-xs text-text-muted ml-auto flex items-center px-3 tabular-nums">
                {selectedCount} selected
              </span>
            )}
          </>
        )}
      </div>

      {/* File list / empty state */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-0">
              <LineWaves
                speed={0.3}
                innerLineCount={32}
                outerLineCount={36}
                warpIntensity={1}
                rotation={-45}
                edgeFadeWidth={0}
                colorCycleSpeed={1}
                brightness={0.15}
                color1="#D4FF00"
                color2="#FF2D78"
                color3="#D4FF00"
                enableMouseInteraction
                mouseInfluence={2}
              />
            </div>
            <div className="relative z-10 h-full pointer-events-none">
              {/* Logo + text: truly centred */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
                <img src={logoUrl} alt="" className="w-14 h-14 rounded-lg mb-4 drop-shadow-[0_0_12px_rgba(212,255,0,0.3)]" draggable={false} />
                <p className="text-text-primary text-sm font-semibold mb-1">No files in queue</p>
                <p className="text-text-secondary text-xs leading-relaxed max-w-[240px]">
                  Drop files or folders here to get started
                </p>
              </div>
              {/* Buttons: anchored below centre */}
              <div
                className="absolute left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto"
                style={{ top: 'calc(50% + 72px)', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                <button
                  onClick={handlePickFiles}
                  className="text-xs px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  + Files
                </button>
                <button
                  onClick={handlePickFolder}
                  className="text-xs px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  + Folder
                </button>
              </div>
            </div>
          </div>
        ) : (
          files.map((file) => {
            const job = jobs.get(file.id)
            const isConverting = job?.status === 'converting'

            return (
              <div
                key={file.id}
                onClick={(e) => handleRowClick(file.id, e)}
                className={`group flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle cursor-pointer transition-all duration-100 relative ${
                  file.selected
                    ? 'bg-bg-selected'
                    : 'hover:bg-bg-hover/50'
                }`}
              >
                {/* Progress fill */}
                {isConverting && job?.progress && (
                  <div
                    className="absolute inset-0 bg-accent/[0.04] transition-all duration-300 pointer-events-none"
                    style={{ width: `${job.progress.percent}%` }}
                  />
                )}

                {/* Selection checkbox */}
                <div className={`relative w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-100 ${
                  file.selected
                    ? 'bg-accent border-accent shadow-sm shadow-accent/20'
                    : 'border-border group-hover:border-text-muted/60'
                }`}>
                  {file.selected && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </div>

                {/* File info */}
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-medium text-text-primary truncate">
                      {file.name}
                    </p>
                    <StatusBadge job={job} />
                  </div>

                  <div className="flex items-center gap-2">
                    {file.probing ? (
                      <span className="text-xs text-text-muted">Analyzing...</span>
                    ) : file.metadata ? (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        {file.metadata.duration > 0 && (
                          <span>{formatDuration(file.metadata.duration)}</span>
                        )}
                        {file.metadata.width > 0 && (
                          <span className="text-text-muted/70">{formatResolution(file.metadata.width, file.metadata.height)}</span>
                        )}
                        {file.metadata.videoCodec && (
                          <span className="text-text-muted/70">{codecDisplayName(file.metadata.videoCodec)}</span>
                        )}
                        <span className="text-text-muted/70">{formatFileSize(file.metadata.size)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-warning">No metadata</span>
                    )}

                    <span className="text-xs text-accent/50 ml-auto shrink-0 font-medium">
                      {settingsSummary(file.settings)}
                    </span>
                  </div>

                  {/* Live stats during conversion */}
                  {isConverting && job?.progress && (
                    <div className="flex items-center gap-3 text-[11px] text-text-muted mt-1">
                      {job.progress.fps > 0 && <span>{job.progress.fps} fps</span>}
                      {job.progress.bitrate && <span>{job.progress.bitrate}</span>}
                      {job.progress.speed && <span>{job.progress.speed}</span>}
                      {job.progress.eta && <span className="text-accent/60">ETA {job.progress.eta}</span>}
                    </div>
                  )}

                  {/* Error details */}
                  {job?.status === 'error' && job.error && (
                    <p className="text-[11px] text-error mt-1 truncate" title={job.error}>
                      {job.error}
                    </p>
                  )}
                </div>

                {/* Show in folder button (completed items) */}
                {job?.status === 'done' && job.outputPath && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      ipc.showItemInFolder(job.outputPath!)
                    }}
                    className="p-1.5 hover:bg-accent/10 text-accent/60 hover:text-accent transition-all relative shrink-0"
                    title="Show in folder"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                )}

                {/* Remove button */}
                {!converting && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFile(file.id)
                    }}
                    className="p-1.5 hover:bg-error/10 text-text-muted/40 hover:text-error transition-all relative shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
