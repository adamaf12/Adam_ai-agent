const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("import { processOfflineQuery, isForcedOfflineMode } from './lib/offlineAiEngine';", "import { processOfflineQuery, isForcedOfflineMode } from './lib/offlineAiEngine';\nimport { resolveAppLanguage, syncVoiceEngineLanguage } from './lib/languageResolver';");

code = code.replace("const payloadSettings = { ...settings };", "const payloadSettings = { ...settings, language: resolveAppLanguage(settings) as any };");

fs.writeFileSync('src/App.tsx', code);
