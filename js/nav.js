/* ══════════════════════════════════════
   NAVIGATION CONTROLLER
   ══════════════════════════════════════
   Shared nav hide/show on scroll, used by both home and works pages.
   Consolidates duplicated logic from script.js (IIFE) and works-script.js.

   Usage:
     initNavScroll()            — standard scroll listener (home, about)
     updateNavOnScroll(scrollY) — manual call from Lenis (works)
*/

const NAV_SCROLL_THRESHOLD = 20;
const NAV_COLLAPSE_THRESHOLD = 100;

/**
 * Core nav update logic — shared between standard scroll and Lenis scroll.
 * @param {HTMLElement} nav
 * @param {number} currentScrollY
 * @param {number} lastScrollY
 * @returns {number} currentScrollY (to store as new lastScrollY)
 */
function _applyNavState(nav, currentScrollY, lastScrollY) {
    if (currentScrollY > NAV_SCROLL_THRESHOLD) {
        nav.classList.add('nav-scrolled');
    } else {
        nav.classList.remove('nav-scrolled');
    }

    if (currentScrollY > lastScrollY && currentScrollY > NAV_COLLAPSE_THRESHOLD) {
        nav.classList.add('nav-collapsed');
    } else {
        nav.classList.remove('nav-collapsed');
    }

    return currentScrollY;
}

/**
 * Standard scroll-based nav controller (home page, about page).
 * Uses requestAnimationFrame throttle.
 */
function initNavScroll() {
    const nav = document.querySelector('.v2-nav');
    if (!nav) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function update() {
        lastScrollY = _applyNavState(nav, window.scrollY, lastScrollY);
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    update();
}

/**
 * Manual nav update for Lenis-driven pages (works page).
 * Call this from within the Lenis scroll callback.
 * @param {number} scrollY — current Lenis scroll position
 * @param {number} lastScrollY — previous scroll position
 * @returns {number} scrollY (store as new lastScrollY)
 */
function updateNavOnScroll(scrollY, lastScrollY) {
    const nav = document.querySelector('.v2-nav');
    if (!nav) return scrollY;
    return _applyNavState(nav, scrollY, lastScrollY);
}
