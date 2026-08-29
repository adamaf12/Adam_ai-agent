# Adam AI v2 — Clean-Room Rebuild Design

## Goal
Rebuild Adam AI as a production-grade, mobile-first personal AI workspace with a clean architecture, premium UI, reliable AI transport, bilingual Arabic/English UX, and a testable foundation that can grow without returning to the monolithic legacy design.

## Non-negotiable outcomes
- The legacy `src` application is replaced, not incrementally patched.
- UI state, domain state, persistence, AI transport, and provider logic have explicit boundaries.
- Arabic RTL and English LTR are first-class and tested.
- Chat supports streaming, cancellation, retry, empty/loading/error states, Markdown, code, and conversation persistence.
- The application remains installable through Capacitor and compatible with the existing Android release pipeline.
- Provider credentials never live in browser bundles.
- Every production behavior is covered by a deterministic test or an explicit integration verification.

## Product shape
Adam is organized around five primary surfaces: Chat, Tasks, Memory, Workspace, and Settings. Chat is the primary surface and exposes proactive suggestions and tool activity without making the interface feel like a developer console.

The visual system is intentionally restrained: emerald accent, high-contrast typography, generous spacing, soft elevation, compact mobile controls, and responsive desktop expansion. The interface must feel deliberate rather than template-generated.

## Architecture

```text
React UI
  ↓
Application state / feature controllers
  ↓
Domain services
  ├─ Conversation store
  ├─ Preferences store
  ├─ AI client
  └─ Tool registry
       ↓
Server API
  ↓
Provider adapter(s)
  ↓
Gemini / future providers
```

The browser knows only the public application contract. Provider secrets and privileged provider calls stay server-side.

## Phase 1 — foundation
1. Clean application shell and design system.
2. Four-step onboarding with persisted completion state.
3. Chat controller and server transport with graceful provider errors.
4. Test harness and CI verification.

## Phase 2 — durable product modules
- Tasks with local persistence and scheduling model.
- Memory with explicit user-controlled records.
- Workspace connections and provider capability discovery.
- Settings, theme, language, privacy, and diagnostics.

## Phase 3 — agent capabilities
- Intent classification.
- Tool routing.
- Web search.
- Code workflows.
- Media jobs.
- Voice.
- Calendar/email integrations.

## Data contracts
Conversation messages use a stable `Message` shape with id, role, content, timestamp, and optional metadata. The transport returns either a complete assistant response or a typed error envelope. Streaming uses newline-delimited JSON events so partial text can be rendered without coupling the UI to a provider SDK.

## Failure behavior
- Missing provider credentials: clear setup state, never a fake success.
- Provider 401/403: explain account/provider configuration rather than blaming the UI.
- Provider 429: bounded retry with backoff and a user-readable temporary state.
- Provider 5xx/timeouts: bounded retry and provider-neutral error state.
- Offline browser: preserve draft and conversation locally and expose retry.

## Quality gates
Every phase must pass TypeScript checking, the unit/integration test suite, production build, and a mobile layout smoke check before being treated as complete. Android packaging remains a separate release gate because it requires the Android toolchain.
