# 🌍 Live Translator for Zoom

**Any Language. Real-time. 100% Offline.**

Real-time speech-to-text + translation subtitles for Zoom, Google Meet and Teams meetings — runs entirely in the browser, no server, no login, no cost.

- 🎙️ **13 languages** — English, Tamil, Malayalam, Telugu, Kannada, Hindi, Bengali, Marathi, French, Spanish, Arabic, Portuguese, Swahili
- 📡 **100% offline & free** — speech recognition (Whisper) and translation (Meta's NLLB-200) both run on-device via WebAssembly; nothing is uploaded anywhere
- 🖼️ **Floating overlay** — pop the subtitle out as a Picture-in-Picture window that floats above Zoom/Meet
- 📄 **Transcript export** — download the full session (original + translated) as a PDF
- 📲 **Installable PWA** — "Add to Home Screen" / "Install app" on desktop or mobile

---

## Quick start (local dev)

```bash
npm install
npm run dev
```

Open the printed local URL, allow microphone access, pick your two languages, and press **Start meeting**.

> ⚠️ First run downloads ~300MB of models (Whisper-tiny + NLLB-200-distilled-600M, both quantized). The browser's Cache Storage keeps them afterward, so every run after that loads instantly and works fully offline — including with no network at all.

## Production build

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

The build output lands in `dist/`.

---

## Deploying to GitHub Pages

1. **Push this project to a GitHub repo.**

   ```bash
   git init
   git add .
   git commit -m "Live Translator for Zoom v2.0"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Set the Vite `base` path** in `vite.config.js` to match your repo name (only needed for project pages, i.e. `https://<user>.github.io/<repo>/`):

   ```js
   export default defineConfig({
     base: '/<your-repo>/',
     ...
   })
   ```

   If you're deploying to a **custom domain** or a **user/org page** (`https://<user>.github.io/`), leave `base: '/'`.

3. **A GitHub Actions workflow is already included** at `.github/workflows/deploy.yml` — it builds and deploys automatically on every push to `main`. You don't need to run anything manually.

4. In your repo **Settings → Pages**, set **Source** to **GitHub Actions**. After the next push, your app will be live at `https://<your-username>.github.io/<your-repo>/`.

   *(Prefer a manual, branch-based deploy instead? `npm install -D gh-pages`, add `"deploy": "vite build && gh-pages -d dist"` to `package.json` scripts, run `npm run deploy`, then set Pages source to the `gh-pages` branch.)*

### Alternative: Vercel / Netlify (recommended — zero config)

Both platforms auto-detect Vite. Just import the GitHub repo:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Leave `base: '/'` in `vite.config.js` for these.

This avoids the sub-path complexity of GitHub Pages project sites and gives you HTTPS (required for microphone access) automatically.

---

## Browser requirements

- **HTTPS is required** for microphone access (GitHub Pages, Vercel and Netlify all serve HTTPS by default; `localhost` is exempt during dev).
- **Picture-in-Picture overlay** currently works best in Chrome and Edge. Firefox/Safari support varies.
- Recommended: Chrome or Edge, desktop, for the smoothest first-load model download.

## Project structure

```
├── index.html
├── vite.config.js          # Vite + PWA plugin config
├── tailwind.config.js
├── src/
│   ├── App.jsx              # top-level state & wiring
│   ├── index.css            # design system (sculpted panels, glow, motion)
│   ├── components/
│   │   ├── LanguageDeck.jsx # source/target language selectors + swap
│   │   ├── SubtitlePanel.jsx
│   │   ├── ControlDeck.jsx  # start/stop, overlay, PDF export
│   │   ├── Overlay.jsx      # Picture-in-Picture floating subtitle
│   │   └── TranscriptLog.jsx
│   └── utils/
│       ├── languages.js
│       ├── whisper.js       # Whisper-tiny (speech → text)
│       ├── translator.js    # NLLB-200-distilled-600M (offline MT, 200 languages)
│       ├── audioCapture.js  # raw PCM mic capture, resampled to 16kHz
│       └── pdfExport.js
└── public/
    ├── icon-192.png / icon-512.png / apple-touch-icon.png
```

## How it works

1. **Mic capture** — `audioCapture.js` reads raw PCM audio straight from the microphone via the Web Audio API and resamples it to 16kHz mono in ~3.5s chunks (this is more reliable than feeding `MediaRecorder` chunks straight to Whisper, since only the first chunk of a recording contains a valid container header).
2. **Speech → text** — each chunk is transcribed on-device by `Xenova/whisper-tiny` (via `@xenova/transformers`, running on WebAssembly/WASM through `onnxruntime-web`).
3. **Translate** — the recognized text is translated on-device by `Xenova/nllb-200-distilled-600M`, Meta's open NLLB-200 model running through `@xenova/transformers`. It translates directly between any of the 13 languages in one model, no pivoting needed.
4. **Display** — the translated line renders as a large subtitle, optionally floated over your meeting window via Picture-in-Picture, and logged for PDF export.

### A note on the earlier "Argos Translate" plan

An earlier draft of this app planned to use Argos Translate for offline translation. Argos Translate is a real project, but it's a Python desktop tool with `.argosmodel` files — it has no npm package or browser build, so `import argosTranslate from 'argos-translate'` would have failed at `npm install`. This build uses NLLB-200 instead, which is designed to run fully in-browser via Transformers.js and covers all 13 languages with a single ~300MB model.

## License / cost

Built on open-source models (OpenAI Whisper, Meta NLLB-200) — free to use, modify and redeploy.
