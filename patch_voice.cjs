const fs = require('fs');
let code = fs.readFileSync('src/lib/voiceEngine.ts', 'utf8');

if (!code.includes("import { loadSettings }")) {
  code = "import { loadSettings } from './storage';\n" + 
         "import { syncVoiceEngineLanguage } from './languageResolver';\n" + code;
  
  // replace voiceId: string = 'adam-neural' with voiceId?: string
  code = code.replace("voiceId: string = 'adam-neural',", "voiceId?: string,");
  
  // inside speakWithGlobalVoice, find:
  // let voiceConfig = GLOBAL_VOICES.find((v) => v.id === voiceId) || GLOBAL_VOICES[0];
  const target = "let voiceConfig = GLOBAL_VOICES.find((v) => v.id === voiceId) || GLOBAL_VOICES[0];";
  const replacement = `
  const settings = loadSettings();
  const optimalVoiceId = syncVoiceEngineLanguage(settings);
  const finalVoiceId = voiceId && voiceId !== 'adam-neural' ? voiceId : (settings.voiceSettings?.voiceId || optimalVoiceId);
  let voiceConfig = GLOBAL_VOICES.find((v) => v.id === finalVoiceId) || GLOBAL_VOICES[0];
  `;
  
  code = code.replace(target, replacement);
  fs.writeFileSync('src/lib/voiceEngine.ts', code);
}
