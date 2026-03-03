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
    if (typeof initNavMenuToggle === 'function') {
        initNavMenuToggle();
    }

    /* ── Configuration ─────────────────────────────────────────────────── */
    var MAX_VELOCITY = 3000;
    var MAX_BOOST = 0.34;
    var FAST_LERP = 0.078;
    var SLOW_LERP = 0.025;
    var SETTLE_FRACTION = 0.25;
    var HOVER_RANGE = 80;
    var CURSOR_LERP = 0.14;
    var VELOCITY_SMOOTHING = 0.14;

    /* ── DOM refs ──────────────────────────────────────────────────────── */
    var main = document.getElementById('worksMain');
    var sticky = document.getElementById('worksSticky');
    var imgStack = document.getElementById('imgStack');
    var row = document.querySelector('.v2-works-row');
    var slides = document.querySelectorAll('.v2-stack-slide');
    var infoItems = document.querySelectorAll('.v2-stack-info-item');
    var infoTopEls = document.querySelectorAll('.v2-works-info-top');
    var infoTop0 = document.getElementById('infoTop0');
    var cursorEl = document.getElementById('viewCursor');

    if (!sticky || !slides.length || !imgStack) return;

    /* Drive transition count from the actual DOM so HTML is the single source of truth */
    var NUM_PROJECTS = slides.length;
    var NUM_TRANSITIONS = NUM_PROJECTS - 1;

    var hoveredProject = -1;
    var lastPointerX = null;
    var lastPointerY = null;
    var hasInteracted = false;
    var pointerInStack = false;

    var activeInfoIndex = -1;
    var lastTaggedIndex = -1;

    var hoverSyncRaf = null;
    var resizeTimer = null;

    /* ── Global Tags Helper ─────────────────────────────────────────────── */
    var tagSpans = document.querySelectorAll('#globalTags [data-tag]');
    var sepSpans = document.querySelectorAll('#globalTags .v2-tag-sep');

    function updateGlobalTags(activeIndex) {
        if (activeIndex === lastTaggedIndex) return;
        var item = infoItems[activeIndex];
        if (!item) return;

        var rawTags = item.getAttribute('data-tags') || '';
        var activeTags = rawTags.split(',').map(function (t) { return t.trim(); });

        for (var i = 0; i < tagSpans.length; i++) {
            var span = tagSpans[i];
            var tag = span.getAttribute('data-tag');
            var isDim = activeTags.indexOf(tag) === -1;
            span.classList.toggle('is-dim', isDim);
            if (sepSpans[i]) sepSpans[i].classList.toggle('is-dim', isDim);
        }

        lastTaggedIndex = activeIndex;
    }

    function setActiveInfoItem(activeIndex) {
        if (activeIndex === activeInfoIndex) return;
        if (activeIndex < 0 || activeIndex >= infoItems.length) return;

        if (activeInfoIndex !== -1 && infoItems[activeInfoIndex]) {
            infoItems[activeInfoIndex].classList.remove('is-active');
        }

        infoItems[activeIndex].classList.add('is-active');
        activeInfoIndex = activeIndex;
    }

    function setCursorLabelForProject(projectIndex) {
        if (!cursorEl) return;
        cursorEl.innerText = (projectIndex >= 5) ? 'Coming soon' : 'view';
    }

    function getSlideHitFromPoint(x, y) {
        var els = document.elementsFromPoint(x, y);
        for (var k = 0; k < els.length; k++) {
            if (els[k].classList && els[k].classList.contains('v2-stack-slide')) {
                return parseInt(els[k].getAttribute('data-slide'), 10);
            }
        }
        return -1;
    }

    function syncHoveredProjectFromPointerNow() {
        if (lastPointerX === null || lastPointerY === null) return;

        var rect = imgStack.getBoundingClientRect();
        var isInsideStack =
            lastPointerX >= rect.left &&
            lastPointerX <= rect.right &&
            lastPointerY >= rect.top &&
            lastPointerY <= rect.bottom;

        if (!isInsideStack) return;

        var hit = getSlideHitFromPoint(lastPointerX, lastPointerY);
        if (hit === -1) return;

        if (!hasInteracted) hasInteracted = true;

        if (hit !== hoveredProject) {
            hoveredProject = hit;
            setActiveInfoItem(hoveredProject);
            updateGlobalTags(hoveredProject);
            setCursorLabelForProject(hoveredProject);
        }
    }

    function scheduleHoverSync(force) {
        if (!force && !pointerInStack) return;
        if (hoverSyncRaf) return;
        hoverSyncRaf = requestAnimationFrame(function () {
            hoverSyncRaf = null;
            syncHoveredProjectFromPointerNow();
        });
    }

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

    /* ── 2. Layout & Stage Metrics ─────────────────────────────────────── */
    var stickyTop = 0;
    var startYPercent = 0;

    var VH = window.innerHeight;
    var SCROLL_PER_ITEM = VH * 1.5;
    var HOLD_DIST = SCROLL_PER_ITEM * 0.40;
    var TRANS_DIST = SCROLL_PER_ITEM - Math.max(0, HOLD_DIST);
    var totalScrollDist = NUM_TRANSITIONS * SCROLL_PER_ITEM;
    var END_LINGER_DIST = VH * 2.5;
    var pinDist = totalScrollDist + END_LINGER_DIST;

    var ySetters = Array.prototype.map.call(slides, function (slide) {
        return gsap.quickSetter(slide, 'yPercent');
    });

    var currentY = new Array(slides.length);
    var targetY = new Array(slides.length);

    function calcBase() {
        var h = imgStack.getBoundingClientRect().height;
        var textH = infoTop0 ? infoTop0.offsetHeight : 80;
        return (h * 0.35) - (textH * 0.5);
    }

    function seedSlidesAtStart() {
        for (var i = 0; i < slides.length; i++) {
            currentY[i] = (i === 0) ? 0 : startYPercent;
            targetY[i] = (i === 0) ? 0 : startYPercent;
            ySetters[i](currentY[i]);
            gsap.set(slides[i], { force3D: true });
        }
    }

    function preserveSlideProgress(prevStartYPercent) {
        if (!prevStartYPercent || prevStartYPercent <= 0) return;

        for (var i = 0; i < slides.length; i++) {
            if (i === 0) {
                currentY[i] = 0;
                targetY[i] = 0;
                ySetters[i](0);
                continue;
            }

            var currentProgress = clampValue(1 - (currentY[i] / prevStartYPercent), 0, 1);
            var targetProgress = clampValue(1 - (targetY[i] / prevStartYPercent), 0, 1);

            currentY[i] = startYPercent * (1 - currentProgress);
            targetY[i] = startYPercent * (1 - targetProgress);
            ySetters[i](currentY[i]);
        }
    }

    function recomputeMetrics(preserveSlides) {
        var prevStart = startYPercent;

        /*
         * Measure sticky's natural flow position first (CSS-driven flex layout),
         * then re-apply runtime pin layout. This preserves the original lower-on-screen anchor.
         */
        main.style.display = '';
        main.style.minHeight = '';
        main.style.paddingBottom = '';
        sticky.style.marginTop = '';
        stickyTop = sticky.getBoundingClientRect().top;

        main.style.display = 'block';
        main.style.minHeight = '';
        main.style.paddingBottom = '0';
        sticky.style.marginTop = stickyTop + 'px';

        var stackRect = imgStack.getBoundingClientRect();
        var distToVpBottom = window.innerHeight - stackRect.top;
        var exactBottomPct = stackRect.height ? (distToVpBottom / stackRect.height) * 100 : 100;
        startYPercent = exactBottomPct + 15;

        VH = window.innerHeight;
        SCROLL_PER_ITEM = VH * 1.5;
        HOLD_DIST = SCROLL_PER_ITEM * 0.40;
        TRANS_DIST = SCROLL_PER_ITEM - Math.max(0, HOLD_DIST);
        totalScrollDist = NUM_TRANSITIONS * SCROLL_PER_ITEM;
        END_LINGER_DIST = VH * 2.5;
        pinDist = totalScrollDist + END_LINGER_DIST;

        if (preserveSlides) {
            preserveSlideProgress(prevStart);
        }
    }

    recomputeMetrics(false);
    seedSlidesAtStart();

    /* ── 3. Scroll Stage Trigger ───────────────────────────────────────── */
    ScrollTrigger.create({
        scroller: document.documentElement,
        trigger: sticky,
        start: function () { return 'top ' + stickyTop + 'px'; },
        end: function () { return '+=' + pinDist; },
        pin: true,
        pinSpacing: true,
        onUpdate: function (self) {
            if (hoveredProject !== -1) return;

            var scrolled = self.progress * pinDist;
            var rawPos = scrolled / SCROLL_PER_ITEM;
            var active = Math.min(NUM_TRANSITIONS, Math.max(0, Math.round(rawPos)));
            setActiveInfoItem(active);

            if (hasInteracted) {
                updateGlobalTags(active);
            }
        },
    });

    /* ── 4. Velocity Tracker & Nav ─────────────────────────────────────── */
    var scrollVelocity = 0;
    var lastScroll = 0;
    var lastTime = performance.now();
    var lastNavScroll = 0;

    lenis.on('scroll', function (e) {
        var now = performance.now();
        var dt = now - lastTime;

        if (dt > 0) {
            var dtClamped = clampValue(dt, 8, 48);
            var raw = (e.scroll - lastScroll) * (1000 / dtClamped);
            scrollVelocity = scrollVelocity * (1 - VELOCITY_SMOOTHING) + raw * VELOCITY_SMOOTHING;

            if (Math.abs(e.scroll - lastScroll) > 1 && !hasInteracted) {
                hasInteracted = true;
            }
        }

        lastNavScroll = updateNavOnScroll(e.scroll, lastNavScroll);
        scheduleHoverSync();

        lastScroll = e.scroll;
        lastTime = now;
    });

    /* ── 5. Physics Loop ───────────────────────────────────────────────── */
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

            var delta = targetY[i] - currentY[i];
            var remaining = -delta;
            var settleZone = startYPercent * SETTLE_FRACTION;
            var lerpRate = (remaining > 0 && currentY[i] < settleZone) ? SLOW_LERP : FAST_LERP;

            var prevY = currentY[i];
            if (Math.abs(delta) < 0.01) {
                currentY[i] = targetY[i];
            } else {
                currentY[i] += delta * lerpRate;
            }

            if (currentY[i] !== prevY) {
                ySetters[i](currentY[i]);
            }
        }

        requestAnimationFrame(animLoop);
    }

    requestAnimationFrame(animLoop);

    /* ── 6. Hover Parallax ─────────────────────────────────────────────── */
    var pRaf = null;
    var pStopTimer = null;
    var pTargetY = 0;
    var pCurrentY = 0;
    var pBaseY = 0;
    var pHovered = false;

    function setAllInfoTops(y) {
        var transformValue = 'translateY(' + y.toFixed(2) + 'px)';
        for (var i = 0; i < infoTopEls.length; i++) {
            infoTopEls[i].style.transform = transformValue;
        }
    }

    function parallaxTick() {
        pCurrentY = lerp(pCurrentY, pTargetY, 0.08);
        setAllInfoTops(pCurrentY);
        pRaf = requestAnimationFrame(parallaxTick);
    }

    if (row) {
        imgStack.addEventListener('mouseenter', function (e) {
            pointerInStack = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;

            if (pStopTimer) {
                clearTimeout(pStopTimer);
                pStopTimer = null;
            }

            pHovered = true;
            pBaseY = calcBase();
            pCurrentY = pBaseY + 30;
            pTargetY = pBaseY;
            row.classList.add('is-hovered');

            scheduleHoverSync(true);
            if (!pRaf) pRaf = requestAnimationFrame(parallaxTick);
        });

        imgStack.addEventListener('mouseleave', function () {
            pointerInStack = false;
            pHovered = false;
            hoveredProject = -1;
            row.classList.remove('is-hovered');
            pTargetY = pBaseY + 30;

            pStopTimer = setTimeout(function () {
                if (!pHovered) {
                    if (pRaf) cancelAnimationFrame(pRaf);
                    pRaf = null;
                    setAllInfoTops(pBaseY + 30);
                }
            }, 500);
        });

        imgStack.addEventListener('mousemove', function (e) {
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;

            var rect = imgStack.getBoundingClientRect();
            var normalized = (e.clientY - rect.top) / rect.height;
            pTargetY = pBaseY + (normalized - 0.5) * HOVER_RANGE * 2;

            scheduleHoverSync(true);
        });
    }

    /* ── 7. /VIEW Cursor ───────────────────────────────────────────────── */
    if (cursorEl) {
        var mx = 0;
        var my = 0;
        var cx = 0;
        var cy = 0;
        var cRaf = null;
        var cursorVisible = false;
        var worksBody = document.body;

        function animCursor() {
            if (!cursorVisible) {
                cRaf = null;
                return;
            }

            cx = lerp(cx, mx, CURSOR_LERP);
            cy = lerp(cy, my, CURSOR_LERP);
            cursorEl.style.left = cx + 'px';
            cursorEl.style.top = cy + 'px';
            cRaf = requestAnimationFrame(animCursor);
        }

        function ensureCursorLoop() {
            if (!cRaf) {
                cRaf = requestAnimationFrame(animCursor);
            }
        }

        function stopCursorLoop() {
            if (cRaf) {
                cancelAnimationFrame(cRaf);
                cRaf = null;
            }
        }

        function showCustomCursorAt(x, y) {
            mx = x;
            my = y;
            cx = x;
            cy = y;
            cursorVisible = true;

            cursorEl.style.left = cx + 'px';
            cursorEl.style.top = cy + 'px';
            cursorEl.classList.add('is-visible');

            if (worksBody) worksBody.classList.add('v2-view-cursor-active');
            ensureCursorLoop();
        }

        function hideCustomCursor() {
            cursorVisible = false;
            cursorEl.classList.remove('is-visible');
            if (worksBody) worksBody.classList.remove('v2-view-cursor-active');
            stopCursorLoop();
        }

        document.addEventListener('mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;

            if (cursorVisible) ensureCursorLoop();
        });

        imgStack.addEventListener('mouseenter', function (e) {
            pointerInStack = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            showCustomCursorAt(e.clientX, e.clientY);
            scheduleHoverSync(true);
        });

        imgStack.addEventListener('mouseleave', function () {
            pointerInStack = false;
            hideCustomCursor();
        });

        imgStack.addEventListener('click', function () {
            if (hoveredProject === 0) {
                window.location.href = 'project-sonix.html';
            } else if (hoveredProject === 1) {
                window.location.href = 'project-imessage.html';
            } else if (hoveredProject === 2) {
                window.location.href = 'project-sealove.html';
            } else if (hoveredProject === 3) {
                window.location.href = 'project-nest.html';
            } else if (hoveredProject === 4) {
                window.location.href = 'project-kroger.html';
            }
            // Indices 5+: "Coming soon" — already shown in cursor label
        });

        document.addEventListener('mouseleave', hideCustomCursor);
        window.addEventListener('blur', hideCustomCursor);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) hideCustomCursor();
        });
    }

    /* ── 8. Footer Transition Animation ────────────────────────────────── */
    var footer = document.getElementById('contact');

    if (footer && row) {
        gsap.to(row, {
            scrollTrigger: {
                scroller: document.documentElement,
                trigger: footer,
                start: 'top 80%',
                end: 'top center',
                scrub: true,
            },
            opacity: 0,
            scale: 0.95,
            y: -50,
            ease: 'none'
        });
    }

    /* ── 9. Resize / Reflow Safety ─────────────────────────────────────── */
    function handleResize() {
        if (resizeTimer) clearTimeout(resizeTimer);

        resizeTimer = setTimeout(function () {
            recomputeMetrics(true);
            pBaseY = calcBase();
            ScrollTrigger.refresh();
            scheduleHoverSync(true);
        }, 120);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    ScrollTrigger.refresh();
})();
