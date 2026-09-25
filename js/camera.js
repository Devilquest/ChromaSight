import { triggerHaptic, showToast } from "./palette.js";

//=============================================
// CAMERA HARDWARE & STREAM STATE
//=============================================
let currentStream = null;
let currentTrack = null;
let facingMode = "environment";
let isTorchOn = false;

/**
 * Retrieves the currently active MediaStream.
 * @returns {MediaStream|null} Active media stream.
 */
export function getCurrentStream() {
  return currentStream;
}

/**
 * Retrieves the currently active video MediaStreamTrack.
 * @returns {MediaStreamTrack|null} Active video track.
 */
export function getCurrentTrack() {
  return currentTrack;
}

/**
 * Retrieves the active camera facing mode.
 * @returns {string} Facing mode ("environment" or "user").
 */
export function getFacingMode() {
  return facingMode;
}

/**
 * Detects whether the device camera supports a hardware torch/flashlight.
 * @param {HTMLButtonElement} btnTorch - Flashlight button DOM element.
 */
export function checkTorchCapability(btnTorch) {
  if (!btnTorch) return;
  if (!currentTrack) {
    btnTorch.disabled = true;
    return;
  }

  const capabilities = currentTrack.getCapabilities ? currentTrack.getCapabilities() : {};
  btnTorch.disabled = !("torch" in capabilities);
}

/**
 * Toggles the mobile flashlight if supported by hardware.
 * @param {HTMLButtonElement} btnTorch - Flashlight button DOM element.
 * @returns {Promise<void>}
 */
export async function toggleTorch(btnTorch) {
  if (!currentTrack || (btnTorch && btnTorch.disabled)) return;

  try {
    isTorchOn = !isTorchOn;
    await currentTrack.applyConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    if (btnTorch) {
      btnTorch.classList.toggle("active", isTorchOn);
      btnTorch.blur();
    }
    showToast(isTorchOn ? "Flashlight turned on" : "Flashlight turned off");
  } catch {
    if (btnTorch) {
      btnTorch.disabled = true;
    }
  }
}

/**
 * Stops the current media stream tracks and resets hardware state.
 */
export function stopCurrentStream() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
    currentTrack = null;
  }
}

/**
 * Initializes and starts the camera stream with error resilience and fallback UI.
 * @param {HTMLVideoElement} videoElement - HTML video element for camera playback.
 * @param {HTMLElement} cameraFallbackElement - Element displaying permission fallback message.
 * @param {HTMLButtonElement} btnTorch - Torch toggle button element.
 * @param {Function} [onStreamStarted] - Callback executed when video stream starts playing.
 * @param {Function} [onErrorFallback] - Callback executed when camera access fails.
 * @returns {Promise<void>}
 */
export async function startCamera(videoElement, cameraFallbackElement, btnTorch, onStreamStarted, onErrorFallback) {
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
    if (cameraFallbackElement) {
      cameraFallbackElement.hidden = true;
    }

    currentTrack = stream.getVideoTracks()[0];
    checkTorchCapability(btnTorch);

    await videoElement.play();
    if (typeof onStreamStarted === "function") {
      onStreamStarted();
    }
  } catch {
    if (cameraFallbackElement) {
      cameraFallbackElement.hidden = false;
    }
    if (btnTorch) {
      btnTorch.disabled = true;
    }
    if (typeof onErrorFallback === "function") {
      onErrorFallback();
    }
  }
}

/**
 * Switches between front and back camera streams.
 * @param {HTMLVideoElement} videoElement - Video element.
 * @param {HTMLElement} cameraFallbackElement - Fallback message element.
 * @param {HTMLButtonElement} btnTorch - Torch button element.
 * @param {Function} [onStreamStarted] - Callback when switched stream begins.
 * @returns {Promise<void>}
 */
export async function switchCameraFacing(videoElement, cameraFallbackElement, btnTorch, onStreamStarted) {
  facingMode = facingMode === "environment" ? "user" : "environment";
  triggerHaptic(15);
  showToast(`Switched to ${facingMode === "environment" ? "back" : "front"} camera`);
  await startCamera(videoElement, cameraFallbackElement, btnTorch, onStreamStarted);
}

//=============================================
// FALLBACK CANVAS SIMULATION
//=============================================
/**
 * Creates an interactive fallback canvas if the device has no camera or permission is denied.
 * @param {HTMLElement} viewfinderElement - Viewfinder container element.
 * @param {Function} [onFrameRendered] - Callback to sample the fallback canvas frame.
 * @returns {HTMLCanvasElement} The created or retrieved fallback canvas.
 */
export function setupMockCanvasFallback(viewfinderElement, onFrameRendered) {
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

  if (typeof onFrameRendered === "function") {
    onFrameRendered();
  }

  return fallbackCanvas;
}
