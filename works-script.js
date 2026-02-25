/* ══════════════════════════════════════
   WORKS PAGE — Buttery Paced Card Stack

   Architecture:
   ─ Lenis: inertial smooth scroll (lerp for weight)
   ─ Pacing: Each project gets 1.5x screen height of space.
             First 40% = HOLD (solo screen time).
             Last 60% = TRANSITION (next card slides up).
   ─ Deep Hide: Cards start lower than the viewport to avoid peeking.
   ─ Isolated Boost: Velocity only pulls the *currently transitioning* card.
   ─ Floating Settle: Slow dual-lerp for the final 20% of the slide.
══════════════════════════════════════ */

(function () {
    'use strict';

    gsap.registerPlugin(ScrollTrigger);

    var NUM_PROJECTS = 6;
    var NUM_TRANSITIONS = NUM_PROJECTS - 1; // 5

    var main = document.getElementById('worksMain');
    var sticky = document.getElementById('worksSticky');
    var imgStack = document.getElementById('imgStack');
    var slides = document.querySelectorAll('.v2-stack-slide');
    var infoItems = document.querySelectorAll('.v2-stack-info-item');

    // Which project is physically under the cursor (-1 = none, use scroll logic)
    var hoveredProject = -1;

    if (!sticky || !slides.length) return;

    // ── 1. Lenis Smooth Scroll ────────────────────────────────────────────────
    var lenis = new Lenis({
        lerp: 0.08, // weight/momentum
        smooth: true,
        smoothTouch: false,
        direction: 'vertical',
    });

    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop: function (value) {
            if (arguments.length) lenis.scrollTo(value, { immediate: true });
            return lenis.scroll;
        },
        getBoundingClientRect: function () {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: 'fixed',
    });

    ScrollTrigger.addEventListener('refresh', function () { lenis.resize(); });
    ScrollTrigger.refresh();

    // ── 2. Layout ─────────────────────────────────────────────────────────────
    var stickyRect = sticky.getBoundingClientRect();
    var stickyTop = stickyRect.top;

    main.style.display = 'block';
    main.style.minHeight = '';
    main.style.paddingBottom = '0';
    sticky.style.marginTop = stickyTop + 'px';

    // ── 3. Start Position: Deeper Hide ────────────────────────────────────────
    // We compute exactly where the viewport bottom is relative to the stack frame,
    // then ADD 15% so incoming cards are deeply hidden and never peek on jitters.
    var stackRect = imgStack.getBoundingClientRect();
    var distToVpBottom = window.innerHeight - stackRect.top;
    var exactBottomPct = (distToVpBottom / stackRect.height) * 100;
    var startYPercent = exactBottomPct + 15; // 15% deeper hide

    var ySetters = Array.prototype.map.call(slides, function (slide) {
        return gsap.quickSetter(slide, 'yPercent');
    });

    var currentY = new Array(slides.length);
    var targetY = new Array(slides.length);

    slides.forEach(function (slide, i) {
        currentY[i] = i === 0 ? 0 : startYPercent;
        targetY[i] = i === 0 ? 0 : startYPercent;
        ySetters[i](currentY[i]);
        gsap.set(slide, { force3D: true });
    });

    // ── 4. Scroll Stage Definition ────────────────────────────────────────────
    var VH = window.innerHeight;
    var SCROLL_PER_ITEM = VH * 1.5;                 // 1.5 screens of scroll per project
    var HOLD_DIST = SCROLL_PER_ITEM * 0.40;   // 40% of that is pure hold (no movement)
    var TRANS_DIST = SCROLL_PER_ITEM - Math.max(0, HOLD_DIST);
    var totalScrollDist = NUM_TRANSITIONS * SCROLL_PER_ITEM;

    ScrollTrigger.create({
        scroller: document.documentElement,
        trigger: sticky,
        start: 'top ' + stickyTop + 'px',
        end: '+=' + totalScrollDist,
        pin: true,
        pinSpacing: true,
        onUpdate: function (self) {
            // Hover takes priority — only switch via scroll when cursor is off all slides
            if (hoveredProject !== -1) return;
            var rawPos = self.progress * NUM_TRANSITIONS;
            var active = Math.min(NUM_TRANSITIONS, Math.max(0, Math.round(rawPos)));
            infoItems.forEach(function (item, i) {
                item.classList.toggle('is-active', i === active);
            });
        },
    });

    // ── 5. Velocity Tracker & Nav Hide ────────────────────────────────────────
    var scrollVelocity = 0;
    var lastScroll = 0;
    var lastTime = performance.now();
    var nav = document.querySelector('.v2-nav');

    lenis.on('scroll', function (e) {
        var now = performance.now();
        var dt = now - lastTime;
        if (dt > 0) {
            var raw = (e.scroll - lastScroll) * (1000 / dt);
            // heavier smoothing so boost feels organic, not jittery
            scrollVelocity = scrollVelocity * 0.8 + raw * 0.2;
        }

        // Nav Hide/Show logic
        if (nav) {
            if (e.scroll > 20) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }

            if (e.scroll > lastScroll && e.scroll > 100) {
                nav.classList.add('nav-collapsed');
            } else {
                nav.classList.remove('nav-collapsed');
            }
        }

        lastScroll = e.scroll;
        lastTime = now;
    });

    // ── 6. Physics Loop ───────────────────────────────────────────────────────
    var MAX_VELOCITY = 3000;
    var MAX_BOOST = 0.40;   // allow velocity to advance progress up to 40%
    var FAST_LERP = 0.085;  // buttery, slightly slower main approach
    var SLOW_LERP = 0.025;  // very slow float for the settle
    var SETTLE_FRACTION = 0.25;   // last 25% of distance enters float mode

    function animLoop() {
        var scrollPos = Math.max(0, lenis.scroll);
        var velAbs = Math.abs(scrollVelocity);
        var velNorm = Math.min(velAbs / MAX_VELOCITY, 1);
        var velBoost = velNorm * MAX_BOOST;

        for (var i = 1; i < slides.length; i++) {
            // Compute progress for THIS specific project's transition phase
            var itemStartScroll = (i - 1) * SCROLL_PER_ITEM;
            var transStartScroll = itemStartScroll + HOLD_DIST;

            var rawProgress = 0;
            if (scrollPos > transStartScroll) {
                rawProgress = (scrollPos - transStartScroll) / TRANS_DIST;
            }
            rawProgress = Math.max(0, Math.min(1, rawProgress));

            // ISOLATED BOOST:
            // Velocity only pulls this card if it's currently actively transitioning
            // (meaning it's past the hold phase, but hasn't fully landed yet).
            // This stops card #4 from jumping while we're still looking at card #2.
            var isActivelyTransitioning = (rawProgress > 0 && rawProgress < 1);
            var boost = (scrollVelocity > 0 && isActivelyTransitioning) ? velBoost : 0;

            var effectiveProgress = Math.min(1, rawProgress + boost);

            // Target Y computation
            targetY[i] = startYPercent * (1 - effectiveProgress);

            // Dual-lerp physical easing
            var remaining = currentY[i] - targetY[i];
            var settleZone = startYPercent * SETTLE_FRACTION;
            var lerpRate = (remaining > 0 && currentY[i] < settleZone) ? SLOW_LERP : FAST_LERP;

            currentY[i] += (targetY[i] - currentY[i]) * lerpRate;
            ySetters[i](currentY[i]);
        }

        requestAnimationFrame(animLoop);
    }

    requestAnimationFrame(animLoop);

    // ── 7. Hover Parallax ─────────────────────────────────────────────────────
    var RANGE = 80;
    var row = document.querySelector('.v2-works-row');
    var pRaf = null, pTargetY = 0, pCurrentY = 0, pBaseY = 0, pHovered = false;

    function lerpFn(a, b, t) { return a + (b - a) * t; }

    function calcBase() {
        var h = imgStack.getBoundingClientRect().height;
        var el = document.getElementById('infoTop0');
        var textH = el ? el.offsetHeight : 80;
        return (h * 0.35) - (textH * 0.5);
    }

    function setAllInfoTops(y) {
        document.querySelectorAll('.v2-works-info-top').forEach(function (el) {
            el.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
        });
    }

    function parallaxTick() {
        pCurrentY = lerpFn(pCurrentY, pTargetY, 0.08);
        setAllInfoTops(pCurrentY);
        pRaf = requestAnimationFrame(parallaxTick);
    }

    if (row && imgStack) {
        imgStack.addEventListener('mouseenter', function () {
            pHovered = true;
            pBaseY = calcBase();
            pCurrentY = pBaseY + 30;
            pTargetY = pBaseY;
            row.classList.add('is-hovered');
            if (!pRaf) pRaf = requestAnimationFrame(parallaxTick);
        });
        imgStack.addEventListener('mouseleave', function () {
            pHovered = false;
            hoveredProject = -1;  // revert info panel to scroll-based logic
            row.classList.remove('is-hovered');
            pTargetY = pBaseY + 30;
            setTimeout(function () {
                if (!pHovered) {
                    cancelAnimationFrame(pRaf);
                    pRaf = null;
                    setAllInfoTops(pBaseY + 30);
                }
            }, 500);
        });
        imgStack.addEventListener('mousemove', function (e) {
            // Parallax
            var rect = imgStack.getBoundingClientRect();
            var normalized = (e.clientY - rect.top) / rect.height;
            pTargetY = pBaseY + (normalized - 0.5) * RANGE * 2;

            // Detect which slide is physically under the cursor
            // elementsFromPoint returns elements top-to-bottom in z-order
            var els = document.elementsFromPoint(e.clientX, e.clientY);
            var hit = -1;
            for (var k = 0; k < els.length; k++) {
                if (els[k].classList && els[k].classList.contains('v2-stack-slide')) {
                    hit = parseInt(els[k].getAttribute('data-slide'), 10);
                    break;
                }
            }
            if (hit !== -1 && hit !== hoveredProject) {
                hoveredProject = hit;
                infoItems.forEach(function (item, i) {
                    item.classList.toggle('is-active', i === hoveredProject);
                });
            }
        });
    }

    // ── 8. /VIEW Cursor ───────────────────────────────────────────────────────
    var cursor = document.getElementById('viewCursor');
    if (!cursor) return;
    var mx = 0, my = 0, cx = 0, cy = 0, cRaf = null;

    function animCursor() {
        cx = lerpFn(cx, mx, 0.14);
        cy = lerpFn(cy, my, 0.14);
        cursor.style.left = cx + 'px';
        cursor.style.top = cy + 'px';
        cRaf = requestAnimationFrame(animCursor);
    }

    document.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        if (!cRaf) animCursor();
    });

    if (imgStack) {
        imgStack.addEventListener('mouseenter', function () { cursor.classList.add('is-visible'); });
        imgStack.addEventListener('mouseleave', function () { cursor.classList.remove('is-visible'); });
    }

})();
