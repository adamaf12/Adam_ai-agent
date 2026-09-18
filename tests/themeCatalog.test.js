import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_CATALOG } from '../src/core/themeCatalog.ts';

test('theme catalog exposes the complete premium theme set in a stable order', () => {
  assert.deepEqual(
    THEME_CATALOG.map((theme) => theme.id),
    ['system', 'dark', 'midnight', 'light', 'glass', 'glass-dark', 'aurora', 'ocean', 'cyberpunk', 'coffee', 'royal', 'crimson', 'matrix', 'dracula', 'nord', 'synthwave', 'forest', 'gold', 'solar', 'rose', 'stranger-things', 'outer-banks', 'game-of-thrones'],
  );
  for (const theme of THEME_CATALOG) {
    assert.ok(theme.label.ar);
    assert.ok(theme.label.en);
    assert.ok(theme.description.ar);
    assert.ok(theme.description.en);
  }
});
