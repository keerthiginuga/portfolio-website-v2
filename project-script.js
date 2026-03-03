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
const navContrastPixelCanvas = document.createElement('canvas');
const navContrastPixelCtx = navContrastPixelCanvas.getContext('2d', { willReadFrequently: true });
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

function getOwnBackgroundLuminance(element) {
    if (!element) return null;
    const style = window.getComputedStyle(element);
    const parsed = parseCssColor(style.backgroundColor);
    if (!parsed || parsed.a <= NAV_CONTRAST_ALPHA_THRESHOLD) return null;
    return getLuminance(parsed);
}

function sampleMediaLuminance(element, viewportX, viewportY) {
    if (!navContrastPixelCtx) return null;
    if (!(element instanceof HTMLImageElement || element instanceof HTMLVideoElement)) return null;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const mediaW = element instanceof HTMLImageElement ? element.naturalWidth : element.videoWidth;
    const mediaH = element instanceof HTMLImageElement ? element.naturalHeight : element.videoHeight;
    if (!mediaW || !mediaH) return null;

    const relX = clampValue(viewportX - rect.left, 0, rect.width);
    const relY = clampValue(viewportY - rect.top, 0, rect.height);

    const scale = Math.max(rect.width / mediaW, rect.height / mediaH);
    const drawW = mediaW * scale;
    const drawH = mediaH * scale;
    const cropX = (drawW - rect.width) / 2;
    const cropY = (drawH - rect.height) / 2;

    const srcX = clampValue((relX + cropX) / scale, 0, mediaW - 1);
    const srcY = clampValue((relY + cropY) / scale, 0, mediaH - 1);

    try {
        navContrastPixelCtx.clearRect(0, 0, 1, 1);
        navContrastPixelCtx.drawImage(element, srcX, srcY, 1, 1, 0, 0, 1, 1);
        const pixel = navContrastPixelCtx.getImageData(0, 0, 1, 1).data;
        return getLuminance({ r: pixel[0], g: pixel[1], b: pixel[2] });
    } catch (_err) {
        return null;
    }
}

function sampleLuminance(anchor, blockers) {
    if (!anchor) return null;
    const x = clampValue(anchor.x, 1, Math.max(1, window.innerWidth - 1));
    const y = clampValue(anchor.y, 1, Math.max(1, window.innerHeight - 1));
    const stack = document.elementsFromPoint(x, y);

    for (const el of stack) {
        if (!el) continue;
        if (blockers.some((blocker) => blocker === el || blocker.contains(el))) continue;

        const mediaLum = sampleMediaLuminance(el, x, y);
        if (typeof mediaLum === 'number' && !Number.isNaN(mediaLum)) return mediaLum;

        const ownBgLum = getOwnBackgroundLuminance(el);
        if (typeof ownBgLum === 'number' && !Number.isNaN(ownBgLum)) return ownBgLum;
    }

    return resolveBackgroundLuminance(document.body);
}

function median(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function setUnifiedContrast(useDarkForeground) {
    if (!kLogo) return;
    const method = useDarkForeground ? 'add' : 'remove';
    kLogo.classList[method]('contrast-dark');
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
    const probeY = clampValue(
        Math.max(navRect.bottom + 8, (logoRect ? logoRect.bottom + 8 : navRect.bottom + 8)),
        1,
        Math.max(1, window.innerHeight - 1)
    );

    const navAnchor = {
        x: navRect.left + (navRect.width * 0.5),
        y: probeY
    };
    const navLeftAnchor = {
        x: navRect.left + (navRect.width * 0.2),
        y: probeY
    };
    const navRightAnchor = {
        x: navRect.left + (navRect.width * 0.8),
        y: probeY
    };
    const logoAnchor = logoRect
        ? {
            x: logoRect.left + (logoRect.width * 0.5),
            y: probeY
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

function renderMoreProjectsSection() {
    if (typeof getAllProjects !== 'function') return;

    const footer = document.querySelector('.ps-footer');
    if (!footer) return;

    const currentFile = window.location.pathname.split('/').pop() || '';
    const moreProjects = getAllProjects().filter((project) => {
        if (!project || typeof project.projectUrl !== 'string') return false;
        if (!project.projectUrl.startsWith('project-')) return false;
        return project.projectUrl !== currentFile;
    });

    if (!moreProjects.length) return;

    const section = document.createElement('section');
    section.className = 'ps-more-projects';
    section.setAttribute('aria-labelledby', 'ps-more-projects-title');

    section.innerHTML = `
        <div class="ps-more-projects-inner">
            <header class="ps-more-projects-header">
                <h2 class="ps-more-projects-header-text" id="ps-more-projects-title">
                    VIEW MORE PROJECTS<sup>'</sup>
                </h2>
            </header>
            <div class="ps-more-carousel">
                <button type="button" class="ps-more-control ps-more-control--prev" data-more-prev aria-label="Previous projects">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M14.5 6.5L9 12l5.5 5.5"></path>
                    </svg>
                </button>
                <div class="ps-more-projects-viewport" data-more-viewport>
                    <div class="ps-more-projects-track" data-more-track></div>
                </div>
                <button type="button" class="ps-more-control ps-more-control--next" data-more-next aria-label="Next projects">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M9.5 6.5L15 12l-5.5 5.5"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    const track = section.querySelector('[data-more-track]');
    if (!track) return;

    const loopProjects = [...moreProjects, ...moreProjects, ...moreProjects];

    loopProjects.forEach((project) => {
        const card = document.createElement('a');
        card.className = 'ps-more-card';
        card.href = project.projectUrl;
        card.setAttribute('aria-label', `View ${project.title}`);

        const tags = Array.isArray(project.tags) ? project.tags : [];
        const imageSrc = project.heroImage || (Array.isArray(project.images) && project.images[0]) || '';
        const tagsMarkup = tags.map((tag) => `<li class="ps-more-card-tag">${tag}</li>`).join('');

        card.innerHTML = `
            <div class="ps-more-card-media">
                <img src="${imageSrc}" alt="${project.title} cover image" loading="lazy">
            </div>
            <div class="ps-more-card-body">
                <h3 class="ps-more-card-title">${project.title}</h3>
                <ul class="ps-more-card-tags">${tagsMarkup}</ul>
            </div>
        `;

        track.appendChild(card);
    });

    footer.parentNode.insertBefore(section, footer);

    const viewport = section.querySelector('[data-more-viewport]');
    const prevBtn = section.querySelector('[data-more-prev]');
    const nextBtn = section.querySelector('[data-more-next]');
    if (!viewport || !prevBtn || !nextBtn) return;

    const cards = Array.from(track.querySelectorAll('.ps-more-card'));
    const sourceCount = moreProjects.length;
    let middleSetStart = 0;
    let singleSetWidth = 0;
    let autoRaf = 0;
    let lastTs = 0;
    let pauseAutoUntil = 0;
    const autoSpeedPxPerSecond = 26;
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function getScrollStep() {
        const firstCard = track.querySelector('.ps-more-card');
        if (!firstCard) return viewport.clientWidth;
        const gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || '0') || 0;
        return firstCard.getBoundingClientRect().width + gap;
    }

    function measureLoop() {
        if (cards.length < sourceCount * 3) return;
        middleSetStart = cards[sourceCount].offsetLeft;
        const thirdSetStart = cards[sourceCount * 2].offsetLeft;
        singleSetWidth = thirdSetStart - middleSetStart;
        if (!singleSetWidth) return;

        if (viewport.scrollLeft === 0) {
            viewport.scrollLeft = middleSetStart;
            return;
        }

        while (viewport.scrollLeft < middleSetStart) viewport.scrollLeft += singleSetWidth;
        while (viewport.scrollLeft >= (middleSetStart + singleSetWidth)) viewport.scrollLeft -= singleSetWidth;
    }

    function normalizeLoopPosition() {
        if (!singleSetWidth) return;
        while (viewport.scrollLeft < middleSetStart) viewport.scrollLeft += singleSetWidth;
        while (viewport.scrollLeft >= (middleSetStart + singleSetWidth)) viewport.scrollLeft -= singleSetWidth;
    }

    function scrollByStep(direction) {
        pauseAutoUntil = performance.now() + 2500;
        viewport.scrollBy({
            left: getScrollStep() * direction,
            behavior: 'smooth'
        });
        window.setTimeout(normalizeLoopPosition, 420);
    }

    function loopTick(ts) {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;

        if (!reduceMotionQuery.matches && ts >= pauseAutoUntil && singleSetWidth) {
            viewport.scrollLeft += autoSpeedPxPerSecond * dt;
            normalizeLoopPosition();
        }

        autoRaf = window.requestAnimationFrame(loopTick);
    }

    function pauseAutoTemporarily() {
        pauseAutoUntil = performance.now() + 1800;
    }

    prevBtn.addEventListener('click', () => scrollByStep(-1));
    nextBtn.addEventListener('click', () => scrollByStep(1));
    viewport.addEventListener('scroll', pauseAutoTemporarily, { passive: true });
    viewport.addEventListener('wheel', pauseAutoTemporarily, { passive: true });
    section.addEventListener('mouseenter', () => {
        pauseAutoUntil = Number.POSITIVE_INFINITY;
    });
    section.addEventListener('mouseleave', () => {
        pauseAutoUntil = performance.now() + 1000;
    });
    window.addEventListener('resize', measureLoop);
    measureLoop();
    autoRaf = window.requestAnimationFrame(loopTick);
    window.addEventListener('beforeunload', () => {
        if (autoRaf) window.cancelAnimationFrame(autoRaf);
    }, { once: true });
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
renderMoreProjectsSection();
updateToggleState();
collapseNav();
updateNavOnScroll();
scheduleNavContrastUpdate();

// Initial update
updateLogoTilt();
