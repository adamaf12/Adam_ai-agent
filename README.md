# ADAM Personal AI Agent 🤖

**Adam** is a multilingual personal AI agent designed for Web, Android, iOS and desktop. The project combines fast conversational responses with tool routing, long-term memory, Google Workspace integrations and AI media generation.

## What Adam can do

- 💬 Fast chat with a lightweight response path
- 🧠 Intent detection and planning for complex requests
- 🔎 Live web-search workflows
- 💻 Coding and debugging assistance
- 🎨 AI image generation and editing when configured
- 🎬 AI video generation as asynchronous jobs when configured
- 📅 Calendar and scheduling workflows
- 📧 Email workflows
- 📝 Notes and long-term memory
- 🎙️ Voice interaction
- 📱 Capacitor Android/iOS architecture
- 🖥️ Electron desktop builds

## Architecture

```text
User
  ↓
Adam UI (Web / iOS / Android / Desktop)
  ↓
Intent Router → Fast Path / Planner
  ↓
Tool Router
  ├─ Chat / Reasoning
  ├─ Web Search
  ├─ Code
  ├─ Image
  ├─ Video Jobs
  ├─ Calendar / Email
  └─ Memory / Files
  ↓
Backend + Providers
```

Simple requests stay on the fast path. Complex requests can be planned and verified before the final response.

## Development

```bash
npm install
npm run dev
```

Keep secrets in environment variables. Never commit provider API keys to source control. See `docs/RELEASE.md` for release guidance.

## Android

```bash
npm run build
npx cap sync android
npx cap open android
```

For maintainers, pushing a version tag such as `v1.0.0` triggers the Android GitHub Actions workflow, which builds and publishes an APK to the GitHub Release.

## Environment

Provider credentials belong in the deployment environment, for example:

```env
GEMINI_API_KEY=...
XAI_API_KEY=...
```

Only configure providers you actually use. Client-side builds must not expose privileged server secrets.

## Releases

Users should use **GitHub → Releases** and download the latest Android APK attached to the release. Do not ask users to inspect source folders to find an installer.
