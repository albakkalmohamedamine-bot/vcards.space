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
  dominant?: ColorSwatch | null;
  secondary?: ColorSwatch | null;
  accent?: ColorSwatch | null;
  deep?: ColorSwatch | null;
  allSwatches: ColorSwatch[];
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
  // Normalize parameters
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// Calculate perceived luminance for contrast verification
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Perceptual color distance metric
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8));
}

// Generate descriptive, human-friendly brand names based on HSL properties
function getDescriptiveColorName(h: number, s: number, l: number, rankIndex = 0): string {
  if (s < 0.08) {
    if (l < 0.2) return 'Midnight Black';
    if (l < 0.4) return 'Charcoal';
    if (l < 0.7) return 'Slate Gray';
    return 'Pearl Gray';
  }

  let hueName = '';
  if (h >= 345 || h < 12) hueName = 'Ruby Red';
  else if (h >= 12 && h < 38) {
    hueName = l < 0.4 ? 'Rich Bronze' : s > 0.6 ? 'Vibrant Orange' : 'Warm Amber';
  } else if (h >= 38 && h < 68) {
    hueName = l < 0.45 ? 'Antique Gold' : 'Golden Yellow';
  } else if (h >= 68 && h < 160) {
    hueName = l < 0.35 ? 'Deep Forest' : s > 0.6 ? 'Emerald Green' : 'Sage Green';
  } else if (h >= 160 && h < 195) {
    hueName = l < 0.35 ? 'Dark Teal' : 'Cyan Aqua';
  } else if (h >= 195 && h < 250) {
    hueName = l < 0.28 ? 'Royal Navy' : s > 0.6 ? 'Cobalt Blue' : 'Classic Blue';
  } else if (h >= 250 && h < 290) {
    hueName = l < 0.35 ? 'Deep Indigo' : 'Violet Purple';
  } else if (h >= 290 && h < 345) {
    hueName = l < 0.4 ? 'Plum Wine' : 'Magenta Rose';
  }

  if (rankIndex === 0) return `Primary ${hueName || 'Brand'}`;
  if (rankIndex === 1) return `Secondary ${hueName || 'Accent'}`;
  return hueName || `Accent ${rankIndex + 1}`;
}

// Extract comprehensive palette from logo image
export function extractColorsFromImage(imageSrc: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(getFallbackColors());
      return;
    }

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

        // 120x120 provides high fidelity while executing in <5ms
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        interface PixelCluster {
          r: number;
          g: number;
          b: number;
          count: number;
          s: number;
          l: number;
          h: number;
        }

        const rawPixels: Array<{ r: number; g: number; b: number; s: number; l: number; h: number }> = [];

        // Sample pixels, ignoring transparent or near-empty areas
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-transparent pixels
          if (a < 150) continue;

          const [h, s, l] = rgbToHsl(r, g, b);

          // Skip pure flat white canvas backgrounds (l > 0.96 with low saturation)
          if (l > 0.96 && s < 0.15) continue;
          // Skip pure black edges if saturation is 0 and lightness < 0.04
          if (l < 0.04 && s < 0.1) continue;

          rawPixels.push({ r, g, b, h, s, l });
        }

        if (rawPixels.length === 0) {
          resolve(getFallbackColors());
          return;
        }

        // Cluster colors using perceptual distance threshold
        const clusters: PixelCluster[] = [];
        const DISTANCE_THRESHOLD = 32; // Perceptual grouping radius

        for (const p of rawPixels) {
          let matched = false;
          for (const c of clusters) {
            const dist = colorDistance(p.r, p.g, p.b, c.r, c.g, c.b);
            if (dist < DISTANCE_THRESHOLD) {
              // Update running average
              c.r = (c.r * c.count + p.r) / (c.count + 1);
              c.g = (c.g * c.count + p.g) / (c.count + 1);
              c.b = (c.b * c.count + p.b) / (c.count + 1);
              c.count++;
              matched = true;
              break;
            }
          }

          if (!matched) {
            clusters.push({
              r: p.r,
              g: p.g,
              b: p.b,
              count: 1,
              h: p.h,
              s: p.s,
              l: p.l,
            });
          }
        }

        // Recompute accurate HSL and weights for each cluster
        clusters.forEach(c => {
          c.r = Math.round(c.r);
          c.g = Math.round(c.g);
          c.b = Math.round(c.b);
          const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
          c.h = h;
          c.s = s;
          c.l = l;
        });

        // Filter out low-frequency noise clusters (< 0.8% of pixels)
        const totalValidPixels = rawPixels.length;
        const validClusters = clusters
          .filter(c => c.count / totalValidPixels >= 0.008)
          .sort((a, b) => b.count - a.count);

        if (validClusters.length === 0) {
          resolve(getFallbackColors());
          return;
        }

        // Separate chromatic clusters from neutral grayscale
        const chromatic = validClusters.filter(c => c.s >= 0.12 && c.l >= 0.08 && c.l <= 0.92);
        const neutral = validClusters.filter(c => c.s < 0.12);

        const swatchesList: ColorSwatch[] = [];
        const seenHexes = new Set<string>();

        const addSwatch = (hex: string, name: string, isDark?: boolean) => {
          const cleanHex = hex.toUpperCase();
          if (seenHexes.has(cleanHex)) return;
          seenHexes.add(cleanHex);

          const r = parseInt(cleanHex.slice(1, 3), 16);
          const g = parseInt(cleanHex.slice(3, 5), 16);
          const b = parseInt(cleanHex.slice(5, 7), 16);
          const hsl = rgbToHsl(r, g, b);
          const dark = isDark !== undefined ? isDark : getLuminance(r, g, b) < 0.45;

          swatchesList.push({
            name,
            hex: cleanHex,
            hsl,
            isDark: dark,
          });
        };

        // 1. Add top chromatic clusters found directly in the logo
        chromatic.forEach((c, idx) => {
          const hex = rgbToHex(c.r, c.g, c.b);
          const label = getDescriptiveColorName(c.h, c.s, c.l, idx);
          addSwatch(hex, label);
        });

        // 2. Add prominent neutral cluster if present (e.g. Midnight Black, Charcoal, Slate)
        neutral.slice(0, 2).forEach((c, idx) => {
          const hex = rgbToHex(c.r, c.g, c.b);
          const label = c.l < 0.25 ? 'Deep Charcoal' : c.l < 0.5 ? 'Slate' : 'Silver Accent';
          addSwatch(hex, label);
        });

        // 3. Derive rich complementary and tailored brand harmonies from the primary logo color
        const primaryCandidate = chromatic[0] || validClusters[0];
        if (primaryCandidate) {
          const [pH, pS, pL] = [primaryCandidate.h, primaryCandidate.s, primaryCandidate.l];

          // A. Deep Theme Accent (Rich, professional dark variant for headers)
          const deepHex = hslToHex(pH, Math.min(1, pS * 1.1), Math.max(0.12, Math.min(0.25, pL * 0.5)));
          addSwatch(deepHex, 'Deep Shade');

          // B. Vibrant Accent (High chroma)
          const vibrantHex = hslToHex(pH, Math.max(0.75, pS), Math.max(0.42, Math.min(0.58, pL)));
          addSwatch(vibrantHex, 'Vibrant Accent');

          // C. Warm Gold / Amber Accent if suitable or Harmonic Analogous (+30 deg hue)
          const warmHex = hslToHex((pH + 30) % 360, Math.max(0.65, pS), 0.48);
          addSwatch(warmHex, 'Warm Harmony');

          // D. Elegant Indigo / Cool Blue Accent (-30 deg hue)
          const coolHex = hslToHex((pH - 30 + 360) % 360, Math.max(0.65, pS), 0.46);
          addSwatch(coolHex, 'Cool Harmony');

          // E. Muted Luxury Tone
          const mutedHex = hslToHex(pH, 0.24, 0.32);
          addSwatch(mutedHex, 'Muted Tone');
        }

        // Cap at top 8 unique, high-contrast swatches
        const finalSwatches = swatchesList.slice(0, 8);

        // Find standard slots for backward compatibility
        const vibrantSwatch = finalSwatches.find(s => s.hsl[1] >= 0.4 && s.hsl[2] >= 0.35 && s.hsl[2] <= 0.65) || finalSwatches[0] || null;
        const darkVibrantSwatch = finalSwatches.find(s => s.hsl[1] >= 0.4 && s.hsl[2] < 0.35) || null;
        const lightVibrantSwatch = finalSwatches.find(s => s.hsl[1] >= 0.4 && s.hsl[2] > 0.65) || null;
        const mutedSwatch = finalSwatches.find(s => s.hsl[1] < 0.4 && s.hsl[2] >= 0.25 && s.hsl[2] <= 0.65) || null;
        const darkMutedSwatch = finalSwatches.find(s => s.hsl[1] < 0.4 && s.hsl[2] < 0.25) || null;
        const lightMutedSwatch = finalSwatches.find(s => s.hsl[1] < 0.4 && s.hsl[2] > 0.65) || null;

        resolve({
          vibrant: vibrantSwatch,
          darkVibrant: darkVibrantSwatch,
          lightVibrant: lightVibrantSwatch,
          muted: mutedSwatch,
          darkMuted: darkMutedSwatch,
          lightMuted: lightMutedSwatch,
          dominant: finalSwatches[0] || null,
          secondary: finalSwatches[1] || null,
          accent: vibrantSwatch,
          deep: darkVibrantSwatch || darkMutedSwatch,
          allSwatches: finalSwatches,
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
  const defaults: ColorSwatch[] = [
    { name: 'Royal Navy', hex: '#1B2A4A', hsl: [222, 0.46, 0.2], isDark: true },
    { name: 'Rich Burgundy', hex: '#8B263E', hsl: [346, 0.57, 0.35], isDark: true },
    { name: 'Deep Forest', hex: '#2D5A27', hsl: [112, 0.39, 0.25], isDark: true },
    { name: 'Espresso Bronze', hex: '#4A3B32', hsl: [23, 0.2, 0.24], isDark: true },
    { name: 'Classic Sapphire', hex: '#0F4C81', hsl: [208, 0.79, 0.28], isDark: true },
    { name: 'Midnight Slate', hex: '#1A1A24', hsl: [240, 0.16, 0.12], isDark: true },
  ];

  return {
    vibrant: defaults[0],
    darkVibrant: defaults[5],
    lightVibrant: defaults[4],
    muted: defaults[3],
    darkMuted: defaults[2],
    lightMuted: defaults[1],
    dominant: defaults[0],
    secondary: defaults[1],
    allSwatches: defaults,
  };
}

// Select the "best-contrast" swatch among the extracted ones
export function getBestContrastSwatch(colors: ExtractedColors): ColorSwatch {
  if (colors.allSwatches && colors.allSwatches.length > 0) {
    // Prefer dominant or dark/vibrant brand swatch that provides high contrast
    const best = colors.allSwatches.find(s => s.isDark && s.hsl[1] >= 0.15) || colors.allSwatches[0];
    if (best) return best;
  }

  // Ordered preference list
  const preferences = [
    colors.dominant,
    colors.vibrant,
    colors.darkVibrant,
    colors.secondary,
    colors.muted,
    colors.darkMuted,
    colors.lightVibrant,
    colors.lightMuted,
  ];

  for (const swatch of preferences) {
    if (swatch) return swatch;
  }

  return { name: 'Royal Navy', hex: '#1B2A4A', hsl: [222, 0.46, 0.2], isDark: true };
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
