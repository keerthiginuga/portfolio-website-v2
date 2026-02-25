const v2MotionConfig = {
  pointerStrength: 26,
  scrollStrength: 0.06,
  smoothing: 0.08,
  touchScale: 0.45,
  reducedMotionScale: 0
};

let v2Pointer = { x: 0, y: 0 };
let v2Current = { x: 0, y: 0 };
let v2ScrollOffset = 0;
let v2HeroCards = [];
let v2MotionScale = 1;
let v2AnimationFrame = null;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', () => {
  if (document.body.classList.contains('v2-home')) {
    window.scrollTo(0, 0);
  }
});

function applyV2ResponsiveMotion() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (prefersReducedMotion) {
    v2MotionScale = v2MotionConfig.reducedMotionScale;
    return;
  }

  v2MotionScale = isTouch ? v2MotionConfig.touchScale : 1;
}

function initV2HeroParallax() {
  if (!v2HeroCards.length) return;

  const animate = () => {
    v2Current.x += (v2Pointer.x - v2Current.x) * v2MotionConfig.smoothing;
    v2Current.y += (v2Pointer.y - v2Current.y) * v2MotionConfig.smoothing;

    v2HeroCards.forEach((card) => {
      const depth = Number(card.dataset.depth || 0.5);
      const x = v2Current.x * depth * v2MotionScale;
      const y = (v2Current.y * depth + v2ScrollOffset * depth) * v2MotionScale;
      card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    v2AnimationFrame = window.requestAnimationFrame(animate);
  };

  if (v2AnimationFrame) {
    window.cancelAnimationFrame(v2AnimationFrame);
  }

  v2AnimationFrame = window.requestAnimationFrame(animate);
}

function initV2Hero() {
  const v2Hero = document.querySelector('.v2-hero');
  const v2ParallaxGroup = document.querySelector('[data-parallax-group="hero"]');
  if (!v2Hero || !v2ParallaxGroup) return;

  v2HeroCards = Array.from(v2ParallaxGroup.querySelectorAll('.v2-hero-card'));
  if (!v2HeroCards.length) return;

  applyV2ResponsiveMotion();

  const onMouseMove = (event) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    v2Pointer.x = ((event.clientX - centerX) / centerX) * v2MotionConfig.pointerStrength;
    v2Pointer.y = ((event.clientY - centerY) / centerY) * v2MotionConfig.pointerStrength;
  };

  const onMouseLeave = () => {
    v2Pointer.x = 0;
    v2Pointer.y = 0;
  };

  const onScroll = () => {
    const rect = v2Hero.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
    v2ScrollOffset = progress * (window.innerHeight * v2MotionConfig.scrollStrength);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', applyV2ResponsiveMotion);

  onScroll();
  initV2HeroParallax();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('v2-home')) {
    window.scrollTo(0, 0);
  }
  initV2Hero();
  initV2LogoRotation();
});

/* ── Logo Rotation on Scroll ── */
function initV2LogoRotation() {
  const logo = document.getElementById('mainLogo');
  if (!logo) return;

  let rafId = null;

  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      // Calculate scroll progress (0 at top, 1 at very bottom)
      const scrollableDist = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableDist > 0 ? (window.scrollY / scrollableDist) : 0;
      // Map progress to 0-360 degrees
      const angle = progress * 360;
      logo.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      rafId = null;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

const v2SelectWorksConfig = {
  tiltRange: 15,
  spring: 0.08,
  touchScale: 0.45,
  drift: 8
};

function initV2SelectWorksCard() {
  const section = document.querySelector('.v2-select-works');
  const card = document.querySelector('[data-parallax-card]');
  const content = document.querySelector('[data-card-content]');
  const marqueeTracks = Array.from(document.querySelectorAll('.v2-select-works-marquee-track'));
  if (!section || !card || !content) return;
  if (card.querySelector('[data-card-flip]')) return;

  // Layering model: perspective(card) -> tilt -> flip -> front/back faces.
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

  const projects = [
    {
      title: 'Sonix — Your Personal Space On Wheels',
      marqueeKey: 'SONIX',
      tags: ['UXD', 'UXR', 'Branding'],
      images: [
        'assets/images/autonomous-vehicle.jpg',
        'assets/images/sync.jpg',
        'assets/images/google-nest.jpg',
        'assets/images/7west.jpg'
      ]
    },
    {
      title: 'SeaLove Candle Bar Re-Design',
      marqueeKey: 'SEALOVE',
      tags: ['UXD', 'UXR', 'IA', 'Branding'],
      images: [
        'assets/images/sea-love.jpg',
        'assets/images/kroger.jpg',
        'assets/images/word-clock.jpg',
        'assets/images/zillow.jpg'
      ]
    },
    {
      title: 'Google Nest Thermostat for Office Space',
      marqueeKey: 'GOOGLE NEST',
      tags: ['UXD', 'UXR', 'Branding'],
      images: [
        'assets/images/google-nest.jpg',
        'assets/images/autonomous-vehicle.jpg',
        'assets/images/sync.jpg',
        'assets/images/sea-love.jpg'
      ]
    },
    {
      title: 'Kohler × SCADpro — Future of Hydrotherapy',
      marqueeKey: 'KOHLER',
      tags: ['Lead UXD', 'UXR', 'Product Design'],
      images: [
        'assets/images/kohler-scadpro.jpg',
        'assets/images/7west.jpg',
        'assets/images/google-nest.jpg',
        'assets/images/word-clock.jpg'
      ]
    }
  ];

  const leadSegments = 2;
  const holdSegments = 1;
  section.style.setProperty('--v2-project-count', String(projects.length));
  section.style.setProperty('--v2-lead-segments', String(leadSegments));
  section.style.setProperty('--v2-hold-segments', String(holdSegments));

  let angle = 0;
  let scrollProgress = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let activeFrontKey = '';
  let activeBackKey = '';
  let activeMarqueeKey = '';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const motionScale = prefersReducedMotion ? 0 : (isTouch ? v2SelectWorksConfig.touchScale : 1);
  let sectionTop = section.offsetTop;

  const applyProjectToFace = (refs, index, side = 'front') => {
    const project = projects[index];
    if (!project) return false;
    const projectKey = `${project.title}`;
    if (side === 'front' && projectKey === activeFrontKey) {
      return false;
    }
    if (side === 'back' && projectKey === activeBackKey) {
      return false;
    }
    if (side === 'front') activeFrontKey = projectKey;
    if (side === 'back') activeBackKey = projectKey;

    refs.title.textContent = project.title;

    refs.tags.innerHTML = '';
    project.tags.forEach((tag) => {
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

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const marqueeMarkup = (key) => {
    const safe = escapeHtml(key.trim().toUpperCase());
    return Array.from({ length: 8 }, () =>
      `<span class="v2-marquee-word"><span class="v2-marquee-word-half is-left">${safe}</span><span class="v2-marquee-word-half is-right">${safe}</span></span>`
    ).join('');
  };

  const setMarquee = (projectIndex) => {
    const project = projects[projectIndex] || projects[0];
    const key = (project.marqueeKey || project.title).trim().toUpperCase();
    if (key === activeMarqueeKey) return;
    activeMarqueeKey = key;
    const markup = marqueeMarkup(key);
    marqueeTracks.forEach((track) => { track.innerHTML = markup; });
  };

  // Immediately seed the marquee so it's correct on first paint
  setMarquee(0);

  const syncFlipHeight = () => {
    const height = Math.ceil(frontFace.getBoundingClientRect().height);
    if (!height) return;
    flip.style.height = `${height}px`;
    tilt.style.height = `${height}px`;
  };

  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    targetY = ((x - 0.5) * 2) * v2SelectWorksConfig.tiltRange * motionScale;
    targetX = ((0.5 - y) * 2) * v2SelectWorksConfig.tiltRange * motionScale;
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

  const exitSegments = 1;
  section.style.setProperty('--v2-exit-segments', String(exitSegments));

  const updateScrollProgress = () => {
    sectionTop = section.offsetTop;
    const vh = Math.max(1, window.innerHeight);
    const rawSteps = (window.scrollY - sectionTop) / vh;
    // +exitSegments to allow the scroll to continue into the exit phase
    const maxSteps = leadSegments + holdSegments + projects.length + exitSegments;
    scrollProgress = Math.max(0, Math.min(maxSteps, rawSteps));
  };

  const animate = () => {
    // Timeline segments:
    // [0..1) heading-focused intro -> heading + most of card
    // [1..2) heading fades -> card-only centered (no flipping)
    // [2..3) hold centered card (no flipping)
    // [3..] flipping project segments (180deg each)
    const timelineFloat = scrollProgress;

    let segmentIndex = 0;
    let localProgress = 0;
    let rotationStarted = false;

    if (timelineFloat < 1) {
      const introProgress = timelineFloat;
      section.style.setProperty('--v2-header-opacity', '1');
      section.style.setProperty('--v2-header-shift', '0px');
      section.style.setProperty('--v2-header-max-h', '420px');
      section.style.setProperty('--v2-header-gap', '54px');
      // Panel shift: starts at 0 so heading is immediately visible on entry
      const panelShiftPx = 0;
      section.style.setProperty('--v2-panel-shift', `${panelShiftPx.toFixed(2)}px`);
      // Card starts just 10% below so it's visible but below heading, then rises
      const revealShiftPx = (1 - introProgress) * (window.innerHeight * 0.10);
      section.style.setProperty('--v2-card-shift', `${revealShiftPx.toFixed(2)}px`);
      section.style.setProperty('--v2-card-opacity', '1');
      section.style.setProperty('--v2-card-scale', '1');
      angle = 0;
    } else if (timelineFloat < 2) {
      const midProgress = timelineFloat - 1;
      const headerOpacity = Math.max(0, 1 - midProgress);
      section.style.setProperty('--v2-header-opacity', headerOpacity.toFixed(3));
      section.style.setProperty('--v2-header-shift', `${(-36 * midProgress).toFixed(2)}px`);
      section.style.setProperty('--v2-header-max-h', `${Math.max(0, 420 * (1 - midProgress)).toFixed(2)}px`);
      section.style.setProperty('--v2-header-gap', `${Math.max(0, 54 * (1 - midProgress)).toFixed(2)}px`);
      const panelShiftPx = (1 - midProgress) * (window.innerHeight * 0.03);
      section.style.setProperty('--v2-panel-shift', `${panelShiftPx.toFixed(2)}px`);
      const midShiftPx = (1 - midProgress) * (window.innerHeight * 0.04);
      section.style.setProperty('--v2-card-shift', `${midShiftPx.toFixed(2)}px`);
      section.style.setProperty('--v2-card-opacity', '1');
      section.style.setProperty('--v2-card-scale', '1');
      angle = 0;
    } else if (timelineFloat < leadSegments + holdSegments) {
      section.style.setProperty('--v2-header-opacity', '0');
      section.style.setProperty('--v2-header-shift', '-36px');
      section.style.setProperty('--v2-header-max-h', '0px');
      section.style.setProperty('--v2-header-gap', '0px');
      section.style.setProperty('--v2-panel-shift', '0px');
      section.style.setProperty('--v2-card-shift', '0px');
      section.style.setProperty('--v2-card-opacity', '1');
      section.style.setProperty('--v2-card-scale', '1');
      angle = 0;
    } else {
      rotationStarted = true;
      section.style.setProperty('--v2-header-opacity', '0');
      section.style.setProperty('--v2-header-shift', '-36px');
      section.style.setProperty('--v2-header-max-h', '0px');
      section.style.setProperty('--v2-header-gap', '0px');
      section.style.setProperty('--v2-panel-shift', '0px');
      section.style.setProperty('--v2-card-shift', '0px');

      const rotationFloat = timelineFloat - leadSegments - holdSegments;

      // ── Exit phase: after all cards have flipped ──
      if (rotationFloat >= projects.length) {
        const exitProgress = Math.min(1, rotationFloat - projects.length);
        // Ease: smoothstep for a natural feel
        const t = exitProgress * exitProgress * (3 - 2 * exitProgress);
        const exitScale = 1 - t * 0.18;      // 1 → 0.82
        const exitOpacity = 1 - t;           // 1 → 0
        section.style.setProperty('--v2-card-scale', exitScale.toFixed(4));
        section.style.setProperty('--v2-card-opacity', exitOpacity.toFixed(4));
        section.style.setProperty('--v2-marquee-opacity', exitOpacity.toFixed(4));
        // Keep angle at 0 (card face showing the last project)
        angle = 0;
        segmentIndex = projects.length - 1;
        localProgress = 1;
      } else {
        section.style.setProperty('--v2-card-scale', '1');
        section.style.setProperty('--v2-card-opacity', '1');
        section.style.setProperty('--v2-marquee-opacity', '1');
        segmentIndex = Math.floor(rotationFloat);
        localProgress = rotationFloat - segmentIndex;
        angle = localProgress * 180;
      }
    }

    currentX += (targetX - currentX) * v2SelectWorksConfig.spring;
    currentY += (targetY - currentY) * v2SelectWorksConfig.spring;

    let visibleProjectIndex = 0;
    let nextProjectIndex = 1 % projects.length;
    let didUpdateFront = false;
    let didUpdateBack = false;
    if (rotationStarted) {
      const currentProjectIndex = segmentIndex % projects.length;
      nextProjectIndex = (currentProjectIndex + 1) % projects.length;
      // Swap project at half-turn so the back face shows the next project.
      visibleProjectIndex = localProgress >= 0.5 ? nextProjectIndex : currentProjectIndex;
      didUpdateFront = applyProjectToFace(front, currentProjectIndex, 'front');
      didUpdateBack = applyProjectToFace(back, nextProjectIndex, 'back');
    } else {
      didUpdateFront = applyProjectToFace(front, 0, 'front');
      didUpdateBack = applyProjectToFace(back, 1 % projects.length, 'back');
    }
    if (didUpdateFront || didUpdateBack) {
      syncFlipHeight();
    }
    if (marqueeTracks.length) {
      setMarquee(visibleProjectIndex);
    }

    const effectiveAngle = (prefersReducedMotion || !rotationStarted) ? 0 : angle;
    const angleRad = (effectiveAngle * Math.PI) / 180;
    const openFactor = Math.abs(Math.sin(angleRad));
    const openPx = Math.min(92, openFactor * 92);
    section.style.setProperty('--v2-marquee-open', `${openPx.toFixed(2)}px`);
    section.style.setProperty('--v2-marquee-opacity', '1');

    // ── 5-state Y-fold animation mapped to flip angle ──
    // State 1 (0°):       scaleY=1, translateY=0   → at rest
    // State 2 (0°→90°):  scaleY 1→0, moves UP     → flattens toward top
    // State 3 (90°):     scaleY=0                 → invisible
    // State 4 (just>90°): jumps to below center    → still invisible
    // State 5 (90°→180°): scaleY 0→1, moves UP    → unfolds from bottom
    if (marqueeEl) {
      const MAX_FOLD_OFFSET = 32; // px
      const textScaleY = Math.abs(Math.cos(angleRad));
      let textTranslateY;
      let textOriginY;
      if (effectiveAngle <= 90) {
        // First half: rise + squish toward top
        textTranslateY = -Math.sin(angleRad) * MAX_FOLD_OFFSET;
        textOriginY = '0%';
      } else {
        // Second half: reappear from below, unfold upward
        const t = (effectiveAngle - 90) * Math.PI / 180;
        textTranslateY = MAX_FOLD_OFFSET * Math.cos(t);
        textOriginY = '100%';
      }
      marqueeEl.style.transformOrigin = `center ${textOriginY}`;
      marqueeEl.style.transform =
        `translateY(calc(-50% + ${textTranslateY.toFixed(2)}px)) scaleY(${textScaleY.toFixed(4)})`;
    }

    const driftX = (currentY * v2SelectWorksConfig.drift) / v2SelectWorksConfig.tiltRange;
    const driftY = (-currentX * v2SelectWorksConfig.drift) / v2SelectWorksConfig.tiltRange;
    tilt.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
    flip.style.transform = `rotateX(${effectiveAngle.toFixed(3)}deg)`;

    requestAnimationFrame(animate);
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', () => {
    updateScrollProgress();
    syncFlipHeight();
  });
  syncFlipHeight();
  updateScrollProgress();
  requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', initV2SelectWorksCard);

/* ── Skills accordion (Kanso-style) ── */
function initV2Skills() {
  const accordion = document.querySelector('.v2-skills-accordion');
  const items = document.querySelectorAll('.v2-skills-item[data-skill]');
  if (!accordion || !items.length) return;

  // Set initial has-active if any item starts open
  if (document.querySelector('.v2-skills-item.is-open')) {
    accordion.classList.add('has-active');
  }

  items.forEach((item) => {
    const row = item.querySelector('.v2-skills-row');
    if (!row) return;

    row.addEventListener('click', () => {
      const isAlreadyOpen = item.classList.contains('is-open');

      // Close all
      items.forEach((i) => i.classList.remove('is-open'));

      if (!isAlreadyOpen) {
        // Open this one
        item.classList.add('is-open');
        accordion.classList.add('has-active');
      } else {
        // All closed
        accordion.classList.remove('has-active');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initV2Skills);

/* ── Quote: sticky scroll \u2014 word fill + fast parallax image ── */
function initV2Quote() {
  const section = document.querySelector('.v2-quote');
  const words = document.querySelectorAll('.v2-quote-word');
  const photo = document.getElementById('quotePhoto');
  if (!section || !words.length) return;

  const total = words.length;

  function tick() {
    const rect = section.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const sectionH = section.offsetHeight;

    // Free-scroll: progress from when section bottom enters viewport to section top exits
    const entered = viewportH - rect.top;
    const total_travel = sectionH + viewportH;
    const progress = Math.max(0, Math.min(1, entered / total_travel));

    /* ── Word fill: each word lights up in sequence across 0–1 progress ── */
    words.forEach((word, i) => {
      const wordStart = (i / words.length) * 0.75;
      const wordEnd = wordStart + 0.15;
      const t = Math.max(0, Math.min(1, (progress - wordStart) / (wordEnd - wordStart)));
      word.style.color = `rgba(249,253,254,${(0.18 + t * 0.82).toFixed(3)})`;
    });

    /* ── Image: matches text fill speed, finishes just after last word ── */
    if (photo) {
      if (progress > 0.02 && !photo.classList.contains('is-visible')) {
        photo.classList.add('is-visible');
      }
      // translateY 120% → -20% finishing slightly after text fills (~87% progress)
      const ty = 120 - progress * 140;
      photo.style.transform = `translateY(${ty.toFixed(1)}%)`;
    }
  }

  let rafId = null;
  window.addEventListener('scroll', () => {
    if (!rafId) rafId = requestAnimationFrame(() => { tick(); rafId = null; });
  }, { passive: true });
  tick();
}

document.addEventListener('DOMContentLoaded', initV2Quote);

/* ── See All Works Parallax Fade ── */
function initV2SeeAllAnimation() {
  const container = document.querySelector('.v2-see-all-container');
  if (!container) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0.5) {
        container.classList.add('is-visible');
      } else if (entry.intersectionRatio === 0) {
        // Only completely remove when out of view to prevent jittering
        container.classList.remove('is-visible');
      }
    });
  }, {
    threshold: [0, 0.6] // Trigger updates at 0% and 60% visibility
  });

  observer.observe(container);
}

document.addEventListener('DOMContentLoaded', initV2SeeAllAnimation);

/* ── Quote Image Liquid Glass Cursor (SVG Displacement Shader) ── */
function initV2QuoteCursor() {
  const photoLink = document.querySelector('.v2-quote-photo-link');
  const cursor = document.getElementById('quoteCursor');
  if (!photoLink || !cursor) return;

  /* ── Shader helpers ── */
  function smoothStep(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function vlen(x, y) { return Math.sqrt(x * x + y * y); }

  /* ── Build SVG filter once ── */
  const CURSOR_SIZE = 120;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK_NS = 'http://www.w3.org/1999/xlink';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:-1;';

  const defs = document.createElementNS(SVG_NS, 'defs');
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.id = 'v2-liquid-glass-filter';
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('colorInterpolationFilters', 'sRGB');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', CURSOR_SIZE.toString());
  filter.setAttribute('height', CURSOR_SIZE.toString());

  const feImage = document.createElementNS(SVG_NS, 'feImage');
  feImage.id = 'v2-liquid-glass-map';
  feImage.setAttribute('width', CURSOR_SIZE.toString());
  feImage.setAttribute('height', CURSOR_SIZE.toString());

  const feDisplace = document.createElementNS(SVG_NS, 'feDisplacementMap');
  feDisplace.setAttribute('in', 'SourceGraphic');
  feDisplace.setAttribute('in2', 'v2-liquid-glass-map');
  feDisplace.setAttribute('xChannelSelector', 'R');
  feDisplace.setAttribute('yChannelSelector', 'G');

  filter.appendChild(feImage);
  filter.appendChild(feDisplace);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  /* ── Hidden canvas for displacement generation ── */
  const canvas = document.createElement('canvas');
  canvas.width = CURSOR_SIZE;
  canvas.height = CURSOR_SIZE;
  canvas.style.display = 'none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  /* ── Compute displacement map from SDF ── */
  function updateShader(normMouseX, normMouseY) {
    const w = CURSOR_SIZE;
    const h = CURSOR_SIZE;
    const data = new Uint8ClampedArray(w * h * 4);
    const rawDx = [];
    const rawDy = [];
    let maxScale = 0;

    for (let i = 0; i < w * h; i++) {
      const px = i % w;
      const py = Math.floor(i / w);
      const uvx = px / w;
      const uvy = py / h;
      const ix = uvx - 0.5;
      const iy = uvy - 0.5;

      const dist = vlen(ix, iy);
      const displacement = smoothStep(0.5, 0.1, dist - 0.12) * 0.35;

      const mx = uvx - normMouseX;
      const my = uvy - normMouseY;
      const mouseDist = vlen(mx, my);
      const mouseInfluence = smoothStep(0.5, 0.0, mouseDist) * 0.15;

      const dx = (ix / Math.max(dist, 0.001)) * displacement + mx * mouseInfluence;
      const dy = (iy / Math.max(dist, 0.001)) * displacement + my * mouseInfluence;

      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      rawDx.push(dx);
      rawDy.push(dy);
    }

    maxScale = Math.max(maxScale, 0.001) * 0.5;

    for (let i = 0; i < w * h; i++) {
      const r = (rawDx[i] / maxScale + 0.5) * 255;
      const g = (rawDy[i] / maxScale + 0.5) * 255;
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 255;
    }

    ctx.putImageData(new ImageData(data, w, h), 0, 0);
    feImage.setAttributeNS(XLINK_NS, 'href', canvas.toDataURL());
    feDisplace.setAttribute('scale', (maxScale).toString());
  }

  updateShader(0.5, 0.5);

  /* ── LERP position state ── */
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let isHovering = false;
  let rafId = null;
  const LERP = 0.14;

  const animate = () => {
    if (!isHovering) return;
    cursorX += (mouseX - cursorX) * LERP;
    cursorY += (mouseY - cursorY) * LERP;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) scale(1)`;

    const rect = cursor.getBoundingClientRect();
    if (rect.width > 0) {
      const relX = Math.max(0, Math.min(1, (mouseX - rect.left) / rect.width));
      const relY = Math.max(0, Math.min(1, (mouseY - rect.top) / rect.height));
      updateShader(relX, relY);
    }
    rafId = requestAnimationFrame(animate);
  };

  photoLink.addEventListener('mouseenter', (e) => {
    isHovering = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorX = mouseX;
    cursorY = mouseY;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) scale(0)`;
    cursor.classList.add('is-active');
    if (rafId) cancelAnimationFrame(rafId);
    animate();
  });

  photoLink.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  photoLink.addEventListener('mouseleave', () => {
    isHovering = false;
    cursor.classList.remove('is-active');
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  });
}

document.addEventListener('DOMContentLoaded', initV2QuoteCursor);
/* ── NAVIGATION HIDE/SHOW ON SCROLL (Ported from V1) ── */
(function () {
  const nav = document.querySelector('.v2-nav');
  if (!nav) return;

  let lastScrollY = window.scrollY;
  let navScrollTicking = false;

  function updateNavVisibility() {
    const currentScrollY = window.scrollY;

    // Add background pill when scrolled
    if (currentScrollY > 20) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }

    // Determine scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling DOWN - collapse nav
      nav.classList.add('nav-collapsed');
    } else {
      // Scrolling UP - show nav
      nav.classList.remove('nav-collapsed');
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', () => {
    if (!navScrollTicking) {
      requestAnimationFrame(() => {
        updateNavVisibility();
        navScrollTicking = false;
      });
      navScrollTicking = true;
    }
  }, { passive: true });

  // Set initial state
  updateNavVisibility();
})();
