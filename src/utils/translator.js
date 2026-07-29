import { pipeline, env } from '@xenova/transformers'
import { nllbCode } from './languages'

// Keep everything local — no calls to the HuggingFace hub at runtime once cached.
env.allowLocalModels = false
env.useBrowserCache = true

// Meta's NLLB-200 (distilled, 600M params) translates directly between any of
// its 200 supported languages — including all 13 this app offers — with a
// single model, quantized to ~300MB for in-browser WASM inference. This
// replaces the earlier plan of stitching together 24+ separate bilingual
// "Argos" model files, which was never a real option: Argos Translate is a
// Python-only desktop tool and has no browser/npm build.
const MODEL_ID = 'Xenova/nllb-200-distilled-600M'

let translator = null
let loadingPromise = null

export async function initTranslator(onProgress) {
  if (translator) return translator
  if (loadingPromise) return loadingPromise

  loadingPromise = pipeline('translation', MODEL_ID, {
    quantized: true,
    progress_callback: (data) => {
      if (onProgress && data?.progress != null) onProgress(Math.round(data.progress))
    }
  }).then((p) => {
    translator = p
    return p
  })

  return loadingPromise
}

/**
 * Translates text between two of this app's language codes (e.g. 'en', 'ta').
 * Returns the original text unchanged if translation fails or isn't ready yet.
 */
export async function translate(text, sourceLang, targetLang) {
  if (!text) return text
  if (sourceLang === targetLang) return text
  if (!translator) await initTranslator()

  try {
    const output = await translator(text, {
      src_lang: nllbCode(sourceLang),
      tgt_lang: nllbCode(targetLang)
    })
    return output?.[0]?.translation_text?.trim() || text
  } catch (err) {
    console.error(`Translation ${sourceLang}->${targetLang} failed:`, err)
    return text
  }
}

export function isTranslatorReady() {
  return !!translator
}
