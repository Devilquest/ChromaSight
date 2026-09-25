import { triggerHaptic, showToast } from "./palette.js";

//=============================================
// CALIBRATION STATE & PRESETS
//=============================================
const calibrationState = {
  preset: "auto",
  temp: 0,
  tint: 0,
  exp: 0,
  gains: { r: 1, g: 1, b: 1 }
};

export const WB_PRESETS = {
  auto: { temp: 0, tint: 0, exp: 0 },
  daylight: { temp: 10, tint: 0, exp: 0 },
  cloudy: { temp: 25, tint: 0, exp: 0 },
  tungsten: { temp: -35, tint: 5, exp: 0 },
  fluorescent: { temp: -10, tint: 25, exp: 0 }
};

let dom = null;
let changeCallback = null;
let rawSampleProvider = null;

/**
 * Initializes and retrieves cached calibration DOM element references.
 * @returns {Object} Cached DOM elements.
 */
function getDomElements() {
  if (!dom) {
    dom = {
      wbMatrix: document.getElementById("wb-matrix"),
      videoElement: document.getElementById("camera-stream"),
      wbTempVal: document.getElementById("wb-temp-val"),
      wbTintVal: document.getElementById("wb-tint-val"),
      wbExpVal: document.getElementById("wb-exp-val"),
      sliderWbTemp: document.getElementById("slider-wb-temp"),
      sliderWbTint: document.getElementById("slider-wb-tint"),
      sliderWbExp: document.getElementById("slider-wb-exp"),
      wbPresetButtons: document.querySelectorAll(".btn-wb-preset"),
      btnWbToggle: document.getElementById("btn-wb-toggle"),
      wbDrawerWrapper: document.getElementById("wb-drawer-wrapper"),
      btnCloseWb: document.getElementById("btn-close-wb"),
      btnWbReset: document.getElementById("btn-wb-reset"),
      btnCalibrateTarget: document.getElementById("btn-calibrate-target")
    };
  }
  return dom;
}

/**
 * Retrieves the current white balance color gains.
 * @returns {{ r: number, g: number, b: number }} RGB multiplier gains.
 */
export function getCalibrationGains() {
  return { ...calibrationState.gains };
}

/**
 * Retrieves the current white balance state.
 * @returns {{ preset: string, temp: number, tint: number, exp: number, gains: { r: number, g: number, b: number } }} State copy.
 */
export function getCalibrationState() {
  return {
    preset: calibrationState.preset,
    temp: calibrationState.temp,
    tint: calibrationState.tint,
    exp: calibrationState.exp,
    gains: { ...calibrationState.gains }
  };
}

/**
 * Calculates RGB multiplier gains from temperature, tint, and exposure.
 * @param {number} temp - Temperature offset (-100 to 100).
 * @param {number} tint - Tint offset (-100 to 100).
 * @param {number} exp - Exposure offset (-50 to 50).
 * @returns {{ r: number, g: number, b: number }} Calibration gains.
 */
export function calculateGains(temp, tint, exp) {
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
 * Applies current calibration gains to the SVG filter and updates UI controls.
 */
export function applyCalibration() {
  const elements = getDomElements();
  const {
    wbMatrix,
    videoElement,
    wbTempVal,
    wbTintVal,
    wbExpVal,
    sliderWbTemp,
    sliderWbTint,
    sliderWbExp,
    wbPresetButtons
  } = elements;

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

  if (wbPresetButtons) {
    wbPresetButtons.forEach(btn => {
      const isCurrent = btn.dataset.preset === calibrationState.preset;
      btn.classList.toggle("active", isCurrent);
      btn.setAttribute("aria-checked", String(isCurrent));
    });
  }

  if (typeof changeCallback === "function") {
    changeCallback();
  }
}

/**
 * Activates a named white balance preset.
 * @param {string} presetKey - Key of the preset.
 */
export function setWbPreset(presetKey) {
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
export function calibrateOnTarget() {
  if (typeof rawSampleProvider !== "function") return;

  const rawColor = rawSampleProvider();
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
export function resetCalibration() {
  setWbPreset("auto");
}

/**
 * Toggles visibility of the white balance calibration drawer with smooth animation.
 */
export function toggleWbDrawer() {
  const elements = getDomElements();
  if (!elements.wbDrawerWrapper) return;
  const isOpening = !elements.wbDrawerWrapper.classList.contains("open");
  elements.wbDrawerWrapper.classList.toggle("open", isOpening);
  if (elements.btnWbToggle) {
    elements.btnWbToggle.classList.toggle("active", isOpening);
    elements.btnWbToggle.setAttribute("aria-expanded", String(isOpening));
  }
  if (isOpening) {
    triggerHaptic(20);
  }
}

//=============================================
// CALIBRATION EVENT BINDINGS
//=============================================
/**
 * Binds all white balance controls, presets, and drawer events.
 * @param {Object} options - Configuration options and callbacks.
 * @param {Function} [options.onCalibrationChanged] - Callback executed when calibration gains change.
 * @param {Function} [options.getRawTargetColor] - Function providing uncalibrated target color.
 */
export function bindCalibrationEvents(options = {}) {
  const elements = getDomElements();
  changeCallback = options.onCalibrationChanged || null;
  rawSampleProvider = options.getRawTargetColor || null;

  const {
    btnWbToggle,
    wbDrawerWrapper,
    btnCloseWb,
    btnWbReset,
    btnCalibrateTarget,
    wbPresetButtons,
    sliderWbTemp,
    sliderWbTint,
    sliderWbExp
  } = elements;

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

  if (wbPresetButtons) {
    wbPresetButtons.forEach(btn => {
      btn.addEventListener("click", () => setWbPreset(btn.dataset.preset));
    });
  }

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
}
