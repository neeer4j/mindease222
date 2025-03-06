const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

const sourceIcon = path.join(__dirname, '..', 'android', 'icons', 'icon.png');

async function copyAndResizeIcon() {
  try {
    for (const [density, size] of Object.entries(sizes)) {
      const targetDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
      const targetPath = path.join(targetDir, 'ic_launcher.png');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(targetPath);
      
      console.log(`Created icon for ${density}: ${size}x${size}`);
    }
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

copyAndResizeIcon(); 