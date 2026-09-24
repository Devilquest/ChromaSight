//=============================================
// COLOR DICTIONARIES
//=============================================

const RAW_W3C_WEB_COLORS = [
  { name: "Alice Blue", hex: "#F0F8FF" },
  { name: "Antique White", hex: "#FAEBD7" },
  { name: "Aqua / Cyan", hex: "#00FFFF" },
  { name: "Aquamarine", hex: "#7FFFD4" },
  { name: "Azure", hex: "#F0FFFF" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Bisque", hex: "#FFE4C4" },
  { name: "Black", hex: "#000000" },
  { name: "Blanched Almond", hex: "#FFEBCD" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Blue Violet", hex: "#8A2BE2" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Burlywood", hex: "#DEB887" },
  { name: "Cadet Blue", hex: "#5F9EA0" },
  { name: "Chartreuse", hex: "#7FFF00" },
  { name: "Chocolate", hex: "#D2691E" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Cornflower Blue", hex: "#6495ED" },
  { name: "Cornsilk", hex: "#FFF8DC" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Dark Blue", hex: "#00008B" },
  { name: "Dark Cyan", hex: "#008B8B" },
  { name: "Dark Goldenrod", hex: "#B8860B" },
  { name: "Dark Gray", hex: "#A9A9A9" },
  { name: "Dark Green", hex: "#006400" },
  { name: "Dark Khaki", hex: "#BDB76B" },
  { name: "Dark Magenta", hex: "#8B008B" },
  { name: "Dark Olive Green", hex: "#556B2F" },
  { name: "Dark Orange", hex: "#FF8C00" },
  { name: "Dark Orchid", hex: "#9932CC" },
  { name: "Dark Red", hex: "#8B0000" },
  { name: "Dark Salmon", hex: "#E9967A" },
  { name: "Dark Sea Green", hex: "#8FBC8F" },
  { name: "Dark Slate Blue", hex: "#483D8B" },
  { name: "Dark Slate Gray", hex: "#2F4F4F" },
  { name: "Dark Turquoise", hex: "#00CED1" },
  { name: "Dark Violet", hex: "#9400D3" },
  { name: "Deep Pink", hex: "#FF1493" },
  { name: "Deep Sky Blue", hex: "#00BFFF" },
  { name: "Dim Gray", hex: "#696969" },
  { name: "Dodger Blue", hex: "#1E90FF" },
  { name: "Firebrick", hex: "#B22222" },
  { name: "Floral White", hex: "#FFFAF0" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Fuchsia / Magenta", hex: "#FF00FF" },
  { name: "Gainsboro", hex: "#DCDCDC" },
  { name: "Ghost White", hex: "#F8F8FF" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Goldenrod", hex: "#DAA520" },
  { name: "Gray", hex: "#808080" },
  { name: "Green", hex: "#008000" },
  { name: "Green Yellow", hex: "#ADFF2F" },
  { name: "Honeydew", hex: "#F0FFF0" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Indian Red", hex: "#CD5C5C" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Khaki", hex: "#F0E68C" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Lavender Blush", hex: "#FFF0F5" },
  { name: "Lawn Green", hex: "#7CFC00" },
  { name: "Lemon Chiffon", hex: "#FFFACD" },
  { name: "Light Blue", hex: "#ADD8E6" },
  { name: "Light Coral", hex: "#F08080" },
  { name: "Light Cyan", hex: "#E0FFFF" },
  { name: "Light Goldenrod Yellow", hex: "#FAFAD2" },
  { name: "Light Gray", hex: "#D3D3D3" },
  { name: "Light Green", hex: "#90EE90" },
  { name: "Light Pink", hex: "#FFB6C1" },
  { name: "Light Salmon", hex: "#FFA07A" },
  { name: "Light Sea Green", hex: "#20B2AA" },
  { name: "Light Sky Blue", hex: "#87CEFA" },
  { name: "Light Slate Gray", hex: "#778899" },
  { name: "Light Steel Blue", hex: "#B0C4DE" },
  { name: "Light Yellow", hex: "#FFFFE0" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Lime Green", hex: "#32CD32" },
  { name: "Linen", hex: "#FAF0E6" },
  { name: "Maroon", hex: "#800000" },
  { name: "Medium Aquamarine", hex: "#66CDAA" },
  { name: "Medium Blue", hex: "#0000CD" },
  { name: "Medium Orchid", hex: "#BA55D3" },
  { name: "Medium Purple", hex: "#9370DB" },
  { name: "Medium Sea Green", hex: "#3CB371" },
  { name: "Medium Slate Blue", hex: "#7B68EE" },
  { name: "Medium Spring Green", hex: "#00FA9A" },
  { name: "Medium Turquoise", hex: "#48D1CC" },
  { name: "Medium Violet Red", hex: "#C71585" },
  { name: "Midnight Blue", hex: "#191970" },
  { name: "Mint Cream", hex: "#F5FFFA" },
  { name: "Misty Rose", hex: "#FFE4E1" },
  { name: "Moccasin", hex: "#FFE4B5" },
  { name: "Navajo White", hex: "#FFDEAD" },
  { name: "Navy", hex: "#000080" },
  { name: "Old Lace", hex: "#FDF5E6" },
  { name: "Olive", hex: "#808000" },
  { name: "Olive Drab", hex: "#6B8E23" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Orange Red", hex: "#FF4500" },
  { name: "Orchid", hex: "#DA70D6" },
  { name: "Pale Goldenrod", hex: "#EEE8AA" },
  { name: "Pale Green", hex: "#98FB98" },
  { name: "Pale Turquoise", hex: "#AFEEEE" },
  { name: "Pale Violet Red", hex: "#DB7093" },
  { name: "Papaya Whip", hex: "#FFEFD5" },
  { name: "Peach Puff", hex: "#FFDAB9" },
  { name: "Peru", hex: "#CD853F" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Plum", hex: "#DDA0DD" },
  { name: "Powder Blue", hex: "#B0E0E6" },
  { name: "Purple", hex: "#800080" },
  { name: "Rebecca Purple", hex: "#663399" },
  { name: "Red", hex: "#FF0000" },
  { name: "Rosy Brown", hex: "#BC8F8F" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Saddle Brown", hex: "#8B4513" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Sandy Brown", hex: "#F4A460" },
  { name: "Sea Green", hex: "#2E8B57" },
  { name: "Seashell", hex: "#FFF5EE" },
  { name: "Sienna", hex: "#A0522D" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Slate Blue", hex: "#6A5ACD" },
  { name: "Slate Gray", hex: "#708090" },
  { name: "Snow", hex: "#FFFAFA" },
  { name: "Spring Green", hex: "#00FF7F" },
  { name: "Steel Blue", hex: "#4682B4" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Teal", hex: "#008080" },
  { name: "Thistle", hex: "#D8BFD8" },
  { name: "Tomato", hex: "#FF6347" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Violet", hex: "#EE82EE" },
  { name: "Wheat", hex: "#F5DEB3" },
  { name: "White", hex: "#FFFFFF" },
  { name: "White Smoke", hex: "#F5F5F5" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Yellow Green", hex: "#9ACD32" }
];

const RAW_CURATED_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "Charcoal", hex: "#222222" },
  { name: "Slate Gray", hex: "#708090" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Snow", hex: "#FFFAFA" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Scarlet", hex: "#FF2400" },
  { name: "Ruby Red", hex: "#9B111E" },
  { name: "Firebrick", hex: "#B22222" },
  { name: "Brick Red", hex: "#CB4154" },
  { name: "Red", hex: "#FF0000" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Maroon", hex: "#800000" },
  { name: "Carmine", hex: "#960018" },
  { name: "Rose", hex: "#FF007F" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Tomato", hex: "#FF6347" },
  { name: "Terracotta", hex: "#E2725B" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Copper", hex: "#B87333" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Tangerine", hex: "#F28500" },
  { name: "Apricot", hex: "#FBCEB1" },
  { name: "Amber", hex: "#FFBF00" },
  { name: "Ochre", hex: "#CC7722" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Mustard Yellow", hex: "#E1AD01" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Lemon", hex: "#FFF700" },
  { name: "Khaki", hex: "#F0E68C" },
  { name: "Olive", hex: "#808000" },
  { name: "Army Green", hex: "#4B5320" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Emerald", hex: "#50C878" },
  { name: "Jade", hex: "#00A86B" },
  { name: "Green", hex: "#008000" },
  { name: "Lime Green", hex: "#32CD32" },
  { name: "Chartreuse", hex: "#7FFF00" },
  { name: "Mint", hex: "#3EB489" },
  { name: "Sage", hex: "#9DC183" },
  { name: "Seafoam", hex: "#93E9BE" },
  { name: "Teal", hex: "#008080" },
  { name: "Dark Cyan", hex: "#008B8B" },
  { name: "Aqua / Cyan", hex: "#00FFFF" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Baby Blue", hex: "#89CFF0" },
  { name: "Cerulean", hex: "#007BA7" },
  { name: "Cobalt Blue", hex: "#0047AB" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Midnight Blue", hex: "#191970" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Violet", hex: "#8F00FF" },
  { name: "Purple", hex: "#800080" },
  { name: "Plum", hex: "#DDA0DD" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Lilac", hex: "#C8A2C8" },
  { name: "Fuchsia / Magenta", hex: "#FF00FF" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Blush Pink", hex: "#FFD1DC" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Taupe", hex: "#483C32" },
  { name: "Espresso", hex: "#4B3621" },
  { name: "Chocolate Brown", hex: "#7B3F00" },
  { name: "Sienna", hex: "#A0522D" },
  { name: "Warm Gray", hex: "#808069" },
  { name: "Cool Gray", hex: "#8C92AC" }
];

const W3C_WEB_COLORS = RAW_W3C_WEB_COLORS.map(item => {
  const num = parseInt(item.hex.replace("#", ""), 16);
  return {
    name: item.name,
    hex: item.hex,
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
});

const CURATED_COLOR_NAMES = RAW_CURATED_COLORS.map(item => {
  const num = parseInt(item.hex.replace("#", ""), 16);
  return {
    name: item.name,
    hex: item.hex,
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
});

const WEB_COLOR_TOLERANCE_SQ = 650;

//=============================================
// COLOR CONVERSION UTILITIES
//=============================================

/**
 * Converts a component value to a 2-digit uppercase hexadecimal string.
 * @param {number} c - Color channel value (0-255).
 * @returns {string} 2-digit hexadecimal string.
 */
function componentToHex(c) {
  const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16).toUpperCase();
  return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Converts RGB numbers to 6-digit hex color string.
 * @param {number} r - Red channel (0-255).
 * @param {number} g - Green channel (0-255).
 * @param {number} b - Blue channel (0-255).
 * @returns {string} Hex color string (e.g., "#FF0000").
 */
export function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

/**
 * Converts RGB values to HSL format.
 * @param {number} r - Red channel (0-255).
 * @param {number} g - Green channel (0-255).
 * @param {number} b - Blue channel (0-255).
 * @returns {{ h: number, s: number, l: number, formatted: string }} HSL representation.
 */
export function rgbToHsl(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return {
    h: hDeg,
    s: sPct,
    l: lPct,
    formatted: `hsl(${hDeg}, ${sPct}%, ${lPct}%)`
  };
}

/**
 * Converts a hex string into an RGB object.
 * @param {string} hex - Hex color string (#RRGGBB).
 * @returns {{ r: number, g: number, b: number }} RGB color object.
 */
export function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

//=============================================
// COLOR MATCHING & SAMPLING
//=============================================

/**
 * Finds the closest color name using a two-tier resolution strategy.
 * Prioritizes official W3C web standard colors when within tolerance,
 * falling back to curated designer color names for intermediate hues.
 * @param {number} r - Red channel (0-255).
 * @param {number} g - Green channel (0-255).
 * @param {number} b - Blue channel (0-255).
 * @returns {string} Nearest English color name.
 */
export function getClosestColorName(r, g, b) {
  let minWebDistance = Infinity;
  let matchedWebName = null;

  for (let i = 0; i < W3C_WEB_COLORS.length; i++) {
    const item = W3C_WEB_COLORS[i];
    const rDiff = r - item.r;
    const gDiff = g - item.g;
    const bDiff = b - item.b;
    const dist = 2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff;

    if (dist < minWebDistance) {
      minWebDistance = dist;
      matchedWebName = item.name;
      if (dist === 0) break;
    }
  }

  if (minWebDistance <= WEB_COLOR_TOLERANCE_SQ && matchedWebName) {
    return matchedWebName;
  }

  let minCuratedDistance = Infinity;
  let matchedCuratedName = "Unknown";

  for (let i = 0; i < CURATED_COLOR_NAMES.length; i++) {
    const item = CURATED_COLOR_NAMES[i];
    const rDiff = r - item.r;
    const gDiff = g - item.g;
    const bDiff = b - item.b;
    const dist = 2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff;

    if (dist < minCuratedDistance) {
      minCuratedDistance = dist;
      matchedCuratedName = item.name;
      if (dist === 0) break;
    }
  }

  return matchedCuratedName;
}

/**
 * Samples pixel data from a canvas 2D context around a specified coordinate.
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
 * @param {number} centerX - Horizontal center coordinate.
 * @param {number} centerY - Vertical center coordinate.
 * @param {number} [sampleSize=1] - Pixel sample width and height (odd number e.g. 1 or 5).
 * @returns {{ r: number, g: number, b: number, hex: string, hsl: { h: number, s: number, l: number, formatted: string }, name: string }} Sampled color metrics.
 */
export function samplePixelColor(ctx, centerX, centerY, sampleSize = 1) {
  const half = Math.floor(sampleSize / 2);
  const startX = Math.max(0, Math.floor(centerX - half));
  const startY = Math.max(0, Math.floor(centerY - half));
  
  const imageData = ctx.getImageData(startX, startY, sampleSize, sampleSize);
  const data = imageData.data;
  const pixelCount = data.length / 4;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  const r = Math.round(totalR / pixelCount);
  const g = Math.round(totalG / pixelCount);
  const b = Math.round(totalB / pixelCount);

  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const name = getClosestColorName(r, g, b);

  return { r, g, b, hex, hsl, name };
}
