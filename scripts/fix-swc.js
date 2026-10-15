const fs = require('fs');
const path = require('path');

const brokenDir = path.join(__dirname, '..', 'node_modules', '@next', 'swc-win32-x64-msvc');
const backupDir = path.join(__dirname, '..', 'node_modules', '@next', 'swc-win32-x64-msvc.bak');

if (fs.existsSync(brokenDir)) {
  console.log('Moving broken swc binary out of the way...');
  try {
    fs.renameSync(brokenDir, backupDir);
    console.log('Successfully moved to', backupDir);
  } catch (e) {
    console.error('Failed to move:', e);
  }
} else {
  console.log('Broken directory does not exist or already moved.');
}
