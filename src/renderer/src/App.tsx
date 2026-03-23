import { useCallback, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import QueuePanel from './components/QueuePanel'
import ConversionPanel from './components/ConversionPanel'
import BottomBar from './components/BottomBar'
import UpdateBanner from './components/UpdateBanner'
import { useFileImport } from './hooks/useFileImport'
import { useConversion } from './hooks/useConversion'
import { useAutoUpdate } from './hooks/useAutoUpdate'
import type { ConversionSettings, Preset } from './types'

export default function App(): JSX.Element {
  const {
    files,
    selectedFiles,
    addFiles,
    removeFile,
    removeFiles,
    selectFile,
    selectAll,
    deselectAll,
    updateSelectedSettings,
    applyPresetToSelected
  } = useFileImport()

  const {
    templateSettings,
    setTemplateSettings,
    jobs,
    converting,
    startConversion,
    cancelConversion,
    clearJobs
  } = useConversion()

  const {
    updateVersion,
    downloadPercent,
    updateDownloaded,
    updateError,
    dismissed,
    installUpdate,
    retryUpdate,
    dismissUpdate
  } = useAutoUpdate()

  const handleFilesAdded = useCallback(
    (paths: string[]) => addFiles(paths, templateSettings),
    [addFiles, templateSettings]
  )

  const handleConvert = useCallback(() => {
    if (files.length === 0) return
    startConversion(files)
  }, [files, startConversion])

  const handleConvertSelected = useCallback(() => {
    if (selectedFiles.length === 0) return
    startConversion(selectedFiles)
  }, [selectedFiles, startConversion])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        selectAll()
      } else if (e.key === 'Escape') {
        deselectAll()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !converting) {
        const ids = selectedFiles.map((f) => f.id)
        if (ids.length > 0) removeFiles(ids)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectAll, deselectAll, selectedFiles, removeFiles, converting])

  const handleClearDone = useCallback(() => {
    const doneIds = Array.from(jobs.entries())
      .filter(([, j]) => j.status === 'done')
      .map(([id]) => id)
    removeFiles(doneIds)
    clearJobs()
  }, [jobs, removeFiles, clearJobs])

  const handleFieldChange = useCallback(
    (field: keyof ConversionSettings, value: string) => {
      updateSelectedSettings({ [field]: value })
    },
    [updateSelectedSettings]
  )

  const handlePresetApply = useCallback(
    (preset: Preset) => {
      applyPresetToSelected(preset)
    },
    [applyPresetToSelected]
  )

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <TitleBar />

      {updateVersion && !dismissed && (
        <UpdateBanner
          version={updateVersion}
          percent={downloadPercent}
          downloaded={updateDownloaded}
          error={updateError}
          onInstall={installUpdate}
          onRetry={retryUpdate}
          onDismiss={dismissUpdate}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <QueuePanel
          files={files}
          jobs={jobs}
          converting={converting}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={removeFile}
          onSelectFile={selectFile}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        />

        {files.length > 0 && (
          selectedFiles.length > 0 ? (
            <ConversionPanel
              selectedFiles={selectedFiles}
              templateSettings={templateSettings}
              hasFiles={files.length > 0}
              onFieldChange={handleFieldChange}
              onPresetApply={handlePresetApply}
              onTemplateChange={setTemplateSettings}
            />
          ) : (
            <div className="border-l border-border bg-bg-secondary w-[280px] flex flex-col items-center justify-center shrink-0">
              <p className="text-text-muted text-xs">Select files to edit settings</p>
            </div>
          )
        )}
      </div>

      <BottomBar
        fileCount={files.length}
        selectedFileCount={selectedFiles.length}
        probing={files.some((f) => f.probing)}
        jobs={jobs}
        converting={converting}
        onConvert={handleConvert}
        onConvertSelected={handleConvertSelected}
        onCancel={cancelConversion}
        onClearDone={handleClearDone}
      />
    </div>
  )
}
