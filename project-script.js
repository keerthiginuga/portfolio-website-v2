// ============================================
// INDEX MENU TOGGLE
// ============================================

const indexToggle = document.querySelector('.index-toggle');
const indexOverlay = document.querySelector('.index-overlay');
const closeMenu = document.querySelector('.close-menu');
const topNav = document.querySelector('.top-nav');
const indexRight = document.querySelector('.index-right');
const navLinks = document.querySelectorAll('.nav-link');
const projectLinks = document.querySelectorAll('.project-link');
const projectThumbs = document.querySelectorAll('.project-thumb');
const indexLinks = document.querySelectorAll('.index-link');

const NAV_COLLAPSE_SCROLL_THRESHOLD = 100;
const NAV_COLLAPSE_DIRECTION_EPSILON = 4;
const NAV_CONTRAST_LIGHT_ENTER_THRESHOLD = 0.58;
const NAV_CONTRAST_LIGHT_EXIT_THRESHOLD = 0.50;
const NAV_CONTRAST_ALPHA_THRESHOLD = 0.08;
const NAV_CONTRAST_SWITCH_DEBOUNCE_MS = 100;
const NAV_CONTRAST_IDLE_UPDATE_MS = 120;
let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
let navContrastRaf = null;
let navContrastIdleTimer = null;
const navContrastState = {
    initialized: false,
    useDarkForeground: false,
    pendingForeground: null,
    pendingSinceMs: 0
};

function clampValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function parseCssColor(colorString) {
    if (!colorString || colorString === 'transparent') return null;
    const match = colorString.match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(',').map(part => Number(part.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return {
        r: clampValue(parts[0], 0, 255),
        g: clampValue(parts[1], 0, 255),
        b: clampValue(parts[2], 0, 255),
        a: clampValue(parts[3] == null ? 1 : parts[3], 0, 1)
    };
}

function linearChannel(value) {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getLuminance(rgb) {
    if (!rgb) return 0;
    return (0.2126 * linearChannel(rgb.r)) + (0.7152 * linearChannel(rgb.g)) + (0.0722 * linearChannel(rgb.b));
}

function resolveBackgroundLuminance(element) {
    let node = element;
    while (node && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        const parsed = parseCssColor(style.backgroundColor);
        if (parsed && parsed.a > NAV_CONTRAST_ALPHA_THRESHOLD) {
            return getLuminance(parsed);
        }
        node = node.parentElement;
    }
    return 0;
}

function sampleLuminance(anchor, blockers) {
    if (!anchor) return null;
    const x = clampValue(anchor.x, 1, Math.max(1, window.innerWidth - 1));
    const y = clampValue(anchor.y, 1, Math.max(1, window.innerHeight - 1));
    const stack = document.elementsFromPoint(x, y);
    const beneath = stack.find((el) => {
        if (!el) return false;
        return !blockers.some((blocker) => blocker === el || blocker.contains(el));
    });
    if (!beneath) return null;
    return resolveBackgroundLuminance(beneath);
}

function median(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function setUnifiedContrast(useDarkForeground) {
    const method = useDarkForeground ? 'add' : 'remove';
    topNav.classList[method]('contrast-dark');
    if (kLogo) kLogo.classList[method]('contrast-dark');
}

function resolveContrastDecision(rawLuminance) {
    if (!navContrastState.initialized) {
        navContrastState.initialized = true;
        navContrastState.useDarkForeground = rawLuminance >= NAV_CONTRAST_LIGHT_ENTER_THRESHOLD;
        navContrastState.pendingForeground = null;
        navContrastState.pendingSinceMs = 0;
        return navContrastState.useDarkForeground;
    }

    const desired = navContrastState.useDarkForeground
        ? rawLuminance >= NAV_CONTRAST_LIGHT_EXIT_THRESHOLD
        : rawLuminance >= NAV_CONTRAST_LIGHT_ENTER_THRESHOLD;

    if (desired === navContrastState.useDarkForeground) {
        navContrastState.pendingForeground = null;
        navContrastState.pendingSinceMs = 0;
        return navContrastState.useDarkForeground;
    }

    const now = performance.now();
    if (navContrastState.pendingForeground !== desired) {
        navContrastState.pendingForeground = desired;
        navContrastState.pendingSinceMs = now;
        return navContrastState.useDarkForeground;
    }

    if ((now - navContrastState.pendingSinceMs) < NAV_CONTRAST_SWITCH_DEBOUNCE_MS) {
        return navContrastState.useDarkForeground;
    }

    navContrastState.useDarkForeground = desired;
    navContrastState.pendingForeground = null;
    navContrastState.pendingSinceMs = 0;
    return navContrastState.useDarkForeground;
}

function updateNavContrastNow() {
    if (!topNav) return;
    const blockers = [topNav];
    if (kLogo) blockers.push(kLogo);
    const navRect = topNav.getBoundingClientRect();
    const logoRect = kLogo ? kLogo.getBoundingClientRect() : null;

    const navAnchor = {
        x: navRect.left + (navRect.width * 0.5),
        y: navRect.top + (navRect.height * 0.5)
    };
    const navLeftAnchor = {
        x: navRect.left + (navRect.width * 0.2),
        y: navRect.top + (navRect.height * 0.5)
    };
    const navRightAnchor = {
        x: navRect.left + (navRect.width * 0.8),
        y: navRect.top + (navRect.height * 0.5)
    };
    const logoAnchor = logoRect
        ? {
            x: logoRect.left + (logoRect.width * 0.5),
            y: logoRect.top + (logoRect.height * 0.5)
        }
        : navAnchor;
    const bridgeAnchor = {
        x: (logoAnchor.x + navAnchor.x) * 0.5,
        y: (logoAnchor.y + navAnchor.y) * 0.5
    };

    const luminanceSamples = [
        sampleLuminance(logoAnchor, blockers),
        sampleLuminance(navAnchor, blockers),
        sampleLuminance(navLeftAnchor, blockers),
        sampleLuminance(navRightAnchor, blockers),
        sampleLuminance(bridgeAnchor, blockers)
    ].filter((value) => typeof value === 'number' && !Number.isNaN(value));

    const rawLuminance = median(luminanceSamples);
    const useDarkForeground = resolveContrastDecision(rawLuminance);
    setUnifiedContrast(useDarkForeground);
}

function scheduleNavContrastUpdate() {
    if (navContrastIdleTimer) clearTimeout(navContrastIdleTimer);
    navContrastIdleTimer = setTimeout(() => {
        updateNavContrastNow();
    }, NAV_CONTRAST_IDLE_UPDATE_MS);
    if (!topNav || navContrastRaf) return;
    navContrastRaf = requestAnimationFrame(() => {
        updateNavContrastNow();
        navContrastRaf = null;
    });
}

function updateToggleState() {
    if (!indexToggle || !topNav) return;
    indexToggle.setAttribute('aria-expanded', topNav.classList.contains('nav-expanded') ? 'true' : 'false');
}

function collapseNav() {
    if (!topNav) return;
    topNav.classList.remove('nav-expanded');
    topNav.classList.add('nav-collapsed');
    updateToggleState();
}

function expandNav() {
    if (!topNav) return;
    topNav.classList.remove('nav-collapsed');
    topNav.classList.add('nav-expanded');
    updateToggleState();
}

function resetNav() {
    // Project pages keep nav collapsed by default.
    collapseNav();
}

function updateNavOnScroll() {
    if (!topNav) return;
    scheduleNavContrastUpdate();

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const deltaY = currentScrollTop - lastScrollTop;

    // Close expanded menu on real scroll movement.
    if (topNav.classList.contains('nav-expanded')) {
        if (Math.abs(deltaY) >= NAV_COLLAPSE_DIRECTION_EPSILON) {
            collapseNav();
        }
        lastScrollTop = currentScrollTop;
        return;
    }

    // Project pages: always keep nav closed unless explicitly opened.
    if (!topNav.classList.contains('nav-collapsed')) {
        collapseNav();
    }

    lastScrollTop = currentScrollTop;
}

// Hamburger: open/close full nav bar
if (indexToggle) {
    indexToggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!topNav) return;

        if (topNav.classList.contains('nav-expanded')) {
            collapseNav();
        } else {
            expandNav();
        }
    });
}

// Close index menu
if (closeMenu) {
    closeMenu.addEventListener('click', () => {
        if (indexOverlay) indexOverlay.classList.remove('active');
        // Reset all thumbnails and show about section
        projectThumbs.forEach(thumb => thumb.classList.remove('active'));
        if (indexRight) indexRight.classList.remove('hide');
    });
}

// Collapse expanded nav when clicking outside
document.addEventListener('click', (event) => {
    if (!topNav || !topNav.classList.contains('nav-expanded')) return;
    if (topNav.contains(event.target)) return;
    collapseNav();
});

// Collapse expanded nav after selecting a link
navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        if (!topNav || !topNav.classList.contains('nav-expanded')) return;
        collapseNav();
    });
});

// Project hover effects
projectLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        const projectId = link.getAttribute('data-project');
        
        // Hide about me section
        if (indexRight) {
            indexRight.classList.add('hide');
        }
        
        // Show corresponding thumbnail
        projectThumbs.forEach(thumb => {
            if (thumb.getAttribute('data-project') === projectId) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    });
    
    link.addEventListener('mouseleave', () => {
        // Show about me section
        if (indexRight) {
            indexRight.classList.remove('hide');
        }
        
        // Hide all thumbnails
        projectThumbs.forEach(thumb => {
            thumb.classList.remove('active');
        });
    });
});

// Close menu when clicking on index links
indexLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (indexOverlay) indexOverlay.classList.remove('active');
        // Reset all thumbnails and show about section
        projectThumbs.forEach(thumb => thumb.classList.remove('active'));
        if (indexRight) indexRight.classList.remove('hide');
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Project page scroll effect - content slides over hero
// Hero stays fixed, content slides up naturally with scroll

// ============================================
// K LOGO TILT ON SCROLL
// ============================================

const kLetter = document.querySelector('.k-letter');
const kLogo = document.querySelector('.k-logo');

// Make logo clickable - returns to top
if (kLogo) {
    kLogo.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Tilt based on scroll
function updateLogoTilt() {
    if (!kLetter) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollTop / maxScroll;
    
    // Rotate from 0 to 360 degrees based on scroll percentage
    const rotation = scrollPercent * 360;
    
    kLetter.style.transform = `rotate(${rotation}deg)`;
}

// Update on scroll
window.addEventListener('scroll', updateLogoTilt);
window.addEventListener('scroll', updateNavOnScroll, { passive: true });
window.addEventListener('resize', scheduleNavContrastUpdate);

// Initial nav state
updateToggleState();
collapseNav();
updateNavOnScroll();
scheduleNavContrastUpdate();

// Initial update
updateLogoTilt();
