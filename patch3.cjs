const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/const isArabic = settings\.language === 'ar';/g, "const isArabic = resolveAppLanguage(settings) === 'ar';");
fs.writeFileSync('src/App.tsx', code);
