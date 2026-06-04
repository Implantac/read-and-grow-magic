import fs from 'fs';
import path from 'path';

const hooksDir = 'src/hooks';
const subfolders = ['accounting', 'ai', 'commercial', 'financial', 'fiscal', 'inventory', 'production', 'purchasing', 'shared', 'system', 'wms'];

const hookMapping = new Map();

subfolders.forEach(folder => {
  const folderPath = path.join(hooksDir, folder);
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const hookName = file.replace(/\.(ts|tsx)$/, '');
      hookMapping.set(`@/hooks/${hookName}`, `@/hooks/${folder}/${hookName}`);
    });
  }
});

function updateImports(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateImports(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      hookMapping.forEach((newPath, oldPath) => {
        if (content.includes(oldPath)) {
          // Use regex to ensure we match exactly the path and not a subpath
          const regex = new RegExp(oldPath + "(['\"])", 'g');
          if (regex.test(content)) {
            content = content.replace(regex, newPath + '$1');
            changed = true;
          }
        }
      });
      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated imports in ${filePath}`);
      }
    }
  });
}

updateImports('src');
console.log('Finished updating imports.');
