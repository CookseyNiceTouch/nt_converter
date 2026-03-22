import { ipc } from '../lib/ipc'
import logoUrl from '../assets/logo.png'

export default function TitleBar(): JSX.Element {
  const isMac = navigator.userAgent.includes('Mac')

  return (
    <div
      className="flex items-center h-8 bg-bg-secondary border-b border-border-subtle select-none shrink-0 relative"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Absolutely centred logo + title so macOS traffic lights don't overlap */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
        <img src={logoUrl} alt="" className="w-4 h-4 rounded-sm" draggable={false} />
        <span className="text-xs font-semibold tracking-wide text-text-muted">
          NT Converter
        </span>
      </div>

      {/* Spacer so version sits on the right without disturbing the centred group */}
      <div className="flex-1" />
      <span className="text-[10px] text-text-muted/40 pr-2 tabular-nums relative z-10">
        v{__APP_VERSION__}
      </span>

      {!isMac && (
        <div
          className="flex items-center h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => ipc.windowMinimize()}
            className="h-full w-10 flex items-center justify-center p-0 hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            onClick={() => ipc.windowMaximize()}
            className="h-full w-10 flex items-center justify-center p-0 hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          </button>
          <button
            onClick={() => ipc.windowClose()}
            className="h-full w-10 flex items-center justify-center p-0 hover:bg-error text-text-muted hover:text-white transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
