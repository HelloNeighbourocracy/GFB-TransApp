// Captures microphone / tab audio as raw PCM and hands Whisper clean,
// self-contained Float32Array chunks resampled to 16kHz mono.
//
// Why not MediaRecorder? MediaRecorder('audio/webm') timeslice chunks after
// the first one are NOT standalone decodable files (only the first chunk
// carries the container header), so feeding them straight to Whisper causes
// silent failures or garbage transcriptions. Capturing raw PCM avoids that
// entirely and gives lower latency too.

const TARGET_SAMPLE_RATE = 16000
const SILENCE_RMS_THRESHOLD = 0.006 // skip near-silent chunks so Whisper doesn't hallucinate text

export class AudioCapture {
  constructor({ chunkSeconds = 3.5, onChunk, onLevel } = {}) {
    this.chunkSeconds = chunkSeconds
    this.onChunk = onChunk
    this.onLevel = onLevel
    this.audioCtx = null
    this.source = null
    this.processor = null
    this.stream = null
    this.buffer = []
    this.bufferedSamples = 0
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1
      }
    })

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.source = this.audioCtx.createMediaStreamSource(this.stream)

    // ScriptProcessorNode is deprecated but remains the most broadly
    // compatible, dependency-free way to read raw samples in-browser.
    const bufferSize = 4096
    this.processor = this.audioCtx.createScriptProcessor(bufferSize, 1, 1)

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0)
      const copy = new Float32Array(input.length)
      copy.set(input)
      this.buffer.push(copy)
      this.bufferedSamples += copy.length

      if (this.onLevel) {
        let sum = 0
        for (let i = 0; i < copy.length; i++) sum += copy[i] * copy[i]
        this.onLevel(Math.sqrt(sum / copy.length))
      }

      const neededSamples = this.chunkSeconds * this.audioCtx.sampleRate
      if (this.bufferedSamples >= neededSamples) {
        this._flush()
      }
    }

    this.source.connect(this.processor)
    // Some browsers require the processor to be connected to a destination
    // to keep firing onaudioprocess, even though we don't want playback.
    this.processor.connect(this.audioCtx.destination)
  }

  _flush() {
    if (this.bufferedSamples === 0) return
    const merged = new Float32Array(this.bufferedSamples)
    let offset = 0
    for (const chunk of this.buffer) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    this.buffer = []
    this.bufferedSamples = 0

    const resampled = resampleTo16k(merged, this.audioCtx.sampleRate)

    let sum = 0
    for (let i = 0; i < resampled.length; i++) sum += resampled[i] * resampled[i]
    const rms = Math.sqrt(sum / resampled.length)
    if (rms < SILENCE_RMS_THRESHOLD) return // skip silence

    this.onChunk?.(resampled)
  }

  stop() {
    this._flush()
    this.processor?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.audioCtx?.close()
    this.processor = null
    this.source = null
    this.stream = null
    this.audioCtx = null
  }
}

function resampleTo16k(samples, inputRate) {
  if (inputRate === TARGET_SAMPLE_RATE) return samples
  const ratio = inputRate / TARGET_SAMPLE_RATE
  const newLength = Math.round(samples.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio
    const i0 = Math.floor(srcIndex)
    const i1 = Math.min(i0 + 1, samples.length - 1)
    const frac = srcIndex - i0
    result[i] = samples[i0] * (1 - frac) + samples[i1] * frac
  }
  return result
}
