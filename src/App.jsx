import { useEffect, useRef, useState } from 'react'
import { initWhisper, transcribeAudio } from './utils/whisper'
import { initTranslator, translate } from './utils/translator'
import { AudioCapture } from './utils/audioCapture'
import { downloadTranscript } from './utils/pdfExport'
import { LANGUAGES } from './utils/languages'
import LanguageDeck from './components/LanguageDeck'
import SubtitlePanel from './components/SubtitlePanel'
import ControlDeck from './components/ControlDeck'
import TranscriptLog from './components/TranscriptLog'

export default function App() {
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('ta')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [subtitle, setSubtitle] = useState('Pick your languages, then press Start meeting.')
  const [status, setStatus] = useState('')
  const [transcripts, setTranscripts] = useState([])

  const captureRef = useRef(null)

  useEffect(() => {
    return () => captureRef.current?.stop()
  }, [])

  const start = async () => {
    try {
      setIsLoading(true)
      setStatus('Loading offline speech model…')
      await initWhisper((pct) => {
        setLoadProgress(pct)
        setStatus(`Loading speech model… ${pct}%`)
      })

      setStatus('Loading translation models…')
      await initTranslator((pct) => setStatus(`Loading translation models… ${pct}%`))

      setIsLoading(false)
      setIsRunning(true)
      setStatus('Listening…')
      setSubtitle('Listening…')

      const capture = new AudioCapture({
        chunkSeconds: 3.5,
        onChunk: async (float32Audio) => {
          const transcribedText = await transcribeAudio(float32Audio, sourceLang)
          if (!transcribedText) return

          const translatedText = await translate(transcribedText, sourceLang, targetLang)
          setSubtitle(translatedText)
          setTranscripts((prev) => [
            ...prev,
            { time: new Date().toLocaleTimeString(), src: transcribedText, text: translatedText }
          ])
        }
      })

      captureRef.current = capture
      await capture.start()
    } catch (err) {
      console.error('Failed to start:', err)
      setIsLoading(false)
      setIsRunning(false)
      setStatus('')
      if (err?.name === 'NotAllowedError') {
        setSubtitle('Microphone access was denied. Allow mic access and try again.')
      } else {
        setSubtitle('Could not start. Check console for details and try again.')
      }
    }
  }

  const stop = () => {
    captureRef.current?.stop()
    captureRef.current = null
    setIsRunning(false)
    setStatus('')
    setSubtitle('Stopped. Press Start meeting to resume.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 md:py-16 font-body">
      {/* Hero */}
      <header className="text-center max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 chip text-cyan/90 border border-cyan/25 rounded-full px-3 py-1 mb-5">
          <span className="status-dot live" />
          100% OFFLINE · ZERO COST · ON-DEVICE
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-fog mb-3 tracking-tight">
          Live Translator <span className="text-violet">for Zoom</span>
        </h1>
        <p className="text-mist text-lg">
          Any language. Real time. Nobody in class gets left behind.
        </p>
      </header>

      {/* Console */}
      <main className="console-panel w-full max-w-3xl p-6 md:p-10">
        <LanguageDeck
          sourceLang={sourceLang}
          targetLang={targetLang}
          setSourceLang={setSourceLang}
          setTargetLang={setTargetLang}
          disabled={isRunning || isLoading}
        />

        <SubtitlePanel subtitle={subtitle} isLive={isRunning} status={status} />

        {isLoading && (
          <div className="w-full h-1.5 bg-panel2 rounded-full overflow-hidden mb-6 -mt-2">
            <div
              className="h-full bg-gradient-to-r from-violet to-cyan transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}

        <ControlDeck
          isRunning={isRunning}
          isLoading={isLoading}
          onStart={start}
          onStop={stop}
          subtitle={subtitle}
          onDownload={() => downloadTranscript(transcripts, sourceLang, targetLang)}
          hasTranscripts={transcripts.length > 0}
        />

        <TranscriptLog transcripts={transcripts} />
      </main>

      <footer className="max-w-2xl text-center mt-8">
        <p className="text-sm text-mist">
          First run downloads ~200MB of speech + translation models, cached for offline use afterward.
          Supports {LANGUAGES.length} languages: {LANGUAGES.map((l) => l.name).join(', ')}.
        </p>
      </footer>
    </div>
  )
}
