# Adam AI v2 Clean-Room Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Adam frontend and oversized server with a clean, premium, testable foundation for Chat, Onboarding, and the application shell.

**Architecture:** A focused React feature architecture sits on top of small domain services. The browser calls a provider-neutral `/api/chat` streaming endpoint; the server owns provider credentials and adapters. Legacy source is removed from the `src` tree rather than retained as compatibility code.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Express 4, Google GenAI SDK, Capacitor 8, Lucide React, Motion, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-adam-ai-v2-rebuild-design.md`

## Global Constraints

- `src` contains only the new application architecture after the rebuild.
- Arabic RTL and English LTR are supported from the root application state.
- Provider API keys are server-only.
- Chat must preserve drafts and show typed error states.
- No fake successful AI response is emitted when the provider is unavailable.
- Production code must pass `npm run lint`, `npm test`, and `npm run build`.
- Android compatibility must remain intact through `npm run cap:sync`.

---

### Task 1: Establish the clean-room application contracts

**Files:**
- Create: `src/core/domain.ts`
- Create: `src/core/i18n.ts`
- Create: `src/core/storage.ts`
- Create: `tests/domain.test.js`
- Modify: `package.json`

**Interfaces:**
- `Message`, `ChatConversation`, `AppPreferences`, `Language`, `ViewId`.
- `safeJsonParse`, `createId`, and preference serialization helpers.

- [ ] Write tests for id creation, safe parsing, and preference normalization.
- [ ] Run `npm test` and verify the new tests fail before implementation.
- [ ] Implement the small domain/storage helpers.
- [ ] Run `npm test` and verify all tests pass.
- [ ] Add the `test` script using Node's built-in test runner.
- [ ] Commit the contract layer.

### Task 2: Replace the visual system and application shell

**Files:**
- Replace: `src/App.tsx`
- Replace: `src/index.css`
- Replace: `src/main.tsx`
- Create: `src/components/BrandMark.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/EmptyState.tsx`

**Interfaces:**
- `AppShell` accepts active view, language, agent name, and navigation callback.
- `BottomNav` accepts active `ViewId` and `onChange`.

- [ ] Add tests for navigation labels and view invariants in the existing Node test suite.
- [ ] Run tests to observe the missing new contracts.
- [ ] Implement the responsive shell with accessible controls and keyboard-safe focus states.
- [ ] Implement light/dark tokens and RTL-safe layout primitives.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Commit the shell.

### Task 3: Rebuild onboarding as a first-class flow

**Files:**
- Create: `src/features/onboarding/Onboarding.tsx`
- Create: `src/features/onboarding/onboardingModel.ts`
- Create: `tests/onboarding.test.js`
- Modify: `src/App.tsx`

**Interfaces:**
- `OnboardingStep = 'welcome' | 'language' | 'workspace' | 'ready'`.
- `OnboardingState` contains agent name, language, connected services, and completion.

- [ ] Test step progression, back navigation, validation, and persisted completion.
- [ ] Run tests and observe RED.
- [ ] Implement the four-step flow with polished mobile layout and no modal dependency.
- [ ] Persist only non-secret onboarding preferences.
- [ ] Run tests, lint, and build.
- [ ] Commit onboarding.

### Task 4: Rebuild chat transport and controller

**Files:**
- Create: `src/core/ai/types.ts`
- Create: `src/core/ai/client.ts`
- Create: `src/features/chat/chatModel.ts`
- Create: `src/features/chat/Chat.tsx`
- Create: `src/features/chat/MessageBubble.tsx`
- Create: `src/features/chat/Composer.tsx`
- Create: `src/features/chat/StreamingIndicator.tsx`
- Create: `tests/chat.test.js`
- Replace: `server.ts`

**Interfaces:**
- `ChatClient.send(messages, signal, onDelta): Promise<Message>`.
- Server endpoint `POST /api/chat` accepts `{messages, language, agentName}` and emits `{type:'delta'|'done'|'error'}` events.

- [ ] Test event parsing, cancellation, empty messages, and provider error mapping.
- [ ] Run tests and verify RED.
- [ ] Implement provider-neutral client and controller.
- [ ] Implement server-side Gemini adapter using only server environment credentials.
- [ ] Implement bounded retry for 429/5xx and typed 401/403 errors.
- [ ] Render streaming text incrementally and allow cancellation/retry.
- [ ] Run tests, lint, and build.
- [ ] Commit the chat engine.

### Task 5: Remove legacy source and update product metadata

**Files:**
- Delete: all legacy files under `src/components`, `src/hooks`, and `src/lib`.
- Delete: legacy patch scripts at repository root.
- Modify: `README.md`
- Modify: `index.html`

- [ ] Confirm no import points to removed legacy modules.
- [ ] Remove obsolete patch scripts and stale frontend artifacts.
- [ ] Update README to describe the v2 architecture and development commands.
- [ ] Run tests, lint, and build.
- [ ] Commit the cleanup.

### Task 6: CI quality gates

**Files:**
- Create: `.github/workflows/quality.yml`
- Modify: `.github/workflows/android-release.yml`

- [ ] Add CI checks for `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
- [ ] Ensure Android release uses the same build gate before packaging.
- [ ] Verify YAML structure locally where possible and inspect the resulting workflow definition.
- [ ] Commit CI changes.

## Final verification

Run the full test suite, TypeScript check, production build, and inspect the Git diff for accidental legacy imports. Only after fresh evidence is green should the branch be considered ready for review.
