import { samplePixelColor, rgbToHex, rgbToHsl, getClosestColorName } from "./color-engine.js?v=1.0.1";
import { copyToClipboard, saveColorToPalette, getSavedSwatches, clearPalette, triggerHaptic, showToast } from "./palette.js?v=1.0.1";

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
const freezeBtnLabel = document.getElementById("freeze-btn-label");
const copyHexChip = document.getElementById("btn-copy-hex-chip");
const cellRgb = document.getElementById("cell-rgb");
const cellHsl = document.getElementById("cell-hsl");

const copyTimeouts = {
  hex: null,
  rgb: null,
  hsl: null
};

const btnTorch = document.getElementById("btn-torch");
const btnFlip = document.getElementById("btn-flip");
const btnWbToggle = document.getElementById("btn-wb-toggle");
const wbDrawerWrapper = document.getElementById("wb-drawer-wrapper");
const btnCloseWb = document.getElementById("btn-close-wb");
const btnWbReset = document.getElementById("btn-wb-reset");
const btnCalibrateTarget = document.getElementById("btn-calibrate-target");
const wbPresetButtons = document.querySelectorAll(".btn-wb-preset");
const sliderWbTemp = document.getElementById("slider-wb-temp");
const sliderWbTint = document.getElementById("slider-wb-tint");
const sliderWbExp = document.getElementById("slider-wb-exp");
const wbTempVal = document.getElementById("wb-temp-val");
const wbTintVal = document.getElementById("wb-tint-val");
const wbExpVal = document.getElementById("wb-exp-val");
const wbMatrix = document.getElementById("wb-matrix");
const btnSamplePoint = document.getElementById("btn-sample-point");
const btnSampleSmooth = document.getElementById("btn-sample-smooth");
const btnSampleInfo = document.getElementById("btn-sample-info");
const samplingPopover = document.getElementById("sampling-popover");
const btnClosePopover = document.getElementById("btn-close-popover");
const paletteSection = document.getElementById("palette-section");
const paletteTray = document.getElementById("palette-tray");
const btnClearPalette = document.getElementById("btn-clear-palette");

let currentStream = null;
let currentTrack = null;
let facingMode = "environment";
let isTorchOn = false;
let isFrozen = false;
let sampleSize = 1;
let animationFrameId = null;

let reticlePos = { x: 0.5, y: 0.5 };
let isPointerActive = false;
let lastTapTimestamp = 0;
let lastTapCoords = { x: 0, y: 0 };

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
// COLOR PROCESSING & TELEMETRY
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
 * Calculates underlying canvas/video pixel coordinates corresponding to the reticle.
 * @returns {{ frameX: number, frameY: number }}
 */
function getFrameCoordinates() {
  const rect = viewfinderElement.getBoundingClientRect();
  const vw = rect.width || 360;
  const vh = rect.height || 360;
  const touchX = reticlePos.x * vw;
  const touchY = reticlePos.y * vh;

  const canvasW = samplerCanvas.width || videoElement.videoWidth || 640;
  const canvasH = samplerCanvas.height || videoElement.videoHeight || 480;

  const scale = Math.max(vw / canvasW, vh / canvasH);
  const renderedW = canvasW * scale;
  const renderedH = canvasH * scale;
  const offsetX = (renderedW - vw) / 2;
  const offsetY = (renderedH - vh) / 2;

  const frameX = Math.max(0, Math.min(canvasW - 1, Math.floor((touchX + offsetX) / scale)));
  const frameY = Math.max(0, Math.min(canvasH - 1, Math.floor((touchY + offsetY) / scale)));

  return { frameX, frameY };
}

/**
 * Updates the normalized reticle position and updates DOM coordinates.
 * @param {number} normX - Relative X coordinate (0 to 1).
 * @param {number} normY - Relative Y coordinate (0 to 1).
 */
function setReticlePosition(normX, normY) {
  const clampedX = Math.max(0.06, Math.min(0.94, normX));
  const clampedY = Math.max(0.06, Math.min(0.94, normY));
  reticlePos.x = clampedX;
  reticlePos.y = clampedY;

  reticleElement.style.left = `${(clampedX * 100).toFixed(2)}%`;
  reticleElement.style.top = `${(clampedY * 100).toFixed(2)}%`;

  const isCentered = Math.abs(clampedX - 0.5) < 0.02 && Math.abs(clampedY - 0.5) < 0.02;
  if (btnRecenter) {
    btnRecenter.classList.toggle("visible", !isCentered);
  }
}

/**
 * Resets the reticle back to the exact center of the viewfinder.
 */
function recenterReticle() {
  triggerHaptic(20);
  reticleElement.classList.add("animated");
  setReticlePosition(0.5, 0.5);
  sampleCurrentFrame();
  showToast("Target centered", 1200);
}

/**
 * Samples the color at the current reticle position from the active source.
 */
function sampleCurrentFrame() {
  const fallbackCanvas = document.getElementById("fallback-interactive-canvas");
  if (fallbackCanvas && !videoElement.srcObject) {
    const ctx = fallbackCanvas.getContext("2d");
    if (ctx) {
      const x = Math.max(0, Math.min(fallbackCanvas.width - 1, Math.floor(reticlePos.x * fallbackCanvas.width)));
      const y = Math.max(0, Math.min(fallbackCanvas.height - 1, Math.floor(reticlePos.y * fallbackCanvas.height)));
      const sampled = samplePixelColor(ctx, x, y, sampleSize, calibrationState.gains);
      updateColorDisplay(sampled);
    }
    return;
  }

  const { frameX, frameY } = getFrameCoordinates();
  const sampled = samplePixelColor(samplerCtx, frameX, frameY, sampleSize, calibrationState.gains);
  updateColorDisplay(sampled);
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

//=============================================
// CAMERA STREAM & HARDWARE CONTROLS
//=============================================
/**
 * Initializes and starts the camera stream with error resilience and fallback UI.
 * @returns {Promise<void>}
 */
async function startCamera() {
  stopCurrentStream();

  const constraints = {
    audio: false,
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1080 },
      height: { ideal: 1080 }
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    videoElement.srcObject = stream;
    cameraFallbackElement.hidden = true;

    currentTrack = stream.getVideoTracks()[0];
    checkTorchCapability();

    await videoElement.play();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    isFrozen = false;
    freezeBadge.hidden = true;
    freezeBtn.classList.remove("frozen");
    animationFrameId = requestAnimationFrame(processVideoFrame);
  } catch (err) {
    cameraFallbackElement.hidden = false;
    btnTorch.disabled = true;
    setupMockCanvasFallback();
  }
}

/**
 * Stops the current media stream tracks.
 */
function stopCurrentStream() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
    currentTrack = null;
  }
}

/**
 * Detects whether the device camera supports a hardware torch/flashlight.
 */
function checkTorchCapability() {
  if (!currentTrack) {
    btnTorch.disabled = true;
    return;
  }

  const capabilities = currentTrack.getCapabilities ? currentTrack.getCapabilities() : {};
  if ("torch" in capabilities) {
    btnTorch.disabled = false;
  } else {
    btnTorch.disabled = true;
  }
}

/**
 * Toggles the mobile flashlight if supported by hardware.
 */
async function toggleTorch() {
  if (!currentTrack || btnTorch.disabled) return;

  try {
    isTorchOn = !isTorchOn;
    await currentTrack.applyConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    btnTorch.classList.toggle("active", isTorchOn);
    btnTorch.blur();
    showToast(isTorchOn ? "Flashlight turned on" : "Flashlight turned off");
  } catch {
    btnTorch.disabled = true;
  }
}

/**
 * Switches between front and back camera streams.
 */
function switchCameraFacing() {
  facingMode = facingMode === "environment" ? "user" : "environment";
  triggerHaptic(15);
  showToast(`Switched to ${facingMode === "environment" ? "back" : "front"} camera`);
  startCamera();
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
    recenterReticle();
    showToast("Scanner resumed");
    animationFrameId = requestAnimationFrame(processVideoFrame);
  }
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
    renderRecentPalette();
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
// WHITE BALANCE & CAMERA CALIBRATION
//=============================================
const calibrationState = {
  preset: "auto",
  temp: 0,
  tint: 0,
  exp: 0,
  gains: { r: 1, g: 1, b: 1 }
};

const WB_PRESETS = {
  auto: { temp: 0, tint: 0, exp: 0 },
  daylight: { temp: 10, tint: 0, exp: 0 },
  cloudy: { temp: 25, tint: 0, exp: 0 },
  tungsten: { temp: -35, tint: 5, exp: 0 },
  fluorescent: { temp: -10, tint: 25, exp: 0 },
  warm: { temp: -35, tint: 5, exp: 0 },
  indoor: { temp: -10, tint: 25, exp: 0 }
};

/**
 * Calculates RGB multiplier gains from temperature, tint, and exposure.
 * @param {number} temp - Temperature offset (-100 to 100).
 * @param {number} tint - Tint offset (-100 to 100).
 * @param {number} exp - Exposure offset (-50 to 50).
 * @returns {{ r: number, g: number, b: number }} Calibration gains.
 */
function calculateGains(temp, tint, exp) {
  let r = 1;
  let g = 1;
  let b = 1;

  if (temp > 0) {
    r += (temp / 100) * 0.4;
    b -= (temp / 100) * 0.25;
  } else if (temp < 0) {
    r += (temp / 100) * 0.25;
    b -= (temp / 100) * 0.4;
  }

  if (tint > 0) {
    r += (tint / 100) * 0.15;
    g -= (tint / 100) * 0.2;
    b += (tint / 100) * 0.15;
  } else if (tint < 0) {
    g -= (tint / 100) * 0.25;
  }

  const expFactor = Math.pow(2, exp / 40);
  r *= expFactor;
  g *= expFactor;
  b *= expFactor;

  return { r, g, b };
}

/**
 * Applies current calibration gains to live video and UI readout.
 */
function applyCalibration() {
  if (wbMatrix) {
    const { r, g, b } = calibrationState.gains;
    wbMatrix.setAttribute("values", `${r.toFixed(3)} 0 0 0 0  0 ${g.toFixed(3)} 0 0 0  0 0 ${b.toFixed(3)} 0 0  0 0 0 1 0`);
  }

  const isNeutral = calibrationState.preset === "auto" && 
                    calibrationState.temp === 0 && 
                    calibrationState.tint === 0 && 
                    calibrationState.exp === 0 &&
                    Math.abs(calibrationState.gains.r - 1) < 0.001 &&
                    Math.abs(calibrationState.gains.g - 1) < 0.001 &&
                    Math.abs(calibrationState.gains.b - 1) < 0.001;

  if (videoElement) {
    videoElement.style.filter = isNeutral ? "none" : "url(#wb-filter)";
  }

  const fallbackCanvas = document.getElementById("fallback-interactive-canvas");
  if (fallbackCanvas) {
    fallbackCanvas.style.filter = isNeutral ? "none" : "url(#wb-filter)";
  }

  if (wbTempVal) wbTempVal.textContent = calibrationState.temp > 0 ? `+${calibrationState.temp}` : String(calibrationState.temp);
  if (wbTintVal) wbTintVal.textContent = calibrationState.tint > 0 ? `+${calibrationState.tint}` : String(calibrationState.tint);
  if (wbExpVal) wbExpVal.textContent = calibrationState.exp > 0 ? `+${(calibrationState.exp / 25).toFixed(1)} EV` : `${(calibrationState.exp / 25).toFixed(1)} EV`;

  if (sliderWbTemp) sliderWbTemp.value = String(calibrationState.temp);
  if (sliderWbTint) sliderWbTint.value = String(calibrationState.tint);
  if (sliderWbExp) sliderWbExp.value = String(calibrationState.exp);

  wbPresetButtons.forEach(btn => {
    const isCurrent = btn.dataset.preset === calibrationState.preset;
    btn.classList.toggle("active", isCurrent);
    btn.setAttribute("aria-checked", String(isCurrent));
  });

  sampleCurrentFrame();
}

/**
 * Activates a named white balance preset.
 * @param {string} presetKey - Key of the preset.
 */
function setWbPreset(presetKey) {
  calibrationState.preset = presetKey;
  if (WB_PRESETS[presetKey]) {
    const p = WB_PRESETS[presetKey];
    calibrationState.temp = p.temp;
    calibrationState.tint = p.tint;
    calibrationState.exp = p.exp;
    calibrationState.gains = calculateGains(p.temp, p.tint, p.exp);
  }
  applyCalibration();
  triggerHaptic(15);
  const presetLabels = {
    auto: "Auto",
    daylight: "Daylight",
    cloudy: "Cloudy",
    tungsten: "Tungsten",
    fluorescent: "Fluorescent",
    manual: "Manual"
  };
  const label = presetLabels[presetKey] || (presetKey.charAt(0).toUpperCase() + presetKey.slice(1));
  showToast(`White balance: ${label}`);
}

/**
 * Calibrates white balance multipliers so that the target reticle pixel becomes neutral gray.
 */
function calibrateOnTarget() {
  const fallbackCanvas = document.getElementById("fallback-interactive-canvas");
  let rawColor = null;

  if (fallbackCanvas && !videoElement.srcObject) {
    const ctx = fallbackCanvas.getContext("2d");
    if (ctx) {
      const x = Math.max(0, Math.min(fallbackCanvas.width - 1, Math.floor(reticlePos.x * fallbackCanvas.width)));
      const y = Math.max(0, Math.min(fallbackCanvas.height - 1, Math.floor(reticlePos.y * fallbackCanvas.height)));
      rawColor = samplePixelColor(ctx, x, y, sampleSize, null);
    }
  } else {
    const { frameX, frameY } = getFrameCoordinates();
    rawColor = samplePixelColor(samplerCtx, frameX, frameY, sampleSize, null);
  }

  if (!rawColor || (rawColor.r === 0 && rawColor.g === 0 && rawColor.b === 0)) {
    showToast("Cannot calibrate: target too dark");
    return;
  }

  const grayTarget = (rawColor.r + rawColor.g + rawColor.b) / 3;
  const gainR = grayTarget / Math.max(1, rawColor.r);
  const gainG = grayTarget / Math.max(1, rawColor.g);
  const gainB = grayTarget / Math.max(1, rawColor.b);

  calibrationState.preset = "manual";
  calibrationState.gains = { r: gainR, g: gainG, b: gainB };
  calibrationState.temp = Math.round((gainR - gainB) * 50);
  calibrationState.tint = Math.round((gainR + gainB - 2 * gainG) * 50);
  calibrationState.exp = 0;

  applyCalibration();
  triggerHaptic(50);
  showToast("Calibrated on target (White/Gray)");
}

/**
 * Resets white balance calibration back to neutral auto.
 */
function resetCalibration() {
  setWbPreset("auto");
}

/**
 * Toggles visibility of the white balance calibration drawer with smooth animation.
 */
function toggleWbDrawer() {
  if (!wbDrawerWrapper) return;
  const isOpening = !wbDrawerWrapper.classList.contains("open");
  wbDrawerWrapper.classList.toggle("open", isOpening);
  if (btnWbToggle) {
    btnWbToggle.classList.toggle("active", isOpening);
    btnWbToggle.setAttribute("aria-expanded", String(isOpening));
  }
  if (isOpening) {
    triggerHaptic(20);
  }
}

/**
 * Renders the saved swatches in the bottom palette tray.
 */
function renderRecentPalette() {
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

    paletteTray.appendChild(btn);
  });
}

//=============================================
// FALLBACK CANVAS SIMULATION
//=============================================
/**
 * Creates an interactive fallback canvas if the device has no camera or permission is denied.
 */
function setupMockCanvasFallback() {
  let fallbackCanvas = document.getElementById("fallback-interactive-canvas");
  if (!fallbackCanvas) {
    fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.id = "fallback-interactive-canvas";
    fallbackCanvas.className = "fallback-canvas";
    viewfinderElement.prepend(fallbackCanvas);
  }

  const rect = viewfinderElement.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 320));
  const height = width;
  fallbackCanvas.width = width;
  fallbackCanvas.height = height;

  const ctx = fallbackCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#E76F51");
  gradient.addColorStop(0.25, "#F4A261");
  gradient.addColorStop(0.5, "#2A9D8F");
  gradient.addColorStop(0.75, "#264653");
  gradient.addColorStop(1, "#9D4EDD");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  sampleCurrentFrame();
}

/**
 * Handles pointerdown on the viewfinder to position the reticle or recenter on double tap.
 * @param {PointerEvent} e - Pointer event.
 */
function handleViewfinderPointerDown(e) {
  if (e.target.closest("#btn-recenter") || e.target.closest(".btn-recenter")) {
    return;
  }

  const rect = viewfinderElement.getBoundingClientRect();
  const touchX = e.clientX - rect.left;
  const touchY = e.clientY - rect.top;

  const now = performance.now();
  const dx = touchX - lastTapCoords.x;
  const dy = touchY - lastTapCoords.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (now - lastTapTimestamp < 320 && dist < 35) {
    lastTapTimestamp = 0;
    recenterReticle();
    return;
  }

  lastTapTimestamp = now;
  lastTapCoords = { x: touchX, y: touchY };

  isPointerActive = true;
  viewfinderElement.setPointerCapture(e.pointerId);

  reticleElement.classList.add("animated");
  setReticlePosition(touchX / rect.width, touchY / rect.height);
  sampleCurrentFrame();
}

/**
 * Handles pointermove across the viewfinder to drag the reticle and inspect colors.
 * @param {PointerEvent} e - Pointer event.
 */
function handleViewfinderPointerMove(e) {
  if (!isPointerActive) return;

  reticleElement.classList.remove("animated");
  reticleElement.classList.add("dragging");

  const rect = viewfinderElement.getBoundingClientRect();
  const touchX = e.clientX - rect.left;
  const touchY = e.clientY - rect.top;

  setReticlePosition(touchX / rect.width, touchY / rect.height);
  sampleCurrentFrame();
}

/**
 * Handles pointerup and pointercancel to release pointer capture.
 * @param {PointerEvent} e - Pointer event.
 */
function handleViewfinderPointerUp(e) {
  isPointerActive = false;
  reticleElement.classList.remove("dragging");
  if (viewfinderElement.hasPointerCapture(e.pointerId)) {
    viewfinderElement.releasePointerCapture(e.pointerId);
  }
}

//=============================================
// EVENT LISTENERS & INITIALIZATION
//=============================================
/**
 * Attaches all event listeners for user interactions.
 */
function bindEventListeners() {
  freezeBtn.addEventListener("click", toggleFreeze);
  copyHexChip.addEventListener("click", () => handleCopy("hex"));
  cellRgb.addEventListener("click", () => handleCopy("rgb"));
  cellHsl.addEventListener("click", () => handleCopy("hsl"));

  btnTorch.addEventListener("click", toggleTorch);
  btnFlip.addEventListener("click", switchCameraFacing);

  if (btnWbToggle) {
    btnWbToggle.addEventListener("click", toggleWbDrawer);
  }

  if (btnCloseWb && wbDrawerWrapper) {
    btnCloseWb.addEventListener("click", () => {
      wbDrawerWrapper.classList.remove("open");
      if (btnWbToggle) {
        btnWbToggle.classList.remove("active");
        btnWbToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (btnWbReset) {
    btnWbReset.addEventListener("click", resetCalibration);
  }

  if (btnCalibrateTarget) {
    btnCalibrateTarget.addEventListener("click", calibrateOnTarget);
  }

  wbPresetButtons.forEach(btn => {
    btn.addEventListener("click", () => setWbPreset(btn.dataset.preset));
  });

  if (sliderWbTemp) {
    sliderWbTemp.addEventListener("input", e => {
      calibrationState.temp = parseInt(e.target.value, 10);
      calibrationState.preset = "manual";
      calibrationState.gains = calculateGains(calibrationState.temp, calibrationState.tint, calibrationState.exp);
      applyCalibration();
    });
  }

  if (sliderWbTint) {
    sliderWbTint.addEventListener("input", e => {
      calibrationState.tint = parseInt(e.target.value, 10);
      calibrationState.preset = "manual";
      calibrationState.gains = calculateGains(calibrationState.temp, calibrationState.tint, calibrationState.exp);
      applyCalibration();
    });
  }

  if (sliderWbExp) {
    sliderWbExp.addEventListener("input", e => {
      calibrationState.exp = parseInt(e.target.value, 10);
      calibrationState.preset = "manual";
      calibrationState.gains = calculateGains(calibrationState.temp, calibrationState.tint, calibrationState.exp);
      applyCalibration();
    });
  }

  btnSamplePoint.addEventListener("click", () => setSamplingMode(1));
  btnSampleSmooth.addEventListener("click", () => setSamplingMode(5));

  if (btnRecenter) {
    btnRecenter.addEventListener("click", e => {
      e.stopPropagation();
      recenterReticle();
    });
  }

  viewfinderElement.addEventListener("pointerdown", handleViewfinderPointerDown);
  viewfinderElement.addEventListener("pointermove", handleViewfinderPointerMove);
  viewfinderElement.addEventListener("pointerup", handleViewfinderPointerUp);
  viewfinderElement.addEventListener("pointercancel", handleViewfinderPointerUp);

  if (btnSampleInfo && samplingPopover) {
    btnSampleInfo.addEventListener("click", e => {
      e.stopPropagation();
      const isOpening = samplingPopover.hidden;
      samplingPopover.hidden = !isOpening;
      btnSampleInfo.setAttribute("aria-expanded", String(isOpening));
      btnSampleInfo.classList.toggle("active", isOpening);
    });
  }

  if (btnClosePopover && samplingPopover) {
    btnClosePopover.addEventListener("click", () => {
      samplingPopover.hidden = true;
      if (btnSampleInfo) {
        btnSampleInfo.setAttribute("aria-expanded", "false");
        btnSampleInfo.classList.remove("active");
      }
    });
  }

  document.addEventListener("click", e => {
    if (samplingPopover && !samplingPopover.hidden && !samplingPopover.contains(e.target) && e.target !== btnSampleInfo) {
      samplingPopover.hidden = true;
      if (btnSampleInfo) {
        btnSampleInfo.setAttribute("aria-expanded", "false");
        btnSampleInfo.classList.remove("active");
      }
    }
  });

  btnClearPalette.addEventListener("click", () => {
    clearPalette();
    renderRecentPalette();
    showToast("History cleared");
  });

  if (requestCameraBtn) {
    requestCameraBtn.addEventListener("click", () => {
      startCamera();
    });
  }

  if (dismissFallbackBtn) {
    dismissFallbackBtn.addEventListener("click", () => {
      cameraFallbackElement.hidden = true;
      showToast("Demo palette active. Tap anywhere on the square!");
    });
  }

  window.addEventListener("keydown", e => {
    if (e.code === "Space") {
      e.preventDefault();
      toggleFreeze();
    } else if (e.code === "KeyC" && (e.metaKey || e.ctrlKey)) {
      handleCopy("hex");
    }
  });
}

/**
 * Application boot sequence.
 */
export function initializeApp() {
  bindEventListeners();
  renderRecentPalette();
  startCamera();
}

document.addEventListener("DOMContentLoaded", initializeApp);
