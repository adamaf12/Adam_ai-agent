const fs = require('fs');
let code = fs.readFileSync('src/components/NewsRadarModal.tsx', 'utf8');

const oldFilter = `  const filteredNews = newsItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.titleAr.includes(searchQuery) && !item.titleEn.includes(searchQuery)) return false;
    return true;
  });`;

const newFilter = `  const filteredNews = newsItems.filter((item) => {
    if (selectedCategory !== 'all') {
      if (item.category !== selectedCategory) return false;
    } else if (preferredCategories.length > 0) {
      if (!preferredCategories.includes(item.category)) return false;
    }
    if (searchQuery && !item.titleAr.includes(searchQuery) && !item.titleEn.includes(searchQuery)) return false;
    return true;
  });`;

code = code.replace(oldFilter, newFilter);
fs.writeFileSync('src/components/NewsRadarModal.tsx', code);
