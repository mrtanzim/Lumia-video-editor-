# Lumina → CapCut-Class Editor — Master Execution Spec

**Goal:** Rebuild Lumina into a feature-for-feature CapCut replica (desktop web version), while keeping Lumina's existing visual identity (purple/indigo brand, current top nav, left icon rail, "Uploaded Media Hub" panel, timeline layout, right-side inspector).
**Method:** Ship in priority phases (P0 → P3). Nothing in a later phase gets started until everything in the phase before it works end-to-end. Each feature below has a `[BUILD]` note — that's the literal instruction to hand an AI coder (vibe-coding prompt seed).

---

## 0. Keep From Current Prototype (do not rebuild)
- Top menu bar: File / Edit / View / Clip / Effects / Sequence / Markers / Text / Audio / Color / Window / Help
- Left icon rail (Media / Library / AI / Effects / Sequence icons)
- "Uploaded Media Hub" panel with Audio/Image/Video tabs + search
- Preview player chrome (play controls, time readout, volume, speed, fullscreen)
- Timeline track structure (Video / Text Overlay / Audio lanes, lock/mute/visibility icons per track)
- Toolbar above timeline: Select / Split / Snap / Marker / Delete / Undo / Redo / Cut / Copy / Zoom
- Right inspector panel ("No Clip Selected" state, properties panel pattern)
- Purple accent color, rounded-card clip styling, floating AI action button (bottom right)

Everything else below is new build work, organized by priority.

---

## PRIORITY TIER LEGEND
- **P0 — Core (MVP, must work before anything else matters)**
- **P1 — Major (what makes it feel like CapCut, not a toy)**
- **P2 — Differentiators (AI + polish that creators actually came for)**
- **P3 — Long tail (completeness / power-user / platform parity)**

---

## P0 — CORE EDITING ENGINE (build first, nothing else matters without this)

### P0.1 Project & Media Management
- Create/open/rename/delete/duplicate projects; auto-save + manual save; project thumbnail.
  `[BUILD]` IndexedDB (or backend DB) project store: `{id, name, thumbnail, timeline_json, updated_at}`. Autosave on every timeline mutation, debounced 2s.
- Media import: drag-and-drop + file picker for video/audio/image; show upload progress; generate thumbnails.
  `[BUILD]` Use `<input type=file multiple>`, read via `File` API, extract video thumbnail with a hidden `<video>` + `<canvas>` seek-and-capture, store blob URLs (or upload to storage) + duration via `loadedmetadata`.
- Media bin: grid/list view, search, filter by type (already have UI — wire it to real state).

### P0.2 Timeline Core
- Multi-track timeline: unlimited video/image tracks, unlimited audio tracks, one text-overlay track type (expandable to many).
- Drag clip from media bin onto timeline; drag to reorder/move between tracks; drag edges to trim.
- Split/cut at playhead; ripple delete vs. lift delete; snapping to playhead/clip edges/markers.
- Multi-select (shift/ctrl+click, marquee select), group move, copy/paste, duplicate.
- Zoom in/out on timeline (already has a % control — wire it), horizontal scroll, "fit to window."
- Undo/redo stack (already has icons — wire a command-pattern history, min 100 steps).
- Playhead scrubbing, frame-accurate stepping (←/→ = 1 frame, shift+←/→ = 1 sec).
  `[BUILD]` Model the timeline as `{tracks: [{id,type,clips:[{id,mediaId,trackStart,trackEnd,sourceIn,sourceOut,transform,effects[],volume,...}]}]}`. All UI ops are pure functions over this JSON → push to undo stack. This JSON is also your render spec later.

### P0.3 Preview / Playback Engine
- Real-time canvas-based compositor: render current frame from all visible tracks in z-order at playhead position.
- Play/pause/loop, scrub while playing, real-time-ish preview at reduced res if needed for perf.
  `[BUILD]` Use HTML5 `<video>` elements per active clip (hidden), seek them to the right source time, draw to a single `<canvas>` via `drawImage` each rAF tick, layered by track order. This is the actual "editor" — get this rock solid before anything else.

### P0.4 Basic Clip Properties
- Trim in/out, speed (0.1x–100x, simple + basic curve later), volume, mute, opacity.
- Position/scale/rotation (transform) via on-canvas bounding-box handles + numeric inputs in right inspector.

### P0.5 Basic Text
- Add text layer, edit content inline, font family/size/color/bold/italic/alignment, position/scale/rotation.

### P0.6 Export (v1)
- Export current sequence to MP4 (H.264), choose resolution (720p/1080p) and one preset (16:9).
  `[BUILD]` Client-side: `ffmpeg.wasm` for MVP (accept the perf hit), OR server-side render worker that replays the same timeline JSON with real ffmpeg for production quality. Recommend: build the render-spec-interpreter once, run it in ffmpeg.wasm for MVP, swap to a server worker in P1 without touching the UI.

---

## P1 — MAJOR FEATURES (this is where it starts feeling like CapCut)

### P1.1 Transitions
- Transition library between adjacent clips, categorized: **Trending, Basic (cut/fade/dissolve/wipe), Camera (zoom/pan), Overlay, Light Effect, Split, Distortion, Glitch, Blur, Slide, Mask.**
- Drag transition icon onto the seam between two clips; adjustable duration; live preview.
  `[BUILD]` Each transition = a GLSL/Canvas2D shader or crossfade function taking (frameA, frameB, progress 0–1) → composited frame. Store transition as a special node between two clips in the render spec.

### P1.2 Effects & Filters
- Video effects library (VFX): overlays, particles, glitch, VHS, light leaks, etc. Applied per-clip or whole timeline as an adjustment layer.
- Filters (color-grade presets: cinematic, vintage, vibrant, B&W, etc.) with intensity slider.
- Adjustment layer track type that affects everything beneath it.

### P1.3 Keyframe Animation
- Diamond keyframe toggle on Position / Scale / Rotation / Opacity / Volume / Effect params (already implied by CapCut UX — replicate exactly).
- Add keyframe at playhead, auto-interpolate between keyframes (linear default), draggable keyframe markers on a mini-track under the clip.
- Easing curve editor (ease-in/out, bezier) — can start with presets, full graph editor later (P3).
- Speed curve tool (non-linear speed ramping) using same keyframe mechanism on the "speed" parameter.

### P1.4 Audio Editing
- Waveform rendering on audio clips.
- Volume envelope (keyframed), fade in/out handles on clip corners.
- Music/SFX library (royalty-free), search + preview + drag to timeline.
- Audio ducking (auto-lower music under voice).
- Basic noise reduction, EQ presets, normalize loudness.
- Voice changer (pitch shift presets).

### P1.5 Text & Captions, Advanced
- Text presets/animated text templates (kinetic typography), entrance/exit/loop animations.
- Auto Captions: run speech-to-text on selected audio/video, generate timed caption clips on the Text Overlay track, editable as a transcript panel (click a word → jump playhead).
  `[BUILD]` Whisper (open-source, run server-side or via API) → word-level timestamps → auto-chunk into caption cards by duration/char-count → push as clips onto text track. Style presets stored separately and swappable without re-running STT.
- Caption style presets (the bold-yellow-outline TikTok look, karaoke word-highlight, etc.).

### P1.6 Green Screen / Chroma Key
- Chroma key effect: pick key color (eyedropper), tolerance/feather sliders, spill suppression.
- Manual background remover (AI, no green screen needed) — see P2 AI section for the automatic version; this is the manual/rules-based fallback.

### P1.7 Stickers, Overlays, Shapes
- Sticker/emoji/GIF library, drag onto canvas, same transform+keyframe system as text.
- Basic shape layer (rectangle/circle/line) with fill/stroke.
- Image/logo overlay with same transform tools; watermark placeholder.

### P1.8 Masks
- Apply mask (circle/rect/linear/mirror/star) to a clip; feather, position, invert.

### P1.9 Templates
- Template gallery: pre-built timeline structures (intro/outro/transitions/text presets bundled) user can drop their own media into slot placeholders.
  `[BUILD]` A template is just a saved timeline JSON with `mediaId: null` placeholder clips + a "slots" manifest; "apply template" = user drags their clips onto slots, engine replaces placeholders.

### P1.10 Motion Tracking
- Track a point/region across frames (for attaching text/stickers/mosaic to a moving subject).
  `[BUILD]` Client: use a lightweight optical-flow/point tracker (e.g., OpenCV.js `calcOpticalFlowPyrLK`) to output a per-frame position, feed that as an auto-generated keyframe track on the attached layer.

### P1.11 Sequence / Project Settings
- Aspect ratio presets (9:16, 1:1, 16:9, 4:5) with auto-reframe of canvas.
- Frame rate / resolution project settings.
- Ripple edit mode toggle, snapping toggle (already have icons — wire logic).

### P1.12 Export v2
- Platform presets (TikTok/Reels/YouTube Shorts/YouTube 16:9/Instagram Feed).
- Bitrate/quality control, format choice (MP4/MOV/GIF), export queue with progress bar, background export.
- Burn-in vs. removable watermark toggle (map to your own free/paid tiering if desired).

---

## P2 — AI DIFFERENTIATORS (the reason people pick CapCut over a plain editor)

### P2.1 Auto Reframe
- AI detects the subject/focal point per shot and auto-generates crop keyframes when converting 16:9 → 9:16 (or any ratio change), instead of a static center-crop.
  `[BUILD]` Run a lightweight object/face/saliency detector per sampled frame (e.g., a small on-device model or a server CV pass) → smooth the detected center point over time → write it as keyframes on the crop transform.

### P2.2 Auto Cutout / Background Remover (AI, no green screen)
- Per-frame subject segmentation (person/object) → transparent background or replace-background compositing, in real time in preview.
  `[BUILD]` Use a matting model (e.g., MediaPipe Selfie Segmentation / RVM) run frame-by-frame client-side (WebGL/WASM) or as a pre-process pass that bakes an alpha-matte video.

### P2.3 Text-to-Speech (AI Voiceover)
- Type script → choose voice/style/language → generate narration audio clip, auto-placed on audio track.
  `[BUILD]` TTS API (many voices/languages) → returns audio blob + optional word timestamps for caption sync.

### P2.4 AI Script / Video Generation Tools
- "Script to Video": prompt → AI writes a script → auto-selects/suggests stock or user clips per line → assembles a rough cut with voiceover + captions + music ("Smart Generation").
- AI script generator (topic → draft script text) standalone.
- Long Video → Shorts: scan a long upload, AI finds highlight-worthy segments, outputs several short-form cut suggestions.
  `[BUILD]` Chain: LLM (script/segment selection) → TTS → STT-for-captions → template assembly, all writing into the same timeline JSON used everywhere else.

### P2.5 Smart / AI Search
- Search uploaded media by natural-language content (objects, people, spoken words, scenes) instead of filename.
  `[BUILD]` Run STT + a vision-tagging pass on ingest, index into a searchable store (even simple keyword index is fine for v1; embeddings search for v2).

### P2.6 Auto Cut / Smart Cut / Filler Word & Silence Removal
- Transcript-based editing: delete a word in the transcript panel → the matching video segment is ripple-deleted from the timeline.
- One-click "remove filler words" (um, uh, repetitions) and "remove silences" using the STT transcript + pause detection.

### P2.7 AI Enhance
- Auto color/exposure correction ("Auto Adjust") — one click, adjustable intensity.
- Video upscaling / quality enhancement (super-resolution) for low-res source clips.
- Smooth slow-motion (AI frame interpolation) instead of naive frame duplication.
- Denoise (video) and noise removal (audio) as one-click AI passes.
- Auto Styles: face retouch/beauty filter, makeup, skin smoothing.

### P2.8 AI Avatars / Talking Characters (lower priority within P2 — nice-to-have, not core)
- Photo → animated talking avatar with lipsync to a script or audio; gesture/expression presets.

### P2.9 AI Translation & Dubbing
- Translate captions to another language; AI-dub voiceover in target language with rough lipsync.

---

## P3 — LONG TAIL / PLATFORM PARITY (do last, only after P0–P2 are solid)

- Full bezier/graph keyframe editor (not just presets).
- Collaboration: shared/team projects, cloud sync across devices, comments on timeline, project versioning/history.
- Account system: sign-in, cloud storage quota, plan tiers (free/standard/pro) gating specific effects/exports with watermark logic.
- Asset marketplace / community templates & effects publishing.
- Podcast-specific editing mode (multi-speaker waveform view, speaker auto-labeling).
- Advanced motion graphics / mask tracking combined with keyframes.
- Proxy media / performance mode for large 4K projects.
- Plugin/extension system.
- Mobile companion + "open on desktop" project handoff.
- Batch export / multi-sequence render queue.
- Version history with rollback, per-clip comments (for team review).
- Accessibility: screen-reader labels, full keyboard shortcut map (CapCut has an extensive one — build a shortcuts settings panel).

---

## SUGGESTED EXECUTION ORDER (vibe-coding phases)

1. **Phase 1 — "It's an editor":** P0.1–P0.4. Import media, place on timeline, trim/move/split, canvas preview renders correctly, undo/redo works.
2. **Phase 2 — "It's usable":** P0.5, P0.6, P1.11 (aspect ratio + settings), basic export. You should be able to make a real, if plain, video end to end.
3. **Phase 3 — "It looks like CapCut":** P1.1–P1.3 (transitions, effects, keyframes), P1.7–P1.8 (stickers/masks), P1.9 templates.
4. **Phase 4 — "It sounds and reads like CapCut":** P1.4–P1.5 (audio + captions), P1.6 (chroma key), P1.10 (tracking), P1.12 export presets.
5. **Phase 5 — "It's AI-powered":** P2.1–P2.4 (reframe, cutout, TTS, script-to-video) first — these are the headline features. Then P2.5–P2.9.
6. **Phase 6 — "It's a platform":** P3 items, prioritized by what you actually need (skip collab/marketplace if this is a solo/small-team product).

## ARCHITECTURE NOTES FOR THE CODER
- **Single source of truth:** one timeline JSON schema, mutated only through reducer-style actions (undo/redo for free). Preview renderer, export renderer, and AI feature outputs all read/write this same schema — build it once in Phase 1 and don't fork it later.
- **Preview vs. export are two renderers of the same spec:** canvas/WebGL for live preview (speed over fidelity), ffmpeg (wasm or server) for export (fidelity over speed). Keep effect/transition math in shared, renderer-agnostic functions where possible.
- **AI features are async jobs, not blocking UI:** every AI action (captions, cutout, TTS, reframe, enhance) should push a job, show progress, and write its result back into the timeline JSON as ordinary clips/keyframes — the timeline doesn't need to know an item was AI-generated.
- **Keep your current design system** (colors, spacing, iconography) as the component library; only the underlying data/render layer is new.
