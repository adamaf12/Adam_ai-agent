import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_CATALOG } from '../src/core/themeCatalog.ts';

test('theme catalog exposes the complete premium theme set in a stable order', () => {
  assert.deepEqual(
    THEME_CATALOG.map((theme) => theme.id),
    ['system','dark','midnight','light','glass','glass-dark','paper-clean','nord','stranger-things','peaky-blinders','breaking-bad','interstellar','batman-gotham','outer-banks','game-of-thrones','cyber-samurai','tokyo-night','matrix','monokai-pro','catppuccin-mocha','dracula','cyberpunk','gold','emerald-luxury','royal','crimson','deep-space','aurora','gruvbox-dark','synthwave','sunset-miami','ocean','forest','cherry-blossom','iceberg-polar','coffee','solar','rose'],
  );
  for (const theme of THEME_CATALOG) {
    assert.ok(theme.label.ar);
    assert.ok(theme.label.en);
    assert.ok(theme.description.ar);
    assert.ok(theme.description.en);
  }
});
