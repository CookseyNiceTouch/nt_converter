import { useState, useCallback, useRef } from 'react'
import type { FileItem, ConversionSettings } from '../types'
import { ipc } from '../lib/ipc'

let idCounter = 0

export function useFileImport() {
  const [files, setFiles] = useState<FileItem[]>([])
  const lastClickedRef = useRef<string | null>(null)

  const addFiles = useCallback((paths: string[], defaultSettings: ConversionSettings) => {
    const newFiles: FileItem[] = paths.map((p) => {
      const name = p.split(/[\\/]/).pop() || p
      const id = `file-${++idCounter}`
      return {
        id,
        path: p,
        name,
        metadata: null,
        probing: true,
        selected: true,
        settings: { ...defaultSettings }
      }
    })

    setFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path))
      const deduped = newFiles.filter((f) => !existingPaths.has(f.path))
      return [...prev, ...deduped]
    })

    for (const file of newFiles) {
      ipc
        .probeFile(file.path)
        .then((metadata) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, metadata, probing: false } : f))
          )
        })
        .catch(() => {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, probing: false } : f))
          )
        })
    }
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const removeFiles = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setFiles((prev) => prev.filter((f) => !idSet.has(f.id)))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  const selectFile = useCallback((id: string, e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => {
    setFiles((prev) => {
      if (e.shiftKey && lastClickedRef.current) {
        const lastIdx = prev.findIndex((f) => f.id === lastClickedRef.current)
        const curIdx = prev.findIndex((f) => f.id === id)
        if (lastIdx >= 0 && curIdx >= 0) {
          const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx]
          return prev.map((f, i) => ({
            ...f,
            selected: i >= start && i <= end ? true : f.selected
          }))
        }
      }

      lastClickedRef.current = id
      return prev.map((f) =>
        f.id === id ? { ...f, selected: !f.selected } : f
      )
    })
  }, [])

  const selectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: true })))
  }, [])

  const deselectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })))
  }, [])

  const updateSelectedSettings = useCallback((partial: Partial<ConversionSettings>) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.selected
          ? { ...f, settings: { ...f.settings, ...partial, preset: partial.preset !== undefined ? partial.preset : null } }
          : f
      )
    )
  }, [])

  const applyPresetToSelected = useCallback((preset: { id: string; settings: Partial<ConversionSettings> }) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (!f.selected) return f
        return {
          ...f,
          settings: {
            ...f.settings,
            ...preset.settings,
            preset: preset.id
          } as ConversionSettings
        }
      })
    )
  }, [])

  const selectedFiles = files.filter((f) => f.selected)

  return {
    files,
    selectedFiles,
    addFiles,
    removeFile,
    removeFiles,
    clearFiles,
    selectFile,
    selectAll,
    deselectAll,
    updateSelectedSettings,
    applyPresetToSelected
  }
}
