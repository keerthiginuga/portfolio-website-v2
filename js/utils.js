/* ══════════════════════════════════════
   SHARED UTILITIES
   ══════════════════════════════════════
   Common math helpers and DOM utilities used across multiple scripts.
   Extracted to avoid duplication.
*/

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0–1)
 * @returns {number}
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Smoothstep interpolation (Hermite).
 * @param {number} edge0
 * @param {number} edge1
 * @param {number} x
 * @returns {number}
 */
function smoothStep(edge0, edge1, x) {
    const t = clampValue((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/**
 * Vector length (2D).
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function vlen(x, y) {
    return Math.sqrt(x * x + y * y);
}

/**
 * Escape HTML special characters.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * Check if user prefers reduced motion.
 * @returns {boolean}
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device is touch-only (no hover capability).
 * @returns {boolean}
 */
function isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * Compute a motion scale factor based on device capabilities.
 * @param {number} touchScale - Scale for touch devices (default 0.45)
 * @returns {number} 0 for reduced motion, touchScale for touch, 1 for desktop
 */
function getMotionScale(touchScale = 0.45) {
    if (prefersReducedMotion()) return 0;
    return isTouchDevice() ? touchScale : 1;
}
