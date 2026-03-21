import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'

export function useAutoUpdate() {
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  useEffect(() => {
    const unsubs = [
      ipc.onUpdateAvailable((data) => {
        setUpdateVersion(data.version)
      }),
      ipc.onUpdateDownloaded(() => {
        setUpdateDownloaded(true)
      })
    ]

    return () => unsubs.forEach((u) => u())
  }, [])

  const installUpdate = (): void => {
    ipc.installUpdate()
  }

  return { updateVersion, updateDownloaded, installUpdate }
}
