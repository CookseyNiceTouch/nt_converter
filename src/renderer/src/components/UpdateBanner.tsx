interface Props {
  version: string
  downloaded: boolean
  onInstall: () => void
}

export default function UpdateBanner({ version, downloaded, onInstall }: Props): JSX.Element {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 bg-accent/8 border-b border-accent/15 shrink-0">
      <p className="text-sm text-accent font-medium">
        {downloaded
          ? `Update v${version} ready to install`
          : `Downloading update v${version}...`}
      </p>
      {downloaded && (
        <button
          onClick={onInstall}
          className="text-sm px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-semibold transition-colors shadow-sm shadow-accent/20"
        >
          Restart & Update
        </button>
      )}
    </div>
  )
}
