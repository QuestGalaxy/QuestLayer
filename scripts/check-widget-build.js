const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const runtimeEntry = path.join(distDir, 'widget-runtime.js');
const assetsDir = path.join(distDir, 'assets');

const issues = [];

if (!fs.existsSync(distDir)) {
  issues.push('dist/ is missing. Run the widget build first.');
}

if (!fs.existsSync(runtimeEntry)) {
  issues.push('dist/widget-runtime.js is missing.');
}

if (!fs.existsSync(assetsDir)) {
  issues.push('dist/assets/ is missing. Dynamic chunks will 404 in production.');
}

if (issues.length) {
  console.error('[QuestLayer] Widget build validation failed:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('[QuestLayer] Widget build validation passed.');
