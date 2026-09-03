import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_CATALOG, GLASS_OPTION } from '../src/core/themeCatalog.ts';

test('theme catalog keeps base themes separate from optional Glass', () => {
  assert.deepEqual(THEME_CATALOG.map((theme) => theme.id), ['system', 'light', 'dark', 'aurora']);
  assert.ok(GLASS_OPTION.label.ar);
  assert.ok(GLASS_OPTION.label.en);
  assert.ok(GLASS_OPTION.description.ar);
  assert.ok(GLASS_OPTION.description.en);
  for (const theme of THEME_CATALOG) { assert.ok(theme.label.ar); assert.ok(theme.label.en); assert.ok(theme.description.ar); assert.ok(theme.description.en); }
});
