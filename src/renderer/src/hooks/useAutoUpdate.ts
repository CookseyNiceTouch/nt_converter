import { useState, useEffect, useCallback } from 'react'
import { ipc } from '../lib/ipc'

export function useAutoUpdate() {
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [updateError, setUpdateError] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const unsubs = [
      ipc.onUpdateAvailable((data) => {
        setUpdateVersion(data.version)
        setUpdateError(false)
        setDownloadPercent(0)
        setUpdateDownloaded(false)
        setDismissed(false)
      }),
      ipc.onDownloadProgress((data) => {
        setDownloadPercent(Math.round(data.percent))
      }),
      ipc.onUpdateDownloaded(() => {
        setUpdateDownloaded(true)
        setUpdateError(false)
        setDismissed(false)
      }),
      ipc.onUpdateError(() => {
        setUpdateError(true)
        setDismissed(false)
      })
    ]

    return () => unsubs.forEach((u) => u())
  }, [])

  const installUpdate = (): void => {
    ipc.installUpdate()
  }

  const retryUpdate = useCallback(() => {
    setUpdateError(false)
    setDownloadPercent(0)
    ipc.retryUpdate()
  }, [])

  const dismissUpdate = useCallback(() => {
    setDismissed(true)
  }, [])

  return {
    updateVersion,
    downloadPercent,
    updateDownloaded,
    updateError,
    dismissed,
    installUpdate,
    retryUpdate,
    dismissUpdate
  }
}
