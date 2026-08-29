# Adam AI Agent v2

Adam is a premium, bilingual personal AI workspace built for Web, Android, iOS, and desktop. v2 is a clean-room rebuild focused on a fast mobile experience, reliable AI transport, and architecture that can grow without a monolithic frontend.

## v2 foundation

- ✨ Four-step onboarding with persisted preferences
- 💬 Streaming AI chat with cancellation, retry, and typed provider errors
- 🌍 Arabic RTL + English LTR from the application root
- 📱 Mobile-first shell with desktop expansion
- 🧠 Dedicated surfaces for Chat, Tasks, Memory, Workspace, and Settings
- 🔐 Provider credentials stay server-side
- 🧪 Automated tests, TypeScript checks, and production build gates
- 📦 Capacitor-ready Android/iOS architecture

## Architecture

```text
React UI
  ↓
Feature controllers
  ↓
Domain + storage + AI client
  ↓
POST /api/chat (NDJSON stream)
  ↓
Server provider adapter
  ↓
Gemini
```

The browser never needs a provider API key. The server owns provider credentials and converts provider failures into stable application errors.

## Development

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```

For local AI chat, provide a server-side key:

```env
GEMINI_API_KEY=...
ADAM_GEMINI_MODEL=gemini-3.7-flash
```

Never commit secrets. The Android/iOS client should use a deployed API endpoint rather than embedding provider credentials.

## Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Release builds are handled by GitHub Actions. The quality workflow must pass tests, TypeScript, and the production build before the Android release workflow is considered healthy.

## Project direction

The next layers are intentionally added only after the foundation is stable: Tasks → Memory → Workspace integrations → Settings → agent routing/tools → web search → media → voice.
