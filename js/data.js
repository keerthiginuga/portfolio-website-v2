/* ══════════════════════════════════════
   PROJECT DATA — Single Source of Truth
   ══════════════════════════════════════
   All project metadata lives here. Both the home page (select works card)
   and the works page consume this data so changes propagate everywhere.
*/

const PROJECT_DATA = [
    {
        id: 'sonix',
        title: 'Sonix — Your Personal Space On Wheels',
        shortTitle: 'SONIX',
        year: 2025,
        marqueeKey: 'SONIX',
        tags: ['UXD', 'UXR', 'Branding'],
        categories: 'UX Research / UX Design / UI Design / Branding / Service Design / Information Architecture / User Testing',
        description: 'Sonix reimagines urban mobility through fully autonomous vehicles that deliver hyper-personalized, luxury-grade experiences for everyone.',
        images: [
            'assets/images/autonomous-vehicle.jpg',
            'assets/images/sync.jpg',
            'assets/images/google-nest.jpg',
            'assets/images/7west.jpg'
        ],
        heroImage: 'assets/images/autonomous-vehicle.jpg'
    },
    {
        id: 'sealove',
        title: 'SeaLove Candle Bar Re-Design',
        shortTitle: 'SEALOVE',
        year: 2023,
        marqueeKey: 'SEALOVE',
        tags: ['UXD', 'UXR', 'IA', 'Branding'],
        categories: 'UX Design / UX Research / Information Architecture / Branding',
        description: 'A holistic brand and digital experience redesign for SeaLove Candle Bar, reimagining the customer journey from discovery to checkout.',
        images: [
            'assets/images/sea-love.jpg',
            'assets/images/kroger.jpg',
            'assets/images/word-clock.jpg',
            'assets/images/zillow.jpg'
        ],
        heroImage: 'assets/images/sea-love.jpg'
    },
    {
        id: 'google-nest',
        title: 'Google Nest Thermostat for Office Space',
        shortTitle: 'GOOGLE NEST',
        year: 2023,
        marqueeKey: 'GOOGLE NEST',
        tags: ['UXD', 'UXR', 'Branding'],
        categories: 'UX Design / UX Research / Branding',
        description: 'Redesigning the Google Nest Thermostat experience for enterprise office spaces, balancing individual comfort with collective efficiency.',
        images: [
            'assets/images/google-nest.jpg',
            'assets/images/autonomous-vehicle.jpg',
            'assets/images/sync.jpg',
            'assets/images/sea-love.jpg'
        ],
        heroImage: 'assets/images/google-nest.jpg'
    },
    {
        id: 'kohler',
        title: 'Kohler × SCADpro — Future of Hydrotherapy',
        shortTitle: 'KOHLER',
        year: 2022,
        marqueeKey: 'KOHLER',
        tags: ['Lead UXD', 'UXR', 'Product Design'],
        categories: 'Lead UX Design / UX Research / Product Design',
        description: 'A future-forward hydrotherapy concept developed with Kohler and SCADpro, exploring immersive wellness through connected spaces.',
        images: [
            'assets/images/kohler-scadpro.jpg',
            'assets/images/7west.jpg',
            'assets/images/google-nest.jpg',
            'assets/images/word-clock.jpg'
        ],
        heroImage: 'assets/images/kohler-scadpro.jpg'
    }
];

/* Works page has 2 additional projects not in the home card rotation */
const WORKS_ONLY_PROJECTS = [
    {
        id: '7west',
        title: '7WEST',
        shortTitle: '7WEST',
        year: 2024,
        marqueeKey: '7WEST',
        tags: ['Co-Founder', 'Design Lead', 'UX Design'],
        categories: 'Co-Founder / Design Lead / UX Design',
        description: 'An all-in-one student ecosystem designed to simplify campus life — from housing to social connection — under one digital roof.',
        images: ['assets/images/7west.jpg'],
        heroImage: 'assets/images/7west.jpg'
    },
    {
        id: 'kroger',
        title: 'KROGER',
        shortTitle: 'KROGER',
        year: 2023,
        marqueeKey: 'KROGER',
        tags: ['UXR', 'Service Design'],
        categories: 'UX Research / Service Design',
        description: 'Rethinking the self-checkout experience at Kroger to reduce friction, errors, and frustration through empathetic service design.',
        images: ['assets/images/kroger.jpg'],
        heroImage: 'assets/images/kroger.jpg'
    }
];

/**
 * Returns the full list of projects for the works page,
 * ordered: SONIX, 7WEST, SEALOVE, GOOGLE NEST, KROGER, KOHLER
 */
function getAllProjects() {
    return [
        PROJECT_DATA[0],             // SONIX
        WORKS_ONLY_PROJECTS[0],      // 7WEST
        PROJECT_DATA[1],             // SEALOVE
        PROJECT_DATA[2],             // GOOGLE NEST
        WORKS_ONLY_PROJECTS[1],      // KROGER
        PROJECT_DATA[3]              // KOHLER
    ];
}

/**
 * Returns projects for the home page select-works card rotation.
 */
function getSelectWorksProjects() {
    return PROJECT_DATA;
}
