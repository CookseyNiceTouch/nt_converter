import { useState, useCallback, useEffect, useRef } from 'react'
import type { FileItem, ConversionSettings, Job, JobProgress, JobResult, JobError } from '../types'
import { ipc } from '../lib/ipc'

export const defaultSettings: ConversionSettings = {
  preset: 'h264-web',
  videoCodec: 'libx264',
  audioCodec: 'aac',
  container: 'mp4',
  resolution: '1920:1080',
  videoBitrate: '8000k',
  audioBitrate: '192k',
  fps: '',
  extraArgs: '-preset medium -crf 18'
}

export function useConversion() {
  const [templateSettings, setTemplateSettings] = useState<ConversionSettings>(defaultSettings)
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map())
  const [converting, setConverting] = useState(false)
  const templateRef = useRef(templateSettings)
  templateRef.current = templateSettings

  useEffect(() => {
    const unsubs = [
      ipc.onJobProgress((data: JobProgress) => {
        setJobs((prev) => {
          const next = new Map(prev)
          next.set(data.fileId, {
            fileId: data.fileId,
            status: 'converting',
            progress: data,
            outputPath: null,
            error: null
          })
          return next
        })
      }),
      ipc.onJobComplete((data: JobResult) => {
        setJobs((prev) => {
          const next = new Map(prev)
          next.set(data.fileId, {
            fileId: data.fileId,
            status: 'done',
            progress: prev.get(data.fileId)?.progress || null,
            outputPath: data.outputPath,
            error: null
          })
          return next
        })
      }),
      ipc.onJobError((data: JobError) => {
        setJobs((prev) => {
          const next = new Map(prev)
          next.set(data.fileId, {
            fileId: data.fileId,
            status: 'error',
            progress: null,
            outputPath: null,
            error: data.error
          })
          return next
        })
      })
    ]

    return () => unsubs.forEach((u) => u())
  }, [])

  const startConversion = useCallback(async (files: FileItem[]) => {
    const jobConfigs = files.map((f) => ({
      fileId: f.id,
      inputPath: f.path,
      settings: {
        videoCodec: f.settings.videoCodec,
        audioCodec: f.settings.audioCodec,
        container: f.settings.container,
        resolution: f.settings.resolution,
        videoBitrate: f.settings.videoBitrate,
        audioBitrate: f.settings.audioBitrate,
        fps: f.settings.fps,
        extraArgs: f.settings.extraArgs
      },
      duration: f.metadata?.duration || 0
    }))

    const initialJobs = new Map<string, Job>()
    for (const config of jobConfigs) {
      initialJobs.set(config.fileId, {
        fileId: config.fileId,
        status: 'pending',
        progress: null,
        outputPath: null,
        error: null
      })
    }
    setJobs(initialJobs)
    setConverting(true)

    try {
      await ipc.startQueue(jobConfigs)
    } finally {
      setConverting(false)
    }
  }, [])

  const cancelConversion = useCallback(async () => {
    await ipc.cancelQueue()
    setConverting(false)
  }, [])

  const clearJobs = useCallback(() => {
    setJobs(new Map())
  }, [])

  return {
    templateSettings,
    setTemplateSettings,
    jobs,
    converting,
    startConversion,
    cancelConversion,
    clearJobs
  }
}
