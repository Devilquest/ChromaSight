import { samplePixelColor, rgbToHsl } from "./color-engine.js";
import { copyToClipboard, saveColorToPalette, renderRecentPalette, clearPalette, triggerHaptic, showToast } from "./palette.js";
import { startCamera, toggleTorch, switchCameraFacing, setupMockCanvasFallback, removeMockCanvasFallback } from "./camera.js";
import { getReticlePosition, recenterReticle, getFrameCoordinates, bindReticleInteractions } from "./reticle.js";
import { getCalibrationGains, bindCalibrationEvents } from "./calibration.js";

//=============================================
// DOM REFERENCES & STATE
//=============================================
const videoElement = document.getElementById("camera-stream");
const samplerCanvas = document.getElementById("hidden-sampler-canvas");
const samplerCtx = samplerCanvas.getContext("2d", { willReadFrequently: true });
const viewfinderElement = document.getElementById("viewfinder");
const cameraFallbackElement = document.getElementById("camera-fallback");
const requestCameraBtn = document.getElementById("btn-request-camera");
const dismissFallbackBtn = document.getElementById("btn-dismiss-fallback");

const colorNameLabel = document.getElementById("color-name-label");
const colorHexValue = document.getElementById("color-hex-value");
const colorRgbValue = document.getElementById("color-rgb-value");
const colorHslValue = document.getElementById("color-hsl-value");
const freezeBadge = document.getElementById("freeze-badge");
const reticleElement = document.getElementById("reticle");
const btnRecenter = document.getElementById("btn-recenter");

const freezeBtn = document.getElementById("btn-freeze");
const copyHexChip = document.getElementById("btn-copy-hex-chip");
const cellRgb = document.getElementById("cell-rgb");
const cellHsl = document.getElementById("cell-hsl");

const copyTimeouts = { hex: null, rgb: null, hsl: null };

const btnTorch = document.getElementById("btn-torch");
const btnFlip = document.getElementById("btn-flip");

const btnSamplePoint = document.getElementById("btn-sample-point");
const btnSampleSmooth = document.getElementById("btn-sample-smooth");
const btnInfo = document.getElementById("btn-info");
const infoModalBackdrop = document.getElementById("info-modal-backdrop");
const btnCloseInfo = document.getElementById("btn-close-info");
const paletteSection = document.getElementById("palette-section");
const paletteTray = document.getElementById("palette-tray");
const btnClearPalette = document.getElementById("btn-clear-palette");

let isFrozen = false;
let sampleSize = 1;
let animationFrameId = null;

let currentColorData = {
  r: 59,
  g: 130,
  b: 246,
  hex: "#3B82F6",
  rgb: "59, 130, 246",
  hsl: "217°, 91%, 60%",
  name: "Royal Blue"
};

//=============================================
// COLOR SAMPLING & TELEMETRY
//=============================================
/**
 * Updates the UI elements and CSS custom properties with the latest color data.
 * @param {{ r: number, g: number, b: number, hex: string, hsl: { h: number, s: number, l: number, formatted: string }, name: string }} data - Color information.
 */
function updateColorDisplay(data) {
  currentColorData = {
    r: data.r,
    g: data.g,
    b: data.b,
    hex: data.hex,
    rgb: `${data.r}, ${data.g}, ${data.b}`,
    hsl: `${data.hsl.h}°, ${data.hsl.s}%, ${data.hsl.l}%`,
    name: data.name
  };

  document.documentElement.style.setProperty("--live-color", data.hex);

  colorHexValue.textContent = data.hex;
  colorNameLabel.textContent = data.name;
  colorRgbValue.textContent = currentColorData.rgb;
  colorHslValue.textContent = currentColorData.hsl;
}

/**
 * Samples the color at the current reticle position from the active source.
 */
function sampleCurrentFrame() {
  const gains = getCalibrationGains();
  const fallbackCanvas = document.getElementById("fallback-interactive-canvas");
  if (fallbackCanvas && !videoElement.srcObject) {
    const ctx = fallbackCanvas.getContext("2d");
    if (ctx) {
      const pos = getReticlePosition();
      const x = Math.max(0, Math.min(fallbackCanvas.width - 1, Math.floor(pos.x * fallbackCanvas.width)));
      const y = Math.max(0, Math.min(fallbackCanvas.height - 1, Math.floor(pos.y * fallbackCanvas.height)));
      const sampled = samplePixelColor(ctx, x, y, sampleSize, gains);
      updateColorDisplay(sampled);
    }
    return;
  }

  const { frameX, frameY } = getFrameCoordinates(viewfinderElement, samplerCanvas, videoElement);
  const sampled = samplePixelColor(samplerCtx, frameX, frameY, sampleSize, gains);
  updateColorDisplay(sampled);
}

/**
 * Obtains uncalibrated raw color under the reticle for white balance calibration.
 * @returns {{ r: number, g: number, b: number }|null} Raw sampled color.
 */
function getRawTargetColor() {
  const fallbackCanvas = document.getElementById("fallback-interactive-canvas");
  if (fallbackCanvas && !videoElement.srcObject) {
    const ctx = fallbackCanvas.getContext("2d");
    if (ctx) {
      const pos = getReticlePosition();
      const x = Math.max(0, Math.min(fallbackCanvas.width - 1, Math.floor(pos.x * fallbackCanvas.width)));
      const y = Math.max(0, Math.min(fallbackCanvas.height - 1, Math.floor(pos.y * fallbackCanvas.height)));
      return samplePixelColor(ctx, x, y, sampleSize, null);
    }
  }

  const { frameX, frameY } = getFrameCoordinates(viewfinderElement, samplerCanvas, videoElement);
  return samplePixelColor(samplerCtx, frameX, frameY, sampleSize, null);
}

/**
 * Continuous frame loop that samples the reticle pixel from the active video stream.
 */
function processVideoFrame() {
  if (isFrozen) return;

  if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    if (samplerCanvas.width !== videoElement.videoWidth || samplerCanvas.height !== videoElement.videoHeight) {
      samplerCanvas.width = videoElement.videoWidth;
      samplerCanvas.height = videoElement.videoHeight;
    }

    samplerCtx.drawImage(videoElement, 0, 0, samplerCanvas.width, samplerCanvas.height);
    sampleCurrentFrame();
  }

  animationFrameId = requestAnimationFrame(processVideoFrame);
}

/**
 * Callback triggered when camera stream successfully starts playback.
 */
function onCameraStreamStarted() {
  removeMockCanvasFallback();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  isFrozen = false;
  freezeBadge.hidden = true;
  freezeBtn.classList.remove("frozen");
  if (reticleElement) {
    reticleElement.hidden = false;
  }
  animationFrameId = requestAnimationFrame(processVideoFrame);
}

/**
 * Callback triggered when camera access fails or is denied.
 */
function onCameraStreamError() {
  if (reticleElement) {
    reticleElement.hidden = true;
  }
  if (btnRecenter) {
    btnRecenter.classList.remove("visible");
  }
  setupMockCanvasFallback(viewfinderElement, sampleCurrentFrame);
}

/**
 * Starts the video stream and launches the continuous sampling loop.
 */
function startLiveCamera() {
  if (reticleElement) {
    reticleElement.hidden = true;
  }
  startCamera(
    videoElement,
    cameraFallbackElement,
    btnTorch,
    onCameraStreamStarted,
    onCameraStreamError
  );
}

//=============================================
// USER INTERACTIONS & ACTIONS
//=============================================
/**
 * Freezes or resumes the camera frame feed.
 */
function toggleFreeze() {
  triggerHaptic(25);
  isFrozen = !isFrozen;

  if (isFrozen) {
    videoElement.pause();
    freezeBadge.hidden = false;
    freezeBtn.classList.add("frozen");
    showToast("Image frozen");
  } else {
    videoElement.play();
    freezeBadge.hidden = true;
    freezeBtn.classList.remove("frozen");
    recenterReticle(reticleElement, btnRecenter, sampleCurrentFrame);
    showToast("Scanner resumed");
    animationFrameId = requestAnimationFrame(processVideoFrame);
  }
}

/**
 * Refreshes the recent captures tray UI.
 */
function refreshPaletteTray() {
  renderRecentPalette(paletteTray, paletteSection, swatch => {
    const rgbNumbers = swatch.rgb.split(",").map(n => parseInt(n.trim(), 10));
    updateColorDisplay({
      r: rgbNumbers[0] || 0,
      g: rgbNumbers[1] || 0,
      b: rgbNumbers[2] || 0,
      hex: swatch.hex,
      hsl: rgbToHsl(rgbNumbers[0] || 0, rgbNumbers[1] || 0, rgbNumbers[2] || 0),
      name: swatch.name
    });
    copyToClipboard(swatch.hex, `Copied ${swatch.hex}`);
  });
}

/**
 * Copies the current color in the desired format to clipboard.
 * @param {"hex"|"rgb"|"hsl"} format - Color string format.
 */
async function handleCopy(format = "hex") {
  let text = currentColorData.hex;
  let label = "HEX";
  let targetElement = copyHexChip;

  if (format === "rgb") {
    text = `rgb(${currentColorData.rgb})`;
    label = "RGB";
    targetElement = cellRgb;
  } else if (format === "hsl") {
    text = `hsl(${currentColorData.hsl})`;
    label = "HSL";
    targetElement = cellHsl;
  }

  const success = await copyToClipboard(text, `${label} copied to clipboard`);
  if (success && targetElement) {
    targetElement.classList.add("copied");

    if (copyTimeouts[format]) {
      clearTimeout(copyTimeouts[format]);
    }

    copyTimeouts[format] = setTimeout(() => {
      targetElement.classList.remove("copied");
      copyTimeouts[format] = null;
    }, 1500);

    saveColorToPalette(currentColorData);
    refreshPaletteTray();
  }
}

/**
 * Sets the sampling radius between exact point (1px) and smooth average (5px).
 * @param {number} size - Sample dimension in pixels.
 */
function setSamplingMode(size) {
  if (sampleSize === size) return;
  sampleSize = size;
  triggerHaptic(15);

  if (size === 1) {
    btnSamplePoint.classList.add("active");
    btnSampleSmooth.classList.remove("active");
    showToast("Sampling mode: Point (1px)");
  } else {
    btnSampleSmooth.classList.add("active");
    btnSamplePoint.classList.remove("active");
    showToast("Sampling mode: Smooth (5px)");
  }
}

//=============================================
// INITIALIZATION & EVENT BINDINGS
//=============================================
/**
 * Attaches all event listeners for user interactions.
 */
function bindEventListeners() {
  freezeBtn.addEventListener("click", toggleFreeze);
  copyHexChip.addEventListener("click", () => handleCopy("hex"));
  cellRgb.addEventListener("click", () => handleCopy("rgb"));
  cellHsl.addEventListener("click", () => handleCopy("hsl"));

  btnTorch.addEventListener("click", () => toggleTorch(btnTorch));
  btnFlip.addEventListener("click", () => {
    switchCameraFacing(
      videoElement,
      cameraFallbackElement,
      btnTorch,
      onCameraStreamStarted,
      onCameraStreamError
    );
  });

  bindReticleInteractions(viewfinderElement, reticleElement, btnRecenter, sampleCurrentFrame);
  bindCalibrationEvents({ onCalibrationChanged: sampleCurrentFrame, getRawTargetColor });

  btnSamplePoint.addEventListener("click", () => setSamplingMode(1));
  btnSampleSmooth.addEventListener("click", () => setSamplingMode(5));

  if (btnInfo && infoModalBackdrop) {
    btnInfo.addEventListener("click", () => {
      const isOpening = infoModalBackdrop.hidden;
      infoModalBackdrop.hidden = !isOpening;
      btnInfo.setAttribute("aria-expanded", String(isOpening));
      btnInfo.classList.toggle("active", isOpening);
    });
  }

  if (btnCloseInfo && infoModalBackdrop) {
    btnCloseInfo.addEventListener("click", () => {
      infoModalBackdrop.hidden = true;
      if (btnInfo) {
        btnInfo.setAttribute("aria-expanded", "false");
        btnInfo.classList.remove("active");
      }
    });
  }

  if (infoModalBackdrop) {
    infoModalBackdrop.addEventListener("click", e => {
      if (e.target === infoModalBackdrop) {
        infoModalBackdrop.hidden = true;
        if (btnInfo) {
          btnInfo.setAttribute("aria-expanded", "false");
          btnInfo.classList.remove("active");
        }
      }
    });
  }

  btnClearPalette.addEventListener("click", () => {
    clearPalette();
    refreshPaletteTray();
    showToast("History cleared");
  });

  if (requestCameraBtn) {
    requestCameraBtn.addEventListener("click", startLiveCamera);
  }

  if (dismissFallbackBtn) {
    dismissFallbackBtn.addEventListener("click", () => {
      cameraFallbackElement.hidden = true;
      if (reticleElement) {
        reticleElement.hidden = false;
      }
      sampleCurrentFrame();
      showToast("Demo palette active");
    });
  }
}

/**
 * Application boot sequence.
 */
export function initializeApp() {
  bindEventListeners();
  refreshPaletteTray();
  startLiveCamera();
}

document.addEventListener("DOMContentLoaded", initializeApp);
