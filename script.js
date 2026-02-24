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

document.addEventListener('DOMContentLoaded', initV2Hero);
