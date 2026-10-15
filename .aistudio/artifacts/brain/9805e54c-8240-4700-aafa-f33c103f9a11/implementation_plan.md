# 3D Arcade Game, 9-Model Multimodal AI Suite & Vercel Verification Plan

Architectural blueprint for building and verifying the interactive 3D Three.js multi-mission game, the complete 9-model Gemini & Veo multimodal intelligence suite, and end-to-end Vercel serverless execution.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Clarification:**
> - **Game Variety**: All 3 requested game styles will be unified in a full-viewport **3D Arcade Studio** (`Cyber-Drone City Runner`, `Deep-Space Starship Flight`, and `Procedural Tech Lab Exploration/Puzzles`).
> - **Testing & Diagnostics Focus**: An integrated **Vercel & Multimodal Diagnostic Test Suite** will verify all 9 models and endpoints (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-nano-banana-2.1`, `veo-3.1-fast-generate-preview`, `gemini-3.8-live`, `gemini-3.5-transcribe`, Google Search Grounding), measure latency and streaming throughput, and test desktop/mobile viewports.

---

## 1. Overview & Core Concept

1. **3D Arcade Studio (`ThreeJsGameStudio.tsx`)**:
   - A dedicated, full-viewport 3D Game experience built with Three.js r160+.
   - Follows the core Game Shell flow: `Title Screen` -> `Mission Select` -> `Playing (60 FPS)` -> `Pause / Game Over / Victory Modal`.
   - Assembles composite 3–12 part procedural models (`THREE.Group`), studio PBR lighting (`ACESFilmicToneMapping`, `RoomEnvironment`, `PMREMGenerator`, warm key + cool fill + distance fog), procedural Web Audio synthesized sound effects, smooth exponential camera damping, and zero 404 external asset dependencies.
   - Offers three distinct playable missions:
     - **Mission 1: Cyber-Drone City Runner**: Dodge procedural neon towers, collect quantum power cores, and boost through dynamic speed rings.
     - **Mission 2: Deep-Space Starship Flight**: Maneuver an agile fighter through asteroid fields, fire plasma pulse lasers, and reach orbital warp gates.
     - **Mission 3: Tech Lab Exploration**: Navigate a sleek cybernetic laboratory, interact with quantum terminals, solve energy puzzle gates, and reach the extraction core.

2. **The 9 Multimodal AI Capabilities**:
   - **`gemini-4-argon`**: Flagship complex reasoning, deep code architecture, and multi-step algorithmic analysis.
   - **`gemini-3.8-flash`**: General tasks, conversational reasoning, and high-efficiency multi-turn dialog.
   - **`gemini-3.1-flash-lite`**: Ultra-fast latency responses for quick translations and short completions.
   - **`gemini-nano-banana-2.1`**: High-fidelity text-to-image creation and image editing with custom aspect ratios (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`).
   - **`veo-3.1-fast-generate-preview` (Text-to-Video)**: Generate HD video clips from text prompts in `16:9` or `9:16`.
   - **`veo-3.1-fast-generate-preview` (Image-to-Video)**: Animate user-uploaded photos into dynamic cinematic motion clips.
   - **`gemini-3.8-live` (Live API)**: Bidirectional, real-time voice conversations via WebSocket bridge.
   - **`gemini-3.8-flash` with `googleSearch` Grounding**: Real-time web knowledge retrieval with clickable source citations.
   - **`gemini-3.5-transcribe`**: Direct microphone audio recording and speech-to-text transcription.

3. **Vercel Serverless & Production Testing Suite**:
   - Dedicated verification suite (`VercelDiagnosticsView.tsx`) to execute automated and interactive probe requests against `/api/chat`, `/api/media/gemini-image`, `/api/media/veo-generate`, `/api/audio/transcribe`, and `/api/grounding/search`.
   - Validates response codes, streaming keep-alive, headers, cold-start latency, and mobile responsive layout.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADEM OS Top Navigation Bar                      │
│ [ADEM • adem feidat]  [Chat] [Media] [3D Game Studio] [Live Voice] ...│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  3D Game Studio  │     │  Media & AI Hub  │     │   Live & Voice   │
│  • Cyber-Drone   │     │  • Nano Banana   │     │  • 3.8-Live API  │
│  • Deep-Space    │     │  • Veo Video     │     │  • Transcribe    │
│  • Tech Lab      │     │  • Ground Search │     │  • Vercel Test   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Visual Identity & Theme
- **Color Tokens**: Obsidian background (`#0A0D14`), sleek border (`#1F293D`), electric cyan accent (`#06B6D4`), warm amber highlight (`#F59E0B`), emerald status (`#10B981`).
- **Game Viewport Discipline**:
  - Full-screen immersion (`100vw x 100vh`) with 85%+ playfield visibility.
  - Zero `backdrop-filter` over the active WebGL canvas.
  - Collapsible, ergonomic bottom dock for controls, camera modes, audio mute, and restart.
- **Audio & Haptics**:
  - Pure procedural Web Audio API synthesizers for thrusters, laser pulses, energy pickups, and collision impacts (no external audio files).

---

## 3. Key Product Decisions & Trade-Offs

1. **Three.js WebGL Architecture vs. Canvas 2D**:
   - *Decision*: Full Three.js WebGL scene with `InstancedMesh` for obstacles, custom `THREE.Group` composite vehicles, and isolated `requestAnimationFrame` loop.
   - *Why*: Delivers 60 FPS performance without React state re-render stalls.

2. **Serverless Streaming on Vercel**:
   - *Decision*: Support both direct streaming via Node.js Serverless Functions (`/api/chat`, `/api/diagnostics/speed-test/stream`) and fallback client simulation for demo testing when upstream credentials are not configured.
   - *Why*: Prevents Vercel 10s/15s execution timeout deadlocks and guarantees the user can test the UI in all environments.

3. **Multi-Model Routing in Chat**:
   - *Decision*: Expose a quick model switcher right in the chat header or composer (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.1-flash-lite`).
   - *Why*: Allows immediate comparison of reasoning depth and latency as requested.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                         AppShell (Navigation)                         │
│   ├── Chat (gemini-4-argon, 3.8-flash, 3.1-flash-lite, Google Search) │
│   ├── MediaStudio (gemini-nano-banana-2.1, Veo 3 Video Text & Image)   │
│   ├── ThreeJsGameStudio (Cyber-Drone, Spaceflight, Tech Lab 3D scenes) │
│   ├── LiveVoiceModal (gemini-3.8-live WebSockets)                      │
│   ├── AudioTranscriber (gemini-3.5-transcribe Mic Capture)             │
│   └── VercelDiagnosticsView (End-to-End Multimodal Test Console)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ REST / SSE / WebSocket
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       Express / Vercel Backend                         │
│   ├── POST /api/chat (model routing: 4-argon, 3.8-flash, 3.1-flash)   │
│   ├── POST /api/media/gemini-image (gemini-nano-banana-2.1)            │
│   ├── POST /api/media/veo-generate (veo-3.1-fast-generate-preview)     │
│   ├── POST /api/audio/transcribe (gemini-3.5-transcribe)               │
│   ├── POST /api/grounding/search (gemini-3.8-flash + googleSearch)     │
│   └── WS   /live (gemini-3.8-live bridge)                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Verification & Testing Plan

1. **Automated Unit & Integration Tests**:
   - Run `npm test` verifying test assertions across all suites.
2. **TypeScript & Compilation Audit**:
   - Run `compile_applet` and `lint_applet` with zero type errors.
3. **Vercel Readiness Checks**:
   - Verify all `/api/*` endpoints handle missing keys gracefully with typed JSON error envelopes.
   - Test build output size and bundle chunking in `dist/`.
4. **End-to-End Interactive Verification**:
   - Test the 3D Arcade Game at 60 FPS in browser with keyboard and touch inputs.
   - Run the Vercel Multimodal Probe to check all 9 model responses.
