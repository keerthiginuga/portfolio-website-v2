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
const NAV_CONTRAST_LIGHT_THRESHOLD = 0.62;
const NAV_CONTRAST_ALPHA_THRESHOLD = 0.08;

let navContrastRaf = null;

function _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function _parseColor(colorString) {
    if (!colorString || colorString === 'transparent') return null;
    const match = colorString.match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(',').map(part => Number(part.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return {
        r: _clamp(parts[0], 0, 255),
        g: _clamp(parts[1], 0, 255),
        b: _clamp(parts[2], 0, 255),
        a: _clamp(parts[3] == null ? 1 : parts[3], 0, 1)
    };
}

function _channelToLinear(value) {
    const normalized = value / 255;
    return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
}

function _luminance(rgb) {
    if (!rgb) return 0;
    const r = _channelToLinear(rgb.r);
    const g = _channelToLinear(rgb.g);
    const b = _channelToLinear(rgb.b);
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function _resolveBackgroundLuminance(element) {
    let node = element;
    while (node && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        const parsed = _parseColor(style.backgroundColor);
        if (parsed && parsed.a > NAV_CONTRAST_ALPHA_THRESHOLD) {
            return _luminance(parsed);
        }
        node = node.parentElement;
    }
    return 0;
}

function _elementUnderPoint(x, y, occluders) {
    const states = occluders.map(el => ({
        el,
        pointerEvents: el.style.pointerEvents
    }));

    states.forEach(({ el }) => {
        el.style.pointerEvents = 'none';
    });

    const target = document.elementFromPoint(x, y);

    states.forEach(({ el, pointerEvents }) => {
        el.style.pointerEvents = pointerEvents;
    });

    return target;
}

function _setContrastClass(element, shouldUseDarkForeground) {
    if (!element) return;
    if (shouldUseDarkForeground) {
        element.classList.add('v2-contrast-dark');
    } else {
        element.classList.remove('v2-contrast-dark');
    }
}

function _applyContrastForTarget(target, anchor, occluders) {
    if (!target || !anchor) return;
    const x = _clamp(anchor.x, 1, Math.max(1, window.innerWidth - 1));
    const y = _clamp(anchor.y, 1, Math.max(1, window.innerHeight - 1));
    const underneath = _elementUnderPoint(x, y, occluders);
    const lum = underneath ? _resolveBackgroundLuminance(underneath) : 0;
    _setContrastClass(target, lum >= NAV_CONTRAST_LIGHT_THRESHOLD);
}

function _updateNavContrastNow(nav) {
    if (!nav || !document.body) return;
    const logo = document.querySelector('.v2-logo');
    const occluders = [nav];
    if (logo) occluders.push(logo);

    const navRect = nav.getBoundingClientRect();
    _applyContrastForTarget(
        nav,
        {
            x: navRect.left + (navRect.width * 0.5),
            y: navRect.top + Math.min(24, Math.max(8, navRect.height * 0.5))
        },
        occluders
    );

    if (!logo) return;
    const logoRect = logo.getBoundingClientRect();
    _applyContrastForTarget(
        logo,
        {
            x: logoRect.left + (logoRect.width * 0.5),
            y: logoRect.top + (logoRect.height * 0.5)
        },
        occluders
    );
}

function scheduleNavContrastUpdate(nav) {
    if (!nav) return;
    if (navContrastRaf) return;
    navContrastRaf = requestAnimationFrame(() => {
        _updateNavContrastNow(nav);
        navContrastRaf = null;
    });
}

function _getNavScrollPosition(nav) {
    const stored = Number(nav.dataset.scrollY || 0);
    if (!Number.isNaN(stored) && stored > 0) return stored;
    return window.scrollY || 0;
}

function _syncHamburgerAria(nav) {
    const button = nav.querySelector('.v2-hamburger');
    if (!button) return;
    button.setAttribute('aria-expanded', nav.classList.contains('nav-expanded') ? 'true' : 'false');
}

/**
 * Shared hamburger toggle for the collapsed nav.
 * Keeps state stable while expanded and closes on outside click, link click, or Escape.
 */
function initNavMenuToggle() {
    const nav = document.querySelector('.v2-nav');
    if (!nav || nav.dataset.menuInit === 'true') return;

    const hamburger = nav.querySelector('.v2-hamburger');
    if (!hamburger) return;

    nav.dataset.menuInit = 'true';
    _syncHamburgerAria(nav);

    const closeExpandedMenu = () => {
        nav.classList.remove('nav-expanded');
        const currentScrollY = _getNavScrollPosition(nav);
        if (currentScrollY > NAV_COLLAPSE_THRESHOLD) {
            nav.classList.add('nav-collapsed');
        } else {
            nav.classList.remove('nav-collapsed');
        }
        _syncHamburgerAria(nav);
    };

    const openExpandedMenu = () => {
        nav.classList.add('nav-expanded');
        nav.classList.remove('nav-collapsed');
        _syncHamburgerAria(nav);
    };

    hamburger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (nav.classList.contains('nav-expanded')) {
            closeExpandedMenu();
        } else {
            openExpandedMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!nav.classList.contains('nav-expanded')) return;
        if (nav.contains(event.target)) return;
        closeExpandedMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!nav.classList.contains('nav-expanded')) return;
        closeExpandedMenu();
    });

    nav.querySelectorAll('.v2-nav-link, .v2-nav-resume').forEach((el) => {
        el.addEventListener('click', () => {
            if (!nav.classList.contains('nav-expanded')) return;
            closeExpandedMenu();
        });
    });
}

/**
 * Core nav update logic — shared between standard scroll and Lenis scroll.
 * @param {HTMLElement} nav
 * @param {number} currentScrollY
 * @param {number} lastScrollY
 * @returns {number} currentScrollY (to store as new lastScrollY)
 */
function _applyNavState(nav, currentScrollY, lastScrollY) {
    nav.dataset.scrollY = String(Math.max(0, currentScrollY));
    scheduleNavContrastUpdate(nav);

    if (currentScrollY > NAV_SCROLL_THRESHOLD) {
        nav.classList.add('nav-scrolled');
    } else {
        nav.classList.remove('nav-scrolled');
    }

    // Keep full menu visible while user explicitly opened it via hamburger.
    if (nav.classList.contains('nav-expanded')) {
        _syncHamburgerAria(nav);
        return currentScrollY;
    }

    if (currentScrollY > lastScrollY && currentScrollY > NAV_COLLAPSE_THRESHOLD) {
        nav.classList.add('nav-collapsed');
    } else {
        nav.classList.remove('nav-collapsed');
    }

    _syncHamburgerAria(nav);
    return currentScrollY;
}

/**
 * Standard scroll-based nav controller (home page, about page).
 * Uses requestAnimationFrame throttle.
 */
function initNavScroll() {
    const nav = document.querySelector('.v2-nav');
    if (!nav) return;
    initNavMenuToggle();

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

    window.addEventListener('resize', () => {
        scheduleNavContrastUpdate(nav);
    });

    update();
    scheduleNavContrastUpdate(nav);
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
    initNavMenuToggle();
    const next = _applyNavState(nav, scrollY, lastScrollY);
    scheduleNavContrastUpdate(nav);
    return next;
}
