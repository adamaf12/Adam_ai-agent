const fs = require('fs');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes("const isArabic = settings.language === 'ar';")) {
    if (!code.includes("resolveAppLanguage")) {
      code = "import { resolveAppLanguage } from '../lib/languageResolver';\n" + code;
    }
    code = code.replace(/const isArabic = settings\.language === 'ar';/g, "const isArabic = resolveAppLanguage(settings) === 'ar';");
    fs.writeFileSync(filePath, code);
  }
}

replaceInFile('src/components/OnboardingModal.tsx');
replaceInFile('src/components/Navbar.tsx');
