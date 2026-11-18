const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const color = '#6366F1';

const outputDir = path.join(__dirname, 'src', 'assets');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Dollar sign
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.5}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', size / 2, size / 2);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `pwa-${size}x${size}.png`), buffer);
  console.log(`Generated ${size}x${size} icon`);
});

console.log('PWA icons generated successfully!');