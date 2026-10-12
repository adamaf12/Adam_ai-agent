import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Input Lock & Live Progress System Architecture', () => {
  // 1. Verify existence of Generation Context
  const contextPath = path.resolve(process.cwd(), 'src/core/generation/generationContext.tsx');
  assert.ok(fs.existsSync(contextPath), 'generationContext.tsx must exist');
  const contextCode = fs.readFileSync(contextPath, 'utf8');

  assert.ok(contextCode.includes('isGenerating'), 'Must track isGenerating state');
  assert.ok(contextCode.includes('startGeneration'), 'Must provide startGeneration');
  assert.ok(contextCode.includes('updateStage'), 'Must provide updateStage');
  assert.ok(contextCode.includes('finishGeneration'), 'Must provide finishGeneration');
  assert.ok(contextCode.includes('cancelGeneration'), 'Must provide cancelGeneration');
  assert.ok(contextCode.includes('AbortController'), 'Must support AbortController');

  // 2. Verify LiveProgressCard component
  const cardPath = path.resolve(process.cwd(), 'src/components/LiveProgressCard.tsx');
  assert.ok(fs.existsSync(cardPath), 'LiveProgressCard.tsx must exist');
  const cardCode = fs.readFileSync(cardPath, 'utf8');

  assert.ok(cardCode.includes('useGeneration'), 'Must consume useGeneration');
  assert.ok(cardCode.includes('cancelGeneration'), 'Must call cancelGeneration');
  assert.ok(cardCode.includes('elapsedSeconds'), 'Must display elapsed seconds');
  assert.ok(cardCode.includes('progressBarClass') || cardCode.includes('progress'), 'Must render progress bar');

  // 3. Verify Composer integration with input lock & function guard
  const composerPath = path.resolve(process.cwd(), 'src/features/chat/Composer.tsx');
  assert.ok(fs.existsSync(composerPath), 'Composer.tsx must exist');
  const composerCode = fs.readFileSync(composerPath, 'utf8');

  assert.ok(composerCode.includes('useGeneration'), 'Composer must consume useGeneration');
  assert.ok(composerCode.includes('isLocked'), 'Composer must track isLocked');
  assert.ok(composerCode.includes('LiveProgressCard'), 'Composer must render LiveProgressCard');
  assert.ok(composerCode.includes('isLocked) return'), 'Composer must guard submit function against locked state');
  assert.ok(composerCode.includes('disabled={isLocked}'), 'Textarea must be disabled when isLocked');
  assert.ok(composerCode.includes('readOnly={isLocked}'), 'Textarea must be readOnly when isLocked');

  // 4. Verify Chat integration
  const chatPath = path.resolve(process.cwd(), 'src/features/chat/Chat.tsx');
  const chatCode = fs.readFileSync(chatPath, 'utf8');

  assert.ok(chatCode.includes('useGeneration'), 'Chat must consume useGeneration');
  assert.ok(chatCode.includes('startGeneration'), 'Chat must trigger startGeneration');
  assert.ok(chatCode.includes('classifyTaskType'), 'Chat must classify task type (image, video, game, search, chat)');
  assert.ok(chatCode.includes('busy || isGenerating) return'), 'Chat send must enforce double function guard');
  assert.ok(chatCode.includes('AbortError'), 'Chat must gracefully handle abort without breaking session');

  // 5. Verify MediaStudio integration
  const mediaPath = path.resolve(process.cwd(), 'src/features/media/MediaStudio.tsx');
  const mediaCode = fs.readFileSync(mediaPath, 'utf8');

  assert.ok(mediaCode.includes('useGeneration'), 'MediaStudio must consume useGeneration');
  assert.ok(mediaCode.includes('activeGenerating'), 'MediaStudio must compute activeGenerating');
  assert.ok(mediaCode.includes('LiveProgressCard'), 'MediaStudio must render LiveProgressCard');
  assert.ok(mediaCode.includes('activeGenerating) return'), 'MediaStudio must guard handleGenerate');
  assert.ok(mediaCode.includes('disabled={activeGenerating}'), 'MediaStudio prompt must be disabled when generating');

  // 6. Verify AppSandboxStudio integration
  const sandboxPath = path.resolve(process.cwd(), 'src/features/sandbox/AppSandboxStudio.tsx');
  const sandboxCode = fs.readFileSync(sandboxPath, 'utf8');

  assert.ok(sandboxCode.includes('useGeneration'), 'AppSandboxStudio must consume useGeneration');
  assert.ok(sandboxCode.includes('activeSynthesizing'), 'AppSandboxStudio must compute activeSynthesizing');
  assert.ok(sandboxCode.includes('LiveProgressCard'), 'AppSandboxStudio must render LiveProgressCard in overlay');
  assert.ok(sandboxCode.includes('activeSynthesizing) return'), 'AppSandboxStudio must guard handleSynthesizeDirectly');

  // 7. Verify Root GenerationProvider in App.tsx
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf8');
  assert.ok(appCode.includes('GenerationProvider'), 'App.tsx must wrap application in GenerationProvider');
});
