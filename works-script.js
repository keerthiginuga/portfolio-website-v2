/* ══════════════════════════════════════
   WORKS PAGE — Buttery Paced Card Stack
   ══════════════════════════════════════
   Depends on: js/utils.js, js/data.js, js/nav.js, js/components.js

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

    /* ── Configuration ─────────────────────────────────────────────────── */
    var MAX_VELOCITY = 3000;
    var MAX_BOOST = 0.40;
    var FAST_LERP = 0.085;
    var SLOW_LERP = 0.025;
    var SETTLE_FRACTION = 0.25;
    var HOVER_RANGE = 80;
    var CURSOR_LERP = 0.14;

    /* ── DOM refs ──────────────────────────────────────────────────────── */
    var main = document.getElementById('worksMain');
    var sticky = document.getElementById('worksSticky');
    var imgStack = document.getElementById('imgStack');
    var slides = document.querySelectorAll('.v2-stack-slide');
    var infoItems = document.querySelectorAll('.v2-stack-info-item');

    /* Drive transition count from the actual DOM so HTML is the single source of truth */
    var NUM_PROJECTS = slides.length;
    var NUM_TRANSITIONS = NUM_PROJECTS - 1;

    var hoveredProject = -1;

    if (!sticky || !slides.length) return;

    /* ── Global Tags Helper ─────────────────────────────────────────────── */
    var tagSpans = document.querySelectorAll('#globalTags [data-tag]');
    var sepSpans = document.querySelectorAll('#globalTags .v2-tag-sep');

    function updateGlobalTags(activeIndex) {
        var item = infoItems[activeIndex];
        if (!item) return;
        var rawTags = item.getAttribute('data-tags') || '';
        var activeTags = rawTags.split(',').map(function (t) { return t.trim(); });

        tagSpans.forEach(function (span, i) {
            var tag = span.getAttribute('data-tag');
            var isDim = activeTags.indexOf(tag) === -1;
            span.classList.toggle('is-dim', isDim);
            /* Dim the separator that follows this tag if the tag is dimmed */
            if (sepSpans[i]) sepSpans[i].classList.toggle('is-dim', isDim);
        });
    }

    /* Initialise tags for first project */
    // updateGlobalTags(0); - Removed so that all tags start in default state

    /* ── 1. Lenis Smooth Scroll ────────────────────────────────────────── */
    gsap.registerPlugin(ScrollTrigger);

    var lenis = new Lenis({
        lerp: 0.08,
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

    /* ── 2. Layout ─────────────────────────────────────────────────────── */
    var stickyRect = sticky.getBoundingClientRect();
    var stickyTop = stickyRect.top;

    main.style.display = 'block';
    main.style.minHeight = '';
    main.style.paddingBottom = '0';
    sticky.style.marginTop = stickyTop + 'px';

    /* ── 3. Start Position: Deep Hide ──────────────────────────────────── */
    var stackRect = imgStack.getBoundingClientRect();
    var distToVpBottom = window.innerHeight - stackRect.top;
    var exactBottomPct = (distToVpBottom / stackRect.height) * 100;
    var startYPercent = exactBottomPct + 15;

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

    /* ── 4. Scroll Stage ───────────────────────────────────────────────── */
    var VH = window.innerHeight;
    var SCROLL_PER_ITEM = VH * 1.5;
    var HOLD_DIST = SCROLL_PER_ITEM * 0.40;
    var TRANS_DIST = SCROLL_PER_ITEM - Math.max(0, HOLD_DIST);
    var totalScrollDist = NUM_TRANSITIONS * SCROLL_PER_ITEM;

    var hasInteracted = false;

    ScrollTrigger.create({
        scroller: document.documentElement,
        trigger: sticky,
        start: 'top ' + stickyTop + 'px',
        end: '+=' + totalScrollDist,
        pin: true,
        pinSpacing: true,
        onUpdate: function (self) {
            if (hoveredProject !== -1) return;
            var rawPos = self.progress * NUM_TRANSITIONS;
            var active = Math.min(NUM_TRANSITIONS, Math.max(0, Math.round(rawPos)));
            infoItems.forEach(function (item, i) {
                item.classList.toggle('is-active', i === active);
            });
            // Update tags only after interaction
            if (hasInteracted) {
                updateGlobalTags(active);
            }
        },
    });

    /* ── 5. Velocity Tracker & Nav ─────────────────────────────────────── */
    var scrollVelocity = 0;
    var lastScroll = 0;
    var lastTime = performance.now();
    var lastNavScroll = 0;

    lenis.on('scroll', function (e) {
        var now = performance.now();
        var dt = now - lastTime;
        if (dt > 0) {
            var raw = (e.scroll - lastScroll) * (1000 / dt);
            scrollVelocity = scrollVelocity * 0.8 + raw * 0.2;
            
            // Register interaction on actual scroll movement (not just lenis setup)
            if (Math.abs(e.scroll - lastScroll) > 1 && !hasInteracted) {
                hasInteracted = true;
            }
        }

        // Use shared nav controller (from nav.js)
        lastNavScroll = updateNavOnScroll(e.scroll, lastNavScroll);

        lastScroll = e.scroll;
        lastTime = now;
    });

    /* ── 6. Physics Loop ───────────────────────────────────────────────── */
    function animLoop() {
        var scrollPos = Math.max(0, lenis.scroll);
        var velAbs = Math.abs(scrollVelocity);
        var velNorm = Math.min(velAbs / MAX_VELOCITY, 1);
        var velBoost = velNorm * MAX_BOOST;

        for (var i = 1; i < slides.length; i++) {
            var itemStartScroll = (i - 1) * SCROLL_PER_ITEM;
            var transStartScroll = itemStartScroll + HOLD_DIST;

            var rawProgress = 0;
            if (scrollPos > transStartScroll) {
                rawProgress = (scrollPos - transStartScroll) / TRANS_DIST;
            }
            rawProgress = clampValue(rawProgress, 0, 1);

            var isActivelyTransitioning = (rawProgress > 0 && rawProgress < 1);
            var boost = (scrollVelocity > 0 && isActivelyTransitioning) ? velBoost : 0;
            var effectiveProgress = Math.min(1, rawProgress + boost);

            targetY[i] = startYPercent * (1 - effectiveProgress);

            var remaining = currentY[i] - targetY[i];
            var settleZone = startYPercent * SETTLE_FRACTION;
            var lerpRate = (remaining > 0 && currentY[i] < settleZone) ? SLOW_LERP : FAST_LERP;

            currentY[i] += (targetY[i] - currentY[i]) * lerpRate;
            ySetters[i](currentY[i]);
        }

        requestAnimationFrame(animLoop);
    }

    requestAnimationFrame(animLoop);

    /* ── 7. Hover Parallax ─────────────────────────────────────────────── */
    var row = document.querySelector('.v2-works-row');
    var pRaf = null, pTargetY = 0, pCurrentY = 0, pBaseY = 0, pHovered = false;

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
        pCurrentY = lerp(pCurrentY, pTargetY, 0.08);
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
            hoveredProject = -1;
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
            var rect = imgStack.getBoundingClientRect();
            var normalized = (e.clientY - rect.top) / rect.height;
            pTargetY = pBaseY + (normalized - 0.5) * HOVER_RANGE * 2;

            var els = document.elementsFromPoint(e.clientX, e.clientY);
            var hit = -1;
            for (var k = 0; k < els.length; k++) {
                if (els[k].classList && els[k].classList.contains('v2-stack-slide')) {
                    hit = parseInt(els[k].getAttribute('data-slide'), 10);
                    break;
                }
            }
            if (hit !== -1) {
                if (!hasInteracted) hasInteracted = true;
                if (hit !== hoveredProject) {
                    hoveredProject = hit;
                    infoItems.forEach(function (item, i) {
                        item.classList.toggle('is-active', i === hoveredProject);
                    });
                    updateGlobalTags(hoveredProject);
                }
            }
        });
    }

    /* ── 8. /VIEW Cursor ───────────────────────────────────────────────── */
    var cursor = document.getElementById('viewCursor');
    if (!cursor) return;
    var mx = 0, my = 0, cx = 0, cy = 0, cRaf = null;

    function animCursor() {
        cx = lerp(cx, mx, CURSOR_LERP);
        cy = lerp(cy, my, CURSOR_LERP);
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
