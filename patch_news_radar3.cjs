const fs = require('fs');
let code = fs.readFileSync('src/components/NewsRadarModal.tsx', 'utf8');

code = code.replace("  const [activeTab, setActiveTab] = // replaced by patch", "");

fs.writeFileSync('src/components/NewsRadarModal.tsx', code);
