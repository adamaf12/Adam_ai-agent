const fs = require('fs');
let code = fs.readFileSync('src/components/NewsRadarModal.tsx', 'utf8');

code = code.replace(/NEWS_CATEGORIES/g, "categories");
code = code.replace(/c.labelEn/g, "c.labelAr"); // fallback to labelAr if labelEn not there

fs.writeFileSync('src/components/NewsRadarModal.tsx', code);
