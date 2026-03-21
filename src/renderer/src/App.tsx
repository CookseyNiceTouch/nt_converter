import { useCallback } from 'react'
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

  const { updateVersion, updateDownloaded, installUpdate } = useAutoUpdate()

  const handleFilesAdded = useCallback(
    (paths: string[]) => addFiles(paths, templateSettings),
    [addFiles, templateSettings]
  )

  const handleConvert = useCallback(() => {
    if (files.length === 0) return
    startConversion(files)
  }, [files, startConversion])

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

      {updateVersion && (
        <UpdateBanner
          version={updateVersion}
          downloaded={updateDownloaded}
          onInstall={installUpdate}
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

        <ConversionPanel
          selectedFiles={selectedFiles}
          templateSettings={templateSettings}
          hasFiles={files.length > 0}
          onFieldChange={handleFieldChange}
          onPresetApply={handlePresetApply}
          onTemplateChange={setTemplateSettings}
        />
      </div>

      <BottomBar
        fileCount={files.length}
        jobs={jobs}
        converting={converting}
        onConvert={handleConvert}
        onCancel={cancelConversion}
        onClearDone={clearJobs}
      />
    </div>
  )
}
