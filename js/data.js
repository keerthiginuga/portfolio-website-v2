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
    },
    {
        id: 'imessage',
        title: 'iMessage (Placeholder Title)',
        shortTitle: 'IMESSAGE',
        year: 2024,
        marqueeKey: 'IMESSAGE',
        tags: ['Placeholder Tag'],
        categories: 'Placeholder Category / Tag 2',
        description: 'Placeholder description for the iMessage project.',
        images: ['assets/images/imessage.jpg'],
        heroImage: 'assets/images/imessage.jpg'
    },
    {
        id: 'sync',
        title: 'Sync (Placeholder Title)',
        shortTitle: 'SYNC',
        year: 2024,
        marqueeKey: 'SYNC',
        tags: ['Placeholder Tag'],
        categories: 'Placeholder Category / Tag 2',
        description: 'Placeholder description for the Sync project.',
        images: ['assets/images/sync.jpg'],
        heroImage: 'assets/images/sync.jpg'
    },
    {
        id: 'zillow',
        title: 'Zillow (Placeholder Title)',
        shortTitle: 'ZILLOW',
        year: 2024,
        marqueeKey: 'ZILLOW',
        tags: ['Placeholder Tag'],
        categories: 'Placeholder Category / Tag 2',
        description: 'Placeholder description for the Zillow project.',
        images: ['assets/images/zillow.jpg'],
        heroImage: 'assets/images/zillow.jpg'
    }
];

/**
 * Returns the full list of projects for the works page,
 * ordered: SONIX, IMESSAGE, SEALOVE, GOOGLE NEST, KROGER, KOHLER, SYNC, 7WEST, ZILLOW
 */
function getAllProjects() {
    return [
        PROJECT_DATA[0],             // SONIX
        WORKS_ONLY_PROJECTS[2],      // IMESSAGE
        PROJECT_DATA[1],             // SEALOVE
        PROJECT_DATA[2],             // GOOGLE NEST
        WORKS_ONLY_PROJECTS[1],      // KROGER
        PROJECT_DATA[3],             // KOHLER
        WORKS_ONLY_PROJECTS[3],      // SYNC
        WORKS_ONLY_PROJECTS[0],      // 7WEST
        WORKS_ONLY_PROJECTS[4]       // ZILLOW
    ];
}

/**
 * Returns projects for the home page select-works card rotation.
 */
function getSelectWorksProjects() {
    return PROJECT_DATA;
}
