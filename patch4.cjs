const fs = require('fs');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes("'adam-neural'")) {
    if (!code.includes("syncVoiceEngineLanguage")) {
      // Find the right place to import
      const importStatement = "import { syncVoiceEngineLanguage } from '../lib/languageResolver';\n";
      // It's a bit hacky, but let's just prepend it. Actually, wait. We need `settings`.
      // Does MessageItem have settings?
    }
  }
}
