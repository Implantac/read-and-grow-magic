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

      // Update absolute imports
      hookMapping.forEach((newPath, oldPath) => {
        const regex = new RegExp(oldPath + "(['\"])", 'g');
        if (regex.test(content)) {
          content = content.replace(regex, newPath + '$1');
          changed = true;
        }
      });

      // Update relative imports inside hooks to use absolute paths
      if (filePath.startsWith('src/hooks')) {
        const relativeRegex = /from\s+['"](\.\/|\.\.\/)(use[A-Za-z]+)['"]/g;
        let match;
        while ((match = relativeRegex.exec(content)) !== null) {
          const hookName = match[2];
          const absolutePath = `@/hooks/${hookName}`;
          if (hookMapping.has(absolutePath)) {
            content = content.replace(match[0], `from '${hookMapping.get(absolutePath)}'`);
            changed = true;
          }
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated imports in ${filePath}`);
      }
    }
  });
}


updateImports('src');
console.log('Finished updating imports.');
