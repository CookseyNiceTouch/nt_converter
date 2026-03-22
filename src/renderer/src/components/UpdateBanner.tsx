interface Props {
  version: string
  percent: number
  downloaded: boolean
  error: string | null
  onInstall: () => void
  onRetry: () => void
  onDismiss: () => void
}

export default function UpdateBanner({
  version,
  percent,
  downloaded,
  error,
  onInstall,
  onRetry,
  onDismiss
}: Props): JSX.Element {
  let message: string
  if (error) {
    message = `Update v${version} failed: ${error}`
  } else if (downloaded) {
    message = `Update v${version} ready to install`
  } else {
    message = `Downloading update v${version}... ${percent}%`
  }

  const borderColor = error ? 'border-error/25' : 'border-accent/15'
  const bgColor = error ? 'bg-error/8' : 'bg-accent/8'
  const textColor = error ? 'text-error' : 'text-accent'

  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-2.5 ${bgColor} border-b ${borderColor} shrink-0`}>
      <p className={`text-sm ${textColor} font-medium`}>{message}</p>

      <div className="flex items-center gap-2">
        {error && (
          <button
            onClick={onRetry}
            className="text-sm px-4 py-1.5 bg-error hover:bg-error/80 text-white font-bold transition-colors"
          >
            Retry
          </button>
        )}
        {downloaded && (
          <button
            onClick={onInstall}
            className="text-sm px-4 py-1.5 bg-accent hover:bg-accent-hover text-black font-bold transition-colors"
          >
            Restart & Update
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-sm px-2 py-1.5 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Dismiss update notification"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
