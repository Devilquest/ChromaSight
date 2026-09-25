const STORAGE_KEY = "chromasight_recent_swatches";
export const MAX_SWATCHES = 8;

let toastTimer = null;

//=============================================
// FEEDBACK & NOTIFICATIONS
//=============================================
/**
 * Triggers subtle device haptic feedback if supported by the browser.
 * @param {number} [duration=15] - Duration of vibration in milliseconds.
 */
export function triggerHaptic(duration = 15) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(duration);
    } catch {
    }
  }
}

/**
 * Displays a non-intrusive floating toast notification.
 * @param {string} message - Message to display.
 * @param {number} [duration=2000] - Duration in milliseconds before hiding.
 */
export function showToast(message, duration = 2000) {
  const toastElement = document.getElementById("toast");
  const messageElement = document.getElementById("toast-message");
  if (!toastElement || !messageElement) return;

  messageElement.textContent = message;
  toastElement.classList.add("visible");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toastElement.classList.remove("visible");
    toastTimer = null;
  }, duration);
}

/**
 * Copies a given text string to the system clipboard and triggers toast feedback.
 * @param {string} text - Text to copy.
 * @param {string} [feedbackMsg="Copied to clipboard"] - Toast notification message.
 * @returns {Promise<boolean>} Success status.
 */
export async function copyToClipboard(text, feedbackMsg = "Copied to clipboard") {
  try {
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.className = "clipboard-helper";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    triggerHaptic(20);
    showToast(feedbackMsg);
    return true;
  } catch {
    showToast("Failed to copy");
    return false;
  }
}

//=============================================
// PALETTE STORAGE & RENDERING
//=============================================
/**
 * Retrieves saved color swatches from localStorage.
 * @returns {Array<{ hex: string, rgb: string, hsl: string, name: string, timestamp: number }>} Saved colors array.
 */
export function getSavedSwatches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a color capture into the localStorage palette.
 * @param {{ hex: string, rgb: string, hsl: string, name: string }} color - Color data to save.
 * @returns {Array<{ hex: string, rgb: string, hsl: string, name: string, timestamp: number }>} Updated swatches list.
 */
export function saveColorToPalette(color) {
  const swatches = getSavedSwatches();
  const existingIndex = swatches.findIndex(s => s.hex.toLowerCase() === color.hex.toLowerCase());
  
  if (existingIndex !== -1) {
    swatches.splice(existingIndex, 1);
  }

  swatches.unshift({
    hex: color.hex,
    rgb: color.rgb,
    hsl: color.hsl,
    name: color.name,
    timestamp: Date.now()
  });

  if (swatches.length > MAX_SWATCHES) {
    swatches.length = MAX_SWATCHES;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(swatches));
  } catch {
  }

  return swatches;
}

/**
 * Clears all saved colors from localStorage.
 */
export function clearPalette() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

/**
 * Renders the saved swatches in the bottom palette tray.
 * @param {HTMLElement} paletteTray - Swatches container DOM element.
 * @param {HTMLElement} paletteSection - Section wrapper element to toggle visibility.
 * @param {Function} [onSelectColor] - Callback invoked when a swatch is clicked.
 */
export function renderRecentPalette(paletteTray, paletteSection, onSelectColor) {
  if (!paletteTray) return;
  const swatches = getSavedSwatches();
  paletteTray.innerHTML = "";

  if (swatches.length === 0) {
    if (paletteSection) {
      paletteSection.classList.add("hidden");
      paletteSection.setAttribute("aria-hidden", "true");
    }
    return;
  }

  if (paletteSection) {
    paletteSection.classList.remove("hidden");
    paletteSection.setAttribute("aria-hidden", "false");
  }

  swatches.forEach(swatch => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch-item";
    btn.style.setProperty("--swatch-color", swatch.hex);
    btn.title = `${swatch.name} (${swatch.hex})`;
    btn.setAttribute("aria-label", `Select color ${swatch.hex}`);

    btn.addEventListener("click", () => {
      triggerHaptic(15);
      if (typeof onSelectColor === "function") {
        onSelectColor(swatch);
      }
    });

    paletteTray.appendChild(btn);
  });
}
