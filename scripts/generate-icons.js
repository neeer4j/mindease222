const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
};

async function generateIcons() {
    const sourceImage = path.join(__dirname, '..', 'src', 'assets', 'mindease-icon.png');
    
    for (const [density, size] of Object.entries(sizes)) {
        const targetDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Generate regular icon
        await sharp(sourceImage)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 128, alpha: 1 } // Navy blue background
            })
            .toFile(path.join(targetDir, 'ic_launcher.png'));

        // Generate round icon
        await sharp(sourceImage)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 128, alpha: 1 } // Navy blue background
            })
            .toFile(path.join(targetDir, 'ic_launcher_round.png'));
            
        console.log(`Generated icons for ${density}: ${size}x${size}`);
    }
}

generateIcons().catch(console.error); 