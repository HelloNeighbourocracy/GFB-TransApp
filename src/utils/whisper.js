import { pipeline, env } from '@xenova/transformers'

// Keep everything local — no calls to the HuggingFace hub at runtime once cached.
env.allowLocalModels = false
env.useBrowserCache = true

let transcriber = null
let loadingPromise = null

/**
 * Loads the multilingual Whisper-tiny model (~75MB, quantized) once and reuses it.
 * onProgress(percent) is optional and useful for a loading bar in the UI.
 */
export async function initWhisper(onProgress) {
  if (transcriber) return transcriber
  if (loadingPromise) return loadingPromise

  loadingPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
    quantized: true,
    progress_callback: (data) => {
      if (onProgress && data?.progress != null) onProgress(Math.round(data.progress))
    }
  }).then((p) => {
    transcriber = p
    return p
  })

  return loadingPromise
}

/**
 * Transcribes a Float32Array (16kHz mono PCM) or audio Blob using the given source language.
 * Returns plain text, or '' if nothing was recognized.
 */
export async function transcribeAudio(audioInput, sourceLang) {
  if (!transcriber) await initWhisper()
  try {
    const result = await transcriber(audioInput, {
      language: sourceLang,
      task: 'transcribe',
      chunk_length_s: 10,
      stride_length_s: 2
    })
    return (result?.text || '').trim()
  } catch (err) {
    console.error('Whisper transcription failed:', err)
    return ''
  }
}

export function isWhisperReady() {
  return !!transcriber
}
