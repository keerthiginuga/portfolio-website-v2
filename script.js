/* ══════════════════════════════════════
   HOME PAGE — Main Script
   ══════════════════════════════════════
   Depends on: js/utils.js, js/data.js, js/nav.js, js/components.js
   Each section is a self-contained init function. A single
   DOMContentLoaded listener bootstraps everything.
*/

/* ── Configuration constants ──────────────────────────────────────────── */

const HERO_CONFIG = {
  pointerStrength: 26,
  scrollStrength: 0.06,
  smoothing: 0.08,
  touchScale: 0.45
};

const SELECT_WORKS_CONFIG = {
  tiltRange: 15,
  spring: 0.08,
  touchScale: 0.45,
  drift: 8,
  leadSegments: 1,
  holdSegments: 1,
  exitSegments: 0  // 0 = unpin happens exactly when last flip completes; exit driven by natural scroll-away
};

const QUOTE_CURSOR_CONFIG = {
  size: 120,
  lerp: 0.14
};

/* ── Hero parallax state ──────────────────────────────────────────────── */

let heroPointer = { x: 0, y: 0 };
let heroCurrent = { x: 0, y: 0 };
let heroScrollOffset = 0;
let heroCards = [];
let heroMotionScale = 1;
let heroAnimFrame = null;

/* ── Scroll restoration ───────────────────────────────────────────────── */

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', () => {
  if (document.body.classList.contains('v2-home')) {
    window.scrollTo(0, 0);
  }
});

/* ══════════════════════════════════════
   1. HERO PARALLAX
   ══════════════════════════════════════ */

function initHeroParallax() {
  if (!heroCards.length) return;

  const animate = () => {
    heroCurrent.x += (heroPointer.x - heroCurrent.x) * HERO_CONFIG.smoothing;
    heroCurrent.y += (heroPointer.y - heroCurrent.y) * HERO_CONFIG.smoothing;

    heroCards.forEach(card => {
      const depth = Number(card.dataset.depth || 0.5);
      const x = heroCurrent.x * depth * heroMotionScale;
      const y = (heroCurrent.y * depth + heroScrollOffset * depth) * heroMotionScale;
      card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    heroAnimFrame = requestAnimationFrame(animate);
  };

  if (heroAnimFrame) cancelAnimationFrame(heroAnimFrame);
  heroAnimFrame = requestAnimationFrame(animate);
}

function initHero() {
  const hero = document.querySelector('.v2-hero');
  const group = document.querySelector('[data-parallax-group="hero"]');
  if (!hero || !group) return;

  heroCards = Array.from(group.querySelectorAll('.v2-hero-card'));
  if (!heroCards.length) return;

  heroMotionScale = getMotionScale(HERO_CONFIG.touchScale);

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    heroPointer.x = ((e.clientX - cx) / cx) * HERO_CONFIG.pointerStrength;
    heroPointer.y = ((e.clientY - cy) / cy) * HERO_CONFIG.pointerStrength;
  });

  document.addEventListener('mouseleave', () => {
    heroPointer.x = 0;
    heroPointer.y = 0;
  });

  window.addEventListener('scroll', () => {
    const rect = hero.getBoundingClientRect();
    const progress = clampValue(-rect.top / Math.max(rect.height, 1), 0, 1);
    heroScrollOffset = progress * (window.innerHeight * HERO_CONFIG.scrollStrength);
  }, { passive: true });

  window.addEventListener('resize', () => {
    heroMotionScale = getMotionScale(HERO_CONFIG.touchScale);
  });

  initHeroParallax();
}

/* ══════════════════════════════════════
   2. LOGO ROTATION ON SCROLL
   ══════════════════════════════════════ */

function initLogoRotation() {
  const logo = document.getElementById('mainLogo');
  if (!logo) return;

  let rafId = null;

  window.addEventListener('scroll', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const scrollableDist = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableDist > 0 ? (window.scrollY / scrollableDist) : 0;
      logo.style.transform = `rotate(${(progress * 360).toFixed(1)}deg)`;
      rafId = null;
    });
  }, { passive: true });
}

/* ══════════════════════════════════════
   3. SELECT WORKS — Flip Card
   ══════════════════════════════════════ */

function initSelectWorksCard() {
  const section = document.querySelector('.v2-select-works');
  const card = document.querySelector('[data-parallax-card]');
  const content = document.querySelector('[data-card-content]');
  const marqueeTracks = Array.from(document.querySelectorAll('.v2-select-works-marquee-track'));
  if (!section || !card || !content) return;
  if (card.querySelector('[data-card-flip]')) return;

  /* ── Build flip DOM ── */
  const tilt = document.createElement('div');
  tilt.className = 'v2-sonix-tilt';

  const flip = document.createElement('div');
  flip.className = 'v2-sonix-flip';
  flip.setAttribute('data-card-flip', '');

  const frontFace = content;
  frontFace.classList.add('v2-sonix-face', 'v2-sonix-face--front');
  frontFace.removeAttribute('data-card-content');

  const backFace = frontFace.cloneNode(true);
  backFace.classList.remove('v2-sonix-face--front');
  backFace.classList.add('v2-sonix-face', 'v2-sonix-face--back');

  flip.appendChild(frontFace);
  flip.appendChild(backFace);
  tilt.appendChild(flip);
  card.appendChild(tilt);

  /* ── Face references ── */
  const getFaceRefs = (faceNode) => ({
    stage: faceNode.querySelector('[data-card-stage]'),
    title: faceNode.querySelector('[data-project-title]'),
    tags: faceNode.querySelector('[data-project-tags]'),
    layers: Array.from(faceNode.querySelectorAll('img[data-layer]'))
  });

  const front = getFaceRefs(frontFace);
  const back = getFaceRefs(backFace);
  if (!front.stage || !front.title || !front.tags || !front.layers.length) return;
  if (!back.stage || !back.title || !back.tags || !back.layers.length) return;

  const glareEl = frontFace.querySelector('[data-card-glare]');
  const marqueeEl = section.querySelector('.v2-select-works-marquee');

  /* ── Project data from shared source ── */
  const projects = getSelectWorksProjects();

  const { leadSegments, holdSegments, exitSegments } = SELECT_WORKS_CONFIG;
  const stickyEl = section.querySelector('.v2-select-works-sticky');
  const headerEl = section.querySelector('.v2-select-works-header');
  section.style.setProperty('--v2-project-count', String(projects.length));
  section.style.setProperty('--v2-lead-segments', String(leadSegments));
  section.style.setProperty('--v2-hold-segments', String(holdSegments));
  section.style.setProperty('--v2-exit-segments', String(exitSegments));

  /* ── State ── */
  let angle = 0;
  let scrollProgress = 0;
  let currentRawSteps = 0;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let activeFrontKey = '';
  let activeBackKey = '';
  let activeMarqueeKey = '';

  const isReducedMotion = prefersReducedMotion();
  const motionScale = getMotionScale(SELECT_WORKS_CONFIG.touchScale);
  let sectionTop = section.offsetTop;

  /* ── Apply project to a card face ── */
  const applyProjectToFace = (refs, index, side = 'front') => {
    const project = projects[index];
    if (!project) return false;
    const key = project.title;

    if (side === 'front' && key === activeFrontKey) return false;
    if (side === 'back' && key === activeBackKey) return false;
    if (side === 'front') activeFrontKey = key;
    if (side === 'back') activeBackKey = key;

    refs.title.textContent = project.title;
    refs.tags.innerHTML = '';
    project.tags.forEach(tag => {
      const chip = document.createElement('span');
      chip.textContent = tag;
      refs.tags.appendChild(chip);
    });

    refs.layers.forEach((layer, i) => {
      if (project.images[i]) {
        layer.src = project.images[i];
        layer.style.display = 'block';
      } else {
        layer.style.display = 'none';
      }
    });
    return true;
  };

  applyProjectToFace(front, 0, 'front');
  applyProjectToFace(back, 1 % projects.length, 'back');

  /* ── Marquee helpers ── */
  const marqueeMarkup = (key) => {
    const safe = escapeHtml(key.trim().toUpperCase());
    // Increased from 4 to 12 to guarantee seamless looping now that fonts are 0.6x smaller and words are shorter
    return Array.from({ length: 12 }, () =>
      `<span>${safe}</span>`
    ).join('');
  };

  const setMarquee = (projectIndex) => {
    const project = projects[projectIndex] || projects[0];
    const key = project.marqueeKey.trim().toUpperCase();
    if (key === activeMarqueeKey) return;
    activeMarqueeKey = key;
    const markup = marqueeMarkup(key);
    marqueeTracks.forEach(track => { track.innerHTML = markup; });
  };

  setMarquee(0);

  /* ── Layout sync ── */
  const syncFlipHeight = () => {
    const height = Math.ceil(frontFace.getBoundingClientRect().height);
    if (!height) return;
    flip.style.height = `${height}px`;
    tilt.style.height = `${height}px`;
  };

  /* ── Mouse tilt ── */
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    targetY = ((x - 0.5) * 2) * SELECT_WORKS_CONFIG.tiltRange * motionScale;
    targetX = ((0.5 - y) * 2) * SELECT_WORKS_CONFIG.tiltRange * motionScale;
    if (glareEl) {
      card.style.setProperty('--glare-x', `${(x * 100).toFixed(2)}%`);
      card.style.setProperty('--glare-y', `${(y * 100).toFixed(2)}%`);
      card.style.setProperty('--glare-opacity', '0.95');
    }
  });

  card.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    card.style.setProperty('--glare-x', '50%');
    card.style.setProperty('--glare-y', '50%');
    card.style.setProperty('--glare-opacity', '0.7');
  });

  /* ── Scroll progress ── */
  const updateScrollProgress = () => {
    const rect = section.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    // CRITICAL: Use headerEl.offsetHeight (static) NOT stickyEl.offsetTop (dynamic).
    // When position:sticky engages, the browser increases stickyEl.offsetTop in sync
    // with the scroll, which cancels out the math and locks scrollProgress at 0.
    // headerEl.offsetHeight is the true static distance from section top to the pin point.
    const pinOffset = headerEl ? headerEl.offsetHeight : 0;
    const scrolledPastPin = -(rect.top + pinOffset);
    currentRawSteps = Math.max(0, scrolledPastPin) / vh;
    const maxSteps = holdSegments + (projects.length - 1) + exitSegments;
    scrollProgress = clampValue(currentRawSteps, 0, maxSteps);
  };

  /* ── Animation loop ── */
  const animate = () => {
    const t = scrollProgress;
    const maxStepsForOverscroll = holdSegments + (projects.length - 1) + exitSegments;
    const overScroll = Math.max(0, currentRawSteps - maxStepsForOverscroll);

    let segmentIndex = 0;
    let localProgress = 0;
    let rotationStarted = true; // Always in the hold/rotation phase now that t starts at pin

    {  // Hold/Rotation/Exit phase: t = 0 when the sticky pins, grows with each 100svh scrolled.
      // Hold is the first `holdSegments` viewport-heights. Rotation starts after that.
      const rotationFloat = Math.max(0, t - holdSegments);
      const maxFlipSteps = holdSegments + (projects.length - 1); // = t when last flip completes

      // 1. Calculate routine card rotation, capped at final project
      const clampedRotation = Math.min(rotationFloat, projects.length - 1);
      segmentIndex = Math.floor(clampedRotation);
      localProgress = clampedRotation - segmentIndex;
      angle = localProgress * 180;

      // 2. Exit: starts the MOMENT the section unpins (exitSegments=0 means unpin == last flip).
      //    Drive exit using UNCLAMPED currentRawSteps so the fade tracks the physical scroll-away.
      //    scrollProgress (clamped) can never power this — it stops changing at unpin.
      if (rotationFloat >= projects.length - 1) {
        const rawExit = Math.max(0, currentRawSteps - maxFlipSteps);
        const exitProgress = Math.min(1, rawExit);
        const eased = exitProgress * exitProgress * (3 - 2 * exitProgress);
        section.style.setProperty('--v2-card-scale', (1 - eased * 0.18).toFixed(4));
        section.style.setProperty('--v2-card-opacity', (1 - eased).toFixed(4));
        section.style.setProperty('--v2-marquee-opacity', (1 - eased).toFixed(4));

        // Lock the final card flat during exit.
        // localProgress MUST be 0 here: setting it to 1 would tell the data layer
        // "flipped 100% to next project", wrapping nextProjectIndex to 0 (SONIX).
        // At localProgress=0, visibleProjectIndex correctly stays on the last project (NEST).
        angle = 0;
        segmentIndex = projects.length - 1;
        localProgress = 0;
      } else {
        /* Normal rotation phase: fully visible */
        section.style.setProperty('--v2-card-scale', '1');
        section.style.setProperty('--v2-card-opacity', '1');
        section.style.setProperty('--v2-marquee-opacity', '1');
      }
    }

    /* ── Tilt spring ── */
    currentX += (targetX - currentX) * SELECT_WORKS_CONFIG.spring;
    currentY += (targetY - currentY) * SELECT_WORKS_CONFIG.spring;

    /* ── Project face management ── */
    let visibleProjectIndex = 0;
    let nextProjectIndex = 1 % projects.length;
    let didUpdateFront = false;
    let didUpdateBack = false;

    if (rotationStarted) {
      const curIdx = segmentIndex % projects.length;
      nextProjectIndex = (curIdx + 1) % projects.length;
      visibleProjectIndex = localProgress >= 0.5 ? nextProjectIndex : curIdx;
      didUpdateFront = applyProjectToFace(front, curIdx, 'front');
      didUpdateBack = applyProjectToFace(back, nextProjectIndex, 'back');
    } else {
      didUpdateFront = applyProjectToFace(front, 0, 'front');
      didUpdateBack = applyProjectToFace(back, 1 % projects.length, 'back');
    }

    if (didUpdateFront || didUpdateBack) syncFlipHeight();
    if (marqueeTracks.length) setMarquee(visibleProjectIndex);

    /* ── Flip geometry ── */
    const effectiveAngle = (isReducedMotion || !rotationStarted) ? 0 : angle;

    /* ── Marquee Vertical Slide ── */
    let translateYPercent = 0;
    if (effectiveAngle <= 90) {
      translateYPercent = -((effectiveAngle / 90) * 150);
    } else {
      translateYPercent = (1 - ((effectiveAngle - 90) / 90)) * 150;
    }
    section.style.setProperty('--v2-marquee-y', `${translateYPercent.toFixed(2)}%`);

    if (marqueeEl) {
      marqueeEl.style.transformOrigin = '';
      marqueeEl.style.transform = '';
    }

    /* ── Tilt + drift transforms ── */
    const driftX = (currentY * SELECT_WORKS_CONFIG.drift) / SELECT_WORKS_CONFIG.tiltRange;
    const driftY = (-currentX * SELECT_WORKS_CONFIG.drift) / SELECT_WORKS_CONFIG.tiltRange;
    tilt.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
    flip.style.transform = `rotateX(${effectiveAngle.toFixed(3)}deg)`;
  };

  /* ── Intersection Observer for performance ── */
  let isVisible = false;
  let rafId = null;

  const loop = () => {
    if (!isVisible) return;
    animate();
    rafId = requestAnimationFrame(loop);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (!rafId) loop();
      } else {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    });
  }, { rootMargin: "100px 0px 100px 0px" });

  observer.observe(section);

  /* ── Bind events ── */
  window.addEventListener('scroll', () => {
    if (isVisible) updateScrollProgress();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (isVisible) {
      updateScrollProgress();
      syncFlipHeight();
    }
  });

  syncFlipHeight();
  updateScrollProgress();
}

/* ══════════════════════════════════════
   4. SKILLS ACCORDION
   ══════════════════════════════════════ */

function initSkills() {
  const accordion = document.querySelector('.v2-skills-accordion');
  const items = document.querySelectorAll('.v2-skills-item[data-skill]');
  if (!accordion || !items.length) return;

  if (document.querySelector('.v2-skills-item.is-open')) {
    accordion.classList.add('has-active');
  }

  items.forEach(item => {
    const row = item.querySelector('.v2-skills-row');
    if (!row) return;

    row.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      items.forEach(i => i.classList.remove('is-open'));

      if (!wasOpen) {
        item.classList.add('is-open');
        accordion.classList.add('has-active');

        // Scroll down minimally if the expanded content overflows the bottom
        setTimeout(() => {
          const rect = item.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          if (rect.bottom > viewportHeight) {
            const distanceToScroll = rect.bottom - viewportHeight + 40;
            window.scrollBy({ top: distanceToScroll, behavior: 'smooth' });
          }
        }, 450);
      } else {
        accordion.classList.remove('has-active');
      }
    });
  });
}

/* ══════════════════════════════════════
   5. QUOTE — Word Fill + Parallax Image
   ══════════════════════════════════════ */

function initQuote() {
  const section = document.querySelector('.v2-quote');
  const words = document.querySelectorAll('.v2-quote-word');
  const photo = document.getElementById('quotePhoto');
  if (!section || !words.length) return;

  function tick() {
    const rect = section.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const sectionH = section.offsetHeight;
    const entered = viewportH - rect.top;
    const totalTravel = sectionH + viewportH;
    const progress = clampValue(entered / totalTravel, 0, 1);

    /* Word fill */
    words.forEach((word, i) => {
      const wordStart = 0.12 + (i / words.length) * 0.28;
      const wordEnd = wordStart + 0.10;
      const t = clampValue((progress - wordStart) / (wordEnd - wordStart), 0, 1);
      word.style.color = `rgba(249,253,254,${(0.08 + t * 0.92).toFixed(3)})`;
    });

    /* Image parallax */
    if (photo) {
      if (progress > 0.02 && !photo.classList.contains('is-visible')) {
        photo.classList.add('is-visible');
      }
      const ty = 140 - progress * 280;
      photo.style.transform = `translateY(${ty.toFixed(1)}%)`;
    }
  }

  let rafId = null;
  window.addEventListener('scroll', () => {
    if (!rafId) rafId = requestAnimationFrame(() => { tick(); rafId = null; });
  }, { passive: true });
  tick();
}

/* ══════════════════════════════════════
   6. SEE ALL WORKS — Intersection Fade
   ══════════════════════════════════════ */

function initSeeAllAnimation() {
  const container = document.querySelector('.v2-see-all-container');
  if (!container) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0.5) {
        container.classList.add('is-visible');
      } else if (entry.intersectionRatio === 0) {
        container.classList.remove('is-visible');
      }
    });
  }, { threshold: [0, 0.6] });

  observer.observe(container);
}

/* ══════════════════════════════════════
   7. QUOTE CURSOR — Liquid Glass Shader
   ══════════════════════════════════════ */

function initQuoteCursor() {
  const photoLink = document.querySelector('.v2-quote-photo-link');
  const quoteText = document.getElementById('quoteText');
  const cursor = document.getElementById('quoteCursor');
  if (!cursor) return;

  /* Collect all hover targets — image link + quote text */
  const targets = [photoLink, quoteText].filter(Boolean);
  if (!targets.length) return;

  /* ── LERP cursor position ── */
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let isHovering = false;
  let rafId = null;

  const animateCursor = () => {
    if (!isHovering) return;
    cursorX = lerp(cursorX, mouseX, QUOTE_CURSOR_CONFIG.lerp);
    cursorY = lerp(cursorY, mouseY, QUOTE_CURSOR_CONFIG.lerp);
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) scale(1)`;
    rafId = requestAnimationFrame(animateCursor);
  };

  targets.forEach(target => {
    target.addEventListener('mouseenter', e => {
      isHovering = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorX = mouseX;
      cursorY = mouseY;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) scale(0)`;
      cursor.classList.add('is-active');
      if (rafId) cancelAnimationFrame(rafId);
      animateCursor();
    });

    target.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    target.addEventListener('mouseleave', () => {
      isHovering = false;
      cursor.classList.remove('is-active');
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    });
  });

  if (quoteText) {
    quoteText.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.add('v2-page-transitioning');
      setTimeout(() => {
        window.location.href = 'about.html';
      }, 400); // Wait for fade-out animation
    });
  }
}

/* ══════════════════════════════════════
   BOOTSTRAP — Single DOMContentLoaded
   ══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Inject shared layout (nav, logo, SVG filter)
  injectSharedLayout();

  if (document.body.classList.contains('v2-home')) {
    window.scrollTo(0, 0);
  }

  // Initialize global smooth scrolling (Lenis)
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      lerp: 0.08,
      smooth: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect Lenis to the shared navigation logic
    let lastNavScroll = 0;
    lenis.on('scroll', (e) => {
      lastNavScroll = updateNavOnScroll(e.scroll, lastNavScroll);
    });
  } else {
    // Fallback if Lenis fails to load
    initNavScroll();
  }

  // Init all home page features
  initHero();
  initLogoRotation();
  initSelectWorksCard();
  initSkills();
  initQuote();
  initSeeAllAnimation();
  initQuoteCursor();
});
