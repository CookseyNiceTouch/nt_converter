import type { Job } from '../types'

interface Props {
  fileCount: number
  jobs: Map<string, Job>
  converting: boolean
  onConvert: () => void
  onCancel: () => void
  onClearDone: () => void
}

export default function BottomBar({
  fileCount,
  jobs,
  converting,
  onConvert,
  onCancel,
  onClearDone
}: Props): JSX.Element {
  const jobArray = Array.from(jobs.values())
  const doneCount = jobArray.filter((j) => j.status === 'done').length
  const errorCount = jobArray.filter((j) => j.status === 'error').length
  const totalJobs = jobArray.length
  const currentJob = jobArray.find((j) => j.status === 'converting')
  const hasDone = doneCount > 0 || errorCount > 0

  const overallPercent = totalJobs > 0
    ? ((doneCount + errorCount) / totalJobs) * 100 +
      (currentJob?.progress?.percent || 0) / totalJobs
    : 0

  return (
    <div className="border-t border-border bg-bg-secondary shrink-0 relative">
      {/* Overall progress bar */}
      {converting && totalJobs > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-bg-tertiary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500 ease-out"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      )}

      <div className="flex items-stretch">
        <div className="flex items-center gap-2.5 text-xs text-text-muted flex-1 px-4 py-2">
          <span className="tabular-nums">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>

          {converting && currentJob?.progress && (
            <>
              <div className="w-px h-3.5 bg-border" />
              <span className="text-accent font-medium">
                Converting {doneCount + 1}/{totalJobs}
                <span className="text-text-muted font-normal ml-2">
                  {currentJob.progress.percent.toFixed(0)}%
                  {currentJob.progress.speed && ` @ ${currentJob.progress.speed}`}
                </span>
              </span>
            </>
          )}

          {hasDone && !converting && (
            <>
              <div className="w-px h-3.5 bg-border" />
              <span className="flex items-center gap-2">
                <span className="text-success font-medium">{doneCount} done</span>
                {errorCount > 0 && <span className="text-error font-medium">{errorCount} failed</span>}
              </span>
            </>
          )}

          <div className="w-px h-3.5 bg-border ml-auto" />
          <a
            href="https://nicetouch.app"
            target="_blank"
            rel="noreferrer"
            className="text-yellow-400/70 hover:text-yellow-300 transition-colors"
          >
            Made by <span className="font-medium">NiceTouch</span>
          </a>
        </div>

        <div className="flex items-stretch">
          {hasDone && !converting && (
            <button
              onClick={onClearDone}
              className="px-4 text-xs bg-bg-tertiary hover:bg-bg-hover text-text-muted hover:text-text-secondary border-l border-border transition-colors"
            >
              Clear
            </button>
          )}
          {converting ? (
            <button
              onClick={onCancel}
              className="px-5 text-xs font-semibold bg-pink/10 hover:bg-pink/20 text-pink border-l border-pink/20 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={onConvert}
              disabled={fileCount === 0}
              className="px-6 text-xs font-bold bg-accent hover:bg-accent-hover text-black transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
            >
              Convert
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
