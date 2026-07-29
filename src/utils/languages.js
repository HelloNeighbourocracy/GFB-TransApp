// 13 languages supported by both Whisper (speech-to-text) and NLLB-200 (offline MT).
// `nllb` is the FLORES-200 code the translation model expects for src_lang/tgt_lang.
export const LANGUAGES = [
  { code: 'en', name: 'English', whisper: 'english', nllb: 'eng_Latn', flag: '🇬🇧' },
  { code: 'fr', name: 'French', whisper: 'french', nllb: 'fra_Latn', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', whisper: 'spanish', nllb: 'spa_Latn', flag: '🇪🇸' },
  { code: 'sw', name: 'Swahili', whisper: 'swahili', nllb: 'swh_Latn', flag: '🇰🇪' },
  { code: 'ar', name: 'Arabic', whisper: 'arabic', nllb: 'arb_Arab', flag: '🇸🇦' },
  { code: 'ta', name: 'Tamil', whisper: 'tamil', nllb: 'tam_Taml', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', whisper: 'malayalam', nllb: 'mal_Mlym', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', whisper: 'telugu', nllb: 'tel_Telu', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', whisper: 'kannada', nllb: 'kan_Knda', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', whisper: 'bengali', nllb: 'ben_Beng', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', whisper: 'hindi', nllb: 'hin_Deva', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', whisper: 'marathi', nllb: 'mar_Deva', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', whisper: 'portuguese', nllb: 'por_Latn', flag: '🇵🇹' }
]

export function nllbCode(code) {
  return LANGUAGES.find((l) => l.code === code)?.nllb || 'eng_Latn'
}

export function langName(code) {
  return LANGUAGES.find((l) => l.code === code)?.name || code
}
