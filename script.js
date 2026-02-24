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
});

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
  const glareEl = document.querySelector('[data-card-glare]');
  const marqueeTracks = Array.from(document.querySelectorAll('.v2-select-works-marquee-track'));
  if (!section || !card || !content) return;

  // Build a robust front/back face flip structure to prevent inverted glitches.
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
  card.appendChild(flip);

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

  const projects = [
    {
      title: 'SONIX — Your Personal Space On Wheels',
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
      tags: ['UXD', 'UXR', 'Branding'],
      images: [
        'assets/images/google-nest.jpg',
        'assets/images/autonomous-vehicle.jpg',
        'assets/images/sync.jpg',
        'assets/images/sea-love.jpg'
      ]
    },
    {
      title: 'Kohler x SCADpro — Future of Hydrotherapy',
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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const motionScale = prefersReducedMotion ? 0 : (isTouch ? v2SelectWorksConfig.touchScale : 1);
  let sectionTop = section.offsetTop;

  const applyProjectToFace = (refs, index, side = 'front') => {
    const project = projects[index];
    if (!project) return;
    const projectKey = `${project.title}`;
    if (side === 'front' && projectKey === activeFrontKey) {
      return;
    }
    if (side === 'back' && projectKey === activeBackKey) {
      return;
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
  };

  applyProjectToFace(front, 0, 'front');
  applyProjectToFace(back, 1 % projects.length, 'back');

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

  const updateScrollProgress = () => {
    // Drive phases using viewport steps from section start:
    // 0..1: Select Works viewport
    // 1..2: card-only centered viewport
    // 2..(2+projects): rotating project viewports
    sectionTop = section.offsetTop;
    const vh = Math.max(1, window.innerHeight);
    const rawSteps = (window.scrollY - sectionTop) / vh;
    const maxSteps = leadSegments + holdSegments + projects.length - 1e-6;
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
      const panelShiftPx = (1 - introProgress) * (window.innerHeight * 0.18) + (window.innerHeight * 0.08);
      section.style.setProperty('--v2-panel-shift', `${panelShiftPx.toFixed(2)}px`);
      const revealShiftPx = (1 - introProgress) * (window.innerHeight * 0.28) + (window.innerHeight * 0.12);
      section.style.setProperty('--v2-card-shift', `${revealShiftPx.toFixed(2)}px`);
      section.style.setProperty('--v2-card-opacity', '1');
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
      angle = 0;
    } else if (timelineFloat < leadSegments + holdSegments) {
      section.style.setProperty('--v2-header-opacity', '0');
      section.style.setProperty('--v2-header-shift', '-36px');
      section.style.setProperty('--v2-header-max-h', '0px');
      section.style.setProperty('--v2-header-gap', '0px');
      section.style.setProperty('--v2-panel-shift', '0px');
      section.style.setProperty('--v2-card-shift', '0px');
      section.style.setProperty('--v2-card-opacity', '1');
      angle = 0;
    } else {
      rotationStarted = true;
      section.style.setProperty('--v2-header-opacity', '0');
      section.style.setProperty('--v2-header-shift', '-36px');
      section.style.setProperty('--v2-header-max-h', '0px');
      section.style.setProperty('--v2-header-gap', '0px');
      section.style.setProperty('--v2-panel-shift', '0px');
      section.style.setProperty('--v2-card-shift', '0px');
      section.style.setProperty('--v2-card-opacity', '1');

      const rotationFloat = timelineFloat - leadSegments - holdSegments;
      segmentIndex = Math.floor(rotationFloat);
      localProgress = rotationFloat - segmentIndex;
      angle = localProgress * 180;
    }

    currentX += (targetX - currentX) * v2SelectWorksConfig.spring;
    currentY += (targetY - currentY) * v2SelectWorksConfig.spring;

    let visibleProjectIndex = 0;
    let nextProjectIndex = 1 % projects.length;
    if (rotationStarted) {
      const currentProjectIndex = segmentIndex % projects.length;
      nextProjectIndex = (currentProjectIndex + 1) % projects.length;
      // Swap project at half-turn so the back face shows the next project.
      visibleProjectIndex = localProgress >= 0.5 ? nextProjectIndex : currentProjectIndex;
      applyProjectToFace(front, currentProjectIndex, 'front');
      applyProjectToFace(back, nextProjectIndex, 'back');
    } else {
      applyProjectToFace(front, 0, 'front');
      applyProjectToFace(back, 1 % projects.length, 'back');
    }
    if (marqueeTracks.length) {
      const marqueeProject = projects[visibleProjectIndex] || projects[0];
      marqueeTracks.forEach((track) => {
        track.innerHTML = Array.from({ length: 6 }, () => `<span>${marqueeProject.title.split('—')[0].trim().toUpperCase()}</span>`).join('');
      });
    }

    const effectiveAngle = (prefersReducedMotion || !rotationStarted) ? 0 : angle;
    const driftX = (currentY * v2SelectWorksConfig.drift) / v2SelectWorksConfig.tiltRange;
    const driftY = (-currentX * v2SelectWorksConfig.drift) / v2SelectWorksConfig.tiltRange;
    card.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
    flip.style.transform = `rotateX(${effectiveAngle.toFixed(3)}deg)`;

    requestAnimationFrame(animate);
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();
  requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', initV2SelectWorksCard);
