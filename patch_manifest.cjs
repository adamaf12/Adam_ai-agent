const fs = require('fs');
let manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

manifest.short_name = "آدم AI";
manifest.name = "آدم - وكيل الذكاء الاصطناعي";
manifest.display = "standalone";
manifest.start_url = "/";

fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
