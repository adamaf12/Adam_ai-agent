const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /'Cinematic Video AI Engine 🎬 \(محرك توليد الفيديو السينمائي\)'/g,
  "'أدم صانع الفيديوهات 🎬'"
);

code = code.replace(
  /'High Quality Image Engine 🎨 \(محرك توليد وتعديل الصور\)'/g,
  "'أدم صانع الصور 🎨'"
);

code = code.replace(
  /'Cinematic AI Video Studio 🎬 \(Hollywood-Grade\)'/g,
  "'أدم صانع الفيديوهات 🎬'"
);

code = code.replace(
  /'Hollywood Cinematic Image Studio 🎨'/g,
  "'أدم صانع الصور 🎨'"
);

fs.writeFileSync('server.ts', code);
