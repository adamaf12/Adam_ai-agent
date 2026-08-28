const fs = require('fs');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/maamarfeidat@gmail\.com/g, "adamaiproduction@gmail.com");
  fs.writeFileSync(filePath, code);
}

replaceInFile('src/lib/developerErrorReporting.ts');
replaceInFile('src/components/AutoHealDashboard.tsx');
replaceInFile('src/lib/autoHealEngine.ts');

