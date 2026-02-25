/* ══════════════════════════════════════
   SHARED LAYOUT COMPONENTS
   ══════════════════════════════════════
   Dynamically injects shared HTML components (logo, nav, SVG filter)
   into every page, eliminating copy-pasted markup across HTML files.

   Usage: call injectSharedLayout() on DOMContentLoaded.
   Requires a <div id="shared-layout"></div> placeholder at top of <body>.
*/

const NAV_LINKS = [
    { label: 'Home', href: 'index.html' },
    { label: 'Works', href: 'works.html' },
    { label: 'Playground', href: '#' },
    { label: 'About Me', href: 'about.html' }
];

const LOGO_SVG = `<svg width="27" height="29" viewBox="0 0 27 29" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.23146e-05 0.299998L2.28621e-05 8.95236C1.02357e-05 11.1615 1.79035 12.9524 3.9995 12.9524H16.4226C18.6266 12.9524 20.653 11.744 21.7009 9.80509L26.8405 0.295096C26.9125 0.161842 26.816 6.16361e-06 26.6646 6.0685e-06L17.9519 0C17.3709 0 16.8421 0.335564 16.5947 0.861302L12.4287 9.71399C11.61 11.4537 9.00001 10.8703 9.00002 8.94755L9.00006 1.50001C9.00007 0.671578 8.3285 0 7.50006 0H0.300072C0.134388 0 7.32616e-05 0.134313 7.23146e-05 0.299998Z" fill="white"/>
  <path d="M7.24429e-05 28.7L2.11513e-05 19C9.46977e-06 16.7908 1.79035 15 3.9995 15H16.292C18.5646 15 20.642 16.284 21.6583 18.3167L26.8553 28.7106C26.9218 28.8435 26.8251 29 26.6764 29L17.9682 29C17.3788 29 16.844 28.6548 16.6013 28.1177L12.3696 18.7533C11.5685 16.9805 8.91488 17.5626 8.92937 19.5079L8.98882 27.4888C8.99502 28.3216 8.32165 29 7.48886 29H0.300072C0.134388 29 7.33191e-05 28.8657 7.24429e-05 28.7Z" fill="white"/>
</svg>`;

const NAV_GLASS_SVG_FILTER = `<svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true">
  <defs>
    <filter id="nav-glass-filter" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.65 0.65" numOctaves="4" seed="2" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="18" in="noise" result="saturatedNoise"/>
      <feDisplacementMap in="SourceGraphic" in2="saturatedNoise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
    </filter>
  </defs>
</svg>`;

/**
 * Detect the current page from pathname and return the active nav link href.
 * @returns {string}
 */
function _getActiveHref() {
    const path = window.location.pathname;
    if (path.includes('works')) return 'works.html';
    if (path.includes('about')) return 'about.html';
    if (path.includes('playground')) return '#';
    return 'index.html';
}

/**
 * Build the nav link list items.
 * @returns {string} HTML string
 */
function _buildNavLinks() {
    const activeHref = _getActiveHref();
    return NAV_LINKS.map(link => {
        const activeClass = link.href === activeHref ? ' is-active' : '';
        return `<li><a class="v2-nav-link${activeClass}" href="${link.href}">${link.label}</a></li>`;
    }).join('\n        ');
}

/**
 * Inject shared layout components into the page.
 * Expects a `<div id="shared-layout"></div>` placeholder.
 * Also works by prepending to body if placeholder is missing.
 */
function injectSharedLayout() {
    const logoHref = _getActiveHref() === 'index.html' ? '#' : 'index.html';

    const html = `
${NAV_GLASS_SVG_FILTER}
<a class="v2-logo" id="mainLogo" href="${logoHref}" aria-label="Keerthi home">
  ${LOGO_SVG}
</a>
<nav class="v2-nav" aria-label="Primary">
  <div class="v2-nav-inner">
    <ul class="v2-nav-links">
      ${_buildNavLinks()}
    </ul>
    <button class="v2-hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span class="v2-hamburger-line"></span>
      <span class="v2-hamburger-line"></span>
      <span class="v2-hamburger-line"></span>
    </button>
  </div>
</nav>`;

    const placeholder = document.getElementById('shared-layout');
    if (placeholder) {
        placeholder.innerHTML = html;
    } else {
        // Fallback: prepend to body
        document.body.insertAdjacentHTML('afterbegin', html);
    }
}
