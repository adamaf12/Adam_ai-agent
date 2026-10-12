import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Brand metadata consistency across HTML and configuration', () => {
  const htmlPath = path.resolve(process.cwd(), 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');

  const content = fs.readFileSync(htmlPath, 'utf8');

  // 1. Verify application-name
  const appNameMatch = content.match(/<meta\s+name=["']application-name["']\s+content=["']([^"']+)["']/i);
  assert.ok(appNameMatch, 'application-name meta tag must exist');
  assert.equal(appNameMatch[1], 'ADEM AI', 'application-name must be "ADEM AI"');

  // 2. Verify apple-mobile-web-app-title
  const appleTitleMatch = content.match(/<meta\s+name=["']apple-mobile-web-app-title["']\s+content=["']([^"']+)["']/i);
  assert.ok(appleTitleMatch, 'apple-mobile-web-app-title meta tag must exist');
  assert.equal(appleTitleMatch[1], 'ADEM AI', 'apple-mobile-web-app-title must be "ADEM AI"');

  // 3. Verify og:site_name
  const ogSiteNameMatch = content.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  assert.ok(ogSiteNameMatch, 'og:site_name meta tag must exist');
  assert.equal(ogSiteNameMatch[1], 'ADEM AI', 'og:site_name must be "ADEM AI"');

  // 4. Verify title tag contains ADEM AI
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  assert.ok(titleMatch, 'title tag must exist');
  assert.ok(titleMatch[1].startsWith('ADEM AI'), 'title must start with ADEM AI');

  // 5. Verify og:title matches brand
  const ogTitleMatch = content.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  assert.ok(ogTitleMatch, 'og:title meta tag must exist');
  assert.ok(ogTitleMatch[1].startsWith('ADEM AI'), 'og:title must start with ADEM AI');

  // 6. Verify twitter:title matches brand
  const twitterTitleMatch = content.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
  assert.ok(twitterTitleMatch, 'twitter:title meta tag must exist');
  assert.ok(twitterTitleMatch[1].startsWith('ADEM AI'), 'twitter:title must start with ADEM AI');

  // 7. Verify robots meta tag allows indexing
  const robotsMatch = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  assert.ok(robotsMatch, 'robots meta tag must exist');
  assert.ok(robotsMatch[1].includes('index') && robotsMatch[1].includes('follow'), 'robots must allow index, follow');

  // 8. Verify noscript contains real semantic content
  assert.ok(content.includes('<noscript>'), 'noscript must exist');
  assert.ok(content.includes('ADEM AI (آدم)'), 'noscript must contain Arabic title and explanation');
  assert.ok(content.includes('ademfeidat@gmail.com'), 'noscript must provide contact email');

  // 9. Verify CSS initial skeleton UI exists before JS evaluation
  assert.ok(content.includes('adem-init-skeleton'), 'initial CSS skeleton preloader must exist');
});
