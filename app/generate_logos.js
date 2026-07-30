const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Target public directory:', publicDir);

// Navy color from user spec: #25394d
const NAVY = '#25394d';

// SVG 1: Main Navy Logo (Transparent Background, Navy #25394d)
const svgMainLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="400" height="440">
  <path fill="${NAVY}" d="M 142 22 C 85 20 18 60 2 110 C 42 78 82 62 116 92 C 162 132 174 220 176 376 C 177 394 184 414 198 418 C 210 422 222 408 232 392 C 286 312 344 198 392 82 C 404 52 406 28 382 22 C 360 16 338 32 322 56 C 280 120 236 194 198 272 C 190 206 176 108 142 22 Z"/>
</svg>`;

// SVG 2: Home Screen / App Icon (Solid Navy background #25394d, White V Logo centered)
const svgAppIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="0" fill="${NAVY}"/>
  <g transform="translate(106, 81) scale(0.72)">
    <path fill="#FFFFFF" d="M 142 22 C 85 20 18 60 2 110 C 42 78 82 62 116 92 C 162 132 174 220 176 376 C 177 394 184 414 198 418 C 210 422 222 408 232 392 C 286 312 344 198 392 82 C 404 52 406 28 382 22 C 360 16 338 32 322 56 C 280 120 236 194 198 272 C 190 206 176 108 142 22 Z"/>
  </g>
</svg>`;

// SVG 3: Favicon (Navy #25394d, transparent background)
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="32" height="32">
  <path fill="${NAVY}" d="M 142 22 C 85 20 18 60 2 110 C 42 78 82 62 116 92 C 162 132 174 220 176 376 C 177 394 184 414 198 418 C 210 422 222 408 232 392 C 286 312 344 198 392 82 C 404 52 406 28 382 22 C 360 16 338 32 322 56 C 280 120 236 194 198 272 C 190 206 176 108 142 22 Z"/>
</svg>`;

async function generateAssets() {
  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgMainLogo);
  fs.writeFileSync(path.join(publicDir, 'logo-navy.svg'), svgMainLogo);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon);
  fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), svgAppIcon);

  // Generate PNGs using sharp
  // 1. Favicons
  await sharp(Buffer.from(svgFavicon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(Buffer.from(svgFavicon))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  await sharp(Buffer.from(svgFavicon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // 2. App Icons / PWA icons (Solid navy background with white logo)
  await sharp(Buffer.from(svgAppIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(svgAppIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(Buffer.from(svgAppIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 3. Main Navy Logo PNG
  await sharp(Buffer.from(svgMainLogo))
    .resize(400, 440)
    .png()
    .toFile(path.join(publicDir, 'logo-navy.png'));

  console.log('All logo and icon assets generated successfully in:', publicDir);
}

generateAssets().catch(err => {
  console.error('Error generating logo assets:', err);
  process.exit(1);
});
