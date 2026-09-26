import { triggerHaptic, showToast } from "./palette.js";

let reticlePos = { x: 0.5, y: 0.5 };
let isPointerActive = false;
let lastTapTimestamp = 0;
let lastTapCoords = { x: 0, y: 0 };

/**
 * Retrieves the normalized position of the reticle (0 to 1).
 * @returns {{ x: number, y: number }} Normalized coordinates.
 */
export function getReticlePosition() {
  return { x: reticlePos.x, y: reticlePos.y };
}

/**
 * Updates the normalized reticle position and updates DOM coordinates.
 * @param {number} normX - Relative X coordinate (0 to 1).
 * @param {number} normY - Relative Y coordinate (0 to 1).
 * @param {HTMLElement} reticleElement - Reticle DOM element.
 * @param {HTMLButtonElement} [btnRecenter] - Recenter button element.
 */
export function setReticlePosition(normX, normY, reticleElement, btnRecenter) {
  const clampedX = Math.max(0.06, Math.min(0.94, normX));
  const clampedY = Math.max(0.06, Math.min(0.94, normY));
  reticlePos.x = clampedX;
  reticlePos.y = clampedY;

  if (reticleElement) {
    reticleElement.style.left = `${(clampedX * 100).toFixed(2)}%`;
    reticleElement.style.top = `${(clampedY * 100).toFixed(2)}%`;
  }

  const isCentered = Math.abs(clampedX - 0.5) < 0.02 && Math.abs(clampedY - 0.5) < 0.02;
  if (btnRecenter) {
    const isReticleVisible = reticleElement && !reticleElement.hidden;
    btnRecenter.classList.toggle("visible", !isCentered && isReticleVisible);
  }
}

/**
 * Resets the reticle back to the exact center of the viewfinder.
 * @param {HTMLElement} reticleElement - Reticle DOM element.
 * @param {HTMLButtonElement} [btnRecenter] - Recenter button element.
 * @param {Function} [onSample] - Callback executed to sample the newly centered position.
 */
export function recenterReticle(reticleElement, btnRecenter, onSample) {
  triggerHaptic(20);
  if (reticleElement) {
    reticleElement.classList.add("animated");
  }
  setReticlePosition(0.5, 0.5, reticleElement, btnRecenter);
  if (typeof onSample === "function") {
    onSample();
  }
  showToast("Target centered", 1200);
}

/**
 * Calculates underlying canvas/video pixel coordinates corresponding to the reticle.
 * @param {HTMLElement} viewfinderElement - Viewfinder container element.
 * @param {HTMLCanvasElement} samplerCanvas - Hidden sampling canvas.
 * @param {HTMLVideoElement} videoElement - Video stream element.
 * @returns {{ frameX: number, frameY: number }} Mapped frame coordinates.
 */
export function getFrameCoordinates(viewfinderElement, samplerCanvas, videoElement) {
  const rect = viewfinderElement.getBoundingClientRect();
  const vw = rect.width || 360;
  const vh = rect.height || 360;
  const touchX = reticlePos.x * vw;
  const touchY = reticlePos.y * vh;

  const canvasW = samplerCanvas.width || (videoElement ? videoElement.videoWidth : 640) || 640;
  const canvasH = samplerCanvas.height || (videoElement ? videoElement.videoHeight : 480) || 480;

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
 * Binds pointer and touch interactions to drag the reticle across the viewfinder.
 * @param {HTMLElement} viewfinderElement - Viewfinder container element.
 * @param {HTMLElement} reticleElement - Reticle DOM element.
 * @param {HTMLButtonElement} [btnRecenter] - Recenter button element.
 * @param {Function} [onSample] - Callback executed whenever reticle position changes.
 */
export function bindReticleInteractions(viewfinderElement, reticleElement, btnRecenter, onSample) {
  if (!viewfinderElement || !reticleElement) return;

  if (btnRecenter) {
    btnRecenter.addEventListener("click", e => {
      e.stopPropagation();
      recenterReticle(reticleElement, btnRecenter, onSample);
    });
  }

  viewfinderElement.addEventListener("pointerdown", e => {
    if (
      (reticleElement && reticleElement.hidden) ||
      e.target.closest("#btn-recenter") ||
      e.target.closest(".btn-recenter") ||
      e.target.closest("#camera-fallback") ||
      e.target.closest(".camera-fallback")
    ) {
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
      recenterReticle(reticleElement, btnRecenter, onSample);
      return;
    }

    lastTapTimestamp = now;
    lastTapCoords = { x: touchX, y: touchY };

    isPointerActive = true;
    viewfinderElement.setPointerCapture(e.pointerId);

    reticleElement.classList.add("animated");
    setReticlePosition(touchX / rect.width, touchY / rect.height, reticleElement, btnRecenter);
    if (typeof onSample === "function") {
      onSample();
    }
  });

  viewfinderElement.addEventListener("pointermove", e => {
    if (!isPointerActive) return;

    reticleElement.classList.remove("animated");
    reticleElement.classList.add("dragging");

    const rect = viewfinderElement.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    setReticlePosition(touchX / rect.width, touchY / rect.height, reticleElement, btnRecenter);
    if (typeof onSample === "function") {
      onSample();
    }
  });

  function releasePointer(e) {
    isPointerActive = false;
    reticleElement.classList.remove("dragging");
    if (viewfinderElement.hasPointerCapture(e.pointerId)) {
      viewfinderElement.releasePointerCapture(e.pointerId);
    }
  }

  viewfinderElement.addEventListener("pointerup", releasePointer);
  viewfinderElement.addEventListener("pointercancel", releasePointer);
}
