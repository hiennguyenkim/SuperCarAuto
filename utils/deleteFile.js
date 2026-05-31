const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  if (!filePath) return;

  // Do not delete web URLs (e.g. Unsplash references)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return;

  // Normalise path (if it has leading slash, remove it for relative mapping)
  const cleanPath = filePath.replace(/^\/+/, '');
  const absolutePath = path.join(__dirname, '..', cleanPath);

  fs.unlink(absolutePath, (err) => {
    if (err) {
      console.error(`Error deleting file: ${filePath}`, err.message);
    } else {
      console.log(`Deleted file: ${filePath}`);
    }
  });
};

module.exports = deleteFile;
