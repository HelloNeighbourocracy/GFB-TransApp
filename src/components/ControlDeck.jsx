import Overlay from './Overlay'

export default function ControlDeck({ isRunning, isLoading, onStart, onStop, subtitle, onDownload, hasTranscripts }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-5 justify-center flex-wrap items-center">
        <div className="relative">
          {isRunning && <span className="pulse-ring" />}
          {!isRunning ? (
            <button
              onClick={onStart}
              disabled={isLoading}
              className="btn-sculpt btn-start relative px-10 py-4 text-xl text-white disabled:opacity-60 disabled:cursor-wait"
            >
              {isLoading ? 'Loading models…' : '▶  Start meeting'}
            </button>
          ) : (
            <button onClick={onStop} className="btn-sculpt btn-stop relative px-10 py-4 text-xl text-white">
              ⏹  Stop
            </button>
          )}
        </div>

        <Overlay text={subtitle} />
      </div>

      <button
        onClick={onDownload}
        disabled={!hasTranscripts}
        className="btn-sculpt btn-ghost w-full max-w-md px-4 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        📄 Download transcript (PDF)
      </button>
    </div>
  )
}
