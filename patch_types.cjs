const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes("newsPreferences?: string[];")) {
  code = code.replace("permissions: {", "newsPreferences?: string[];\n  permissions: {");
  fs.writeFileSync('src/types.ts', code);
}
