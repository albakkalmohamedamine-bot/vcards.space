export interface ColorSwatch {
  name: string;
  hex: string;
  hsl: [number, number, number];
  isDark: boolean;
}

export interface ExtractedColors {
  vibrant: ColorSwatch | null;
  darkVibrant: ColorSwatch | null;
  lightVibrant: ColorSwatch | null;
  muted: ColorSwatch | null;
  darkMuted: ColorSwatch | null;
  lightMuted: ColorSwatch | null;
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h * 360, s, l];
}

// Convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// Calculate perceived brightness/luminance
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Extract colors from a base64 image string or URL
export function extractColorsFromImage(imageSrc: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(getFallbackColors());
          return;
        }

        // Scale down to analyze quickly
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCount: Record<string, { r: number; g: number; b: number; count: number }> = {};

        // Collect unique colors
        for (let i = 0; i < imgData.length; i += 16) { // step by 4 pixels (16 values) to speed up
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or highly white/black background pixels if any
          if (a < 200) continue;
          const brightness = (r + g + b) / 3;
          if (brightness > 245 || brightness < 10) continue;

          // Round to prevent too many unique colors
          const factor = 10;
          const rRound = Math.round(r / factor) * factor;
          const gRound = Math.round(g / factor) * factor;
          const bRound = Math.round(b / factor) * factor;
          const key = `${rRound},${gRound},${bRound}`;

          if (colorCount[key]) {
            colorCount[key].count++;
          } else {
            colorCount[key] = { r, g, b, count: 1 };
          }
        }

        const colors = Object.values(colorCount).sort((a, b) => b.count - a.count);

        if (colors.length === 0) {
          resolve(getFallbackColors());
          return;
        }

        // Map colors to their HSL values
        const mappedColors = colors.map(c => {
          const hsl = rgbToHsl(c.r, c.g, c.b);
          const hex = rgbToHex(c.r, c.g, c.b);
          const luminance = getLuminance(c.r, c.g, c.b);
          return {
            hex,
            hsl,
            isDark: luminance < 0.5,
            weight: c.count
          };
        });

        // Let's find the best candidate for each target
        const findBestMatch = (
          targetSat: number, minSat: number, maxSat: number,
          targetLit: number, minLit: number, maxLit: number
        ) => {
          let bestCandidate: typeof mappedColors[0] | null = null;
          let bestScore = -1;

          for (const c of mappedColors) {
            const [, s, l] = c.hsl;
            if (s >= minSat && s <= maxSat && l >= minLit && l <= maxLit) {
              // Score based on distance to target Saturation, Lightness, and the color weight/frequency
              const satDiff = Math.abs(s - targetSat);
              const litDiff = Math.abs(l - targetLit);
              const score = (1 - satDiff) * 3 + (1 - litDiff) * 3 + (c.weight / colors[0].count) * 4;
              if (score > bestScore) {
                bestScore = score;
                bestCandidate = c;
              }
            }
          }
          return bestCandidate;
        };

        // Vibrant: high sat, normal lightness
        const vibrantMatch = findBestMatch(0.8, 0.4, 1.0, 0.5, 0.35, 0.65);
        // Dark Vibrant: high sat, low lightness
        const darkVibrantMatch = findBestMatch(0.8, 0.4, 1.0, 0.25, 0.1, 0.35);
        // Light Vibrant: high sat, high lightness
        const lightVibrantMatch = findBestMatch(0.8, 0.4, 1.0, 0.75, 0.65, 0.9);
        // Muted: low sat, normal lightness
        const mutedMatch = findBestMatch(0.25, 0.05, 0.4, 0.5, 0.35, 0.65);
        // Dark Muted: low sat, low lightness
        const darkMutedMatch = findBestMatch(0.25, 0.05, 0.4, 0.25, 0.1, 0.35);
        // Light Muted: low sat, high lightness
        const lightMutedMatch = findBestMatch(0.25, 0.05, 0.4, 0.75, 0.65, 0.9);

        const formatSwatch = (match: typeof mappedColors[0] | null, name: string): ColorSwatch | null => {
          if (!match) return null;
          return {
            name,
            hex: match.hex,
            hsl: match.hsl,
            isDark: match.isDark
          };
        };

        resolve({
          vibrant: formatSwatch(vibrantMatch, 'Vibrant'),
          darkVibrant: formatSwatch(darkVibrantMatch, 'Dark Vibrant'),
          lightVibrant: formatSwatch(lightVibrantMatch, 'Light Vibrant'),
          muted: formatSwatch(mutedMatch, 'Muted'),
          darkMuted: formatSwatch(darkMutedMatch, 'Dark Muted'),
          lightMuted: formatSwatch(lightMutedMatch, 'Light Muted')
        });
      } catch (err) {
        console.error('Error processing image canvas:', err);
        resolve(getFallbackColors());
      }
    };

    img.onerror = () => {
      resolve(getFallbackColors());
    };

    img.src = imageSrc;
  });
}

// Fallback color palette
function getFallbackColors(): ExtractedColors {
  return {
    vibrant: { name: 'Vibrant', hex: '#1B2A4A', hsl: [222, 0.46, 0.2], isDark: true },
    darkVibrant: { name: 'Dark Vibrant', hex: '#0B1528', hsl: [220, 0.57, 0.1], isDark: true },
    lightVibrant: { name: 'Light Vibrant', hex: '#4464A1', hsl: [219, 0.45, 0.45], isDark: false },
    muted: { name: 'Muted', hex: '#4F6B5D', hsl: [153, 0.15, 0.36], isDark: true },
    darkMuted: { name: 'Dark Muted', hex: '#2C3A33', hsl: [152, 0.14, 0.2], isDark: true },
    lightMuted: { name: 'Light Muted', hex: '#A2BCAD', hsl: [147, 0.18, 0.69], isDark: false }
  };
}

// Select the "best-contrast" swatch among the extracted ones
// (Usually we want a readable/strong text/button brand color. Let's pick vibrant or darkVibrant, or whichever is present and has solid contrast)
export function getBestContrastSwatch(colors: ExtractedColors): ColorSwatch {
  // Ordered preference list
  const preferences = [
    colors.vibrant,
    colors.darkVibrant,
    colors.muted,
    colors.darkMuted,
    colors.lightVibrant,
    colors.lightMuted
  ];

  for (const swatch of preferences) {
    if (swatch) return swatch;
  }

  return { name: 'Default', hex: '#1B2A4A', hsl: [222, 0.46, 0.2], isDark: true };
}

// High-definition logo optimization for Retina / high-DPI displays (800x800 max HD)
export function compressLogoImage(imageSrc: string, maxWidth = 800, maxHeight = 800): Promise<string> {
  return new Promise((resolve) => {
    // If SVG vector format, return untouched to preserve infinite scalability
    if (imageSrc.startsWith('data:image/svg+xml') || imageSrc.endsWith('.svg')) {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Keep original if smaller than max dimensions
        if (width <= maxWidth && height <= maxHeight) {
          canvas.width = width;
          canvas.height = height;
        } else {
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
        }

        // Enable high-quality bicubic canvas image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas to ensure transparency is preserved
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP or PNG with high quality to preserve crisp edges & alpha channel
        try {
          try {
            const webpData = canvas.toDataURL('image/webp', 0.92);
            if (webpData.startsWith('data:image/webp')) {
              resolve(webpData);
              return;
            }
          } catch {
            // Fallback to PNG if WebP export fails
          }

          const pngData = canvas.toDataURL('image/png');
          resolve(pngData);
        } catch (exportErr) {
          console.warn('Canvas export failed (possibly tainted canvas):', exportErr);
          resolve(imageSrc);
        }
      } catch (err) {
        console.error('Error optimizing logo image:', err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => {
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
}
