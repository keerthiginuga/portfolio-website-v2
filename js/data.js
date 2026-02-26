/* ══════════════════════════════════════
   PROJECT DATA — Single Source of Truth
   ══════════════════════════════════════
   All project metadata lives here. Both the home page (select works card)
   and the works page consume this data so changes propagate everywhere.
*/

const PROJECT_DATA = [
    {
        id: 'sonix',
        title: 'SONIX — YOUR PERSONAL SPACE ON WHEELS',
        shortTitle: 'SONIX',
        year: 2025,
        marqueeKey: 'SONIX',
        tags: ['UXD', 'UXR', 'Branding'],
        categories: 'UX Research / UX Design / UI Design / Branding / Service Design / Information Architecture / User Testing',
        description: 'Sonix reimagines urban mobility through fully autonomous vehicles that deliver hyper-personalized, luxury-grade experiences for everyone.',
        images: [
            'assets/images/autonomous-vehicle.jpg'
        ],
        heroImage: 'assets/images/autonomous-vehicle.jpg'
    },
    {
        id: 'sealove',
        title: 'SEALOVE CANDLE BAR WEBSITE REDESIGN',
        shortTitle: 'SEALOVE',
        year: 2023,
        marqueeKey: 'SEALOVE',
        tags: ['UXD', 'UXR', 'IA', 'Branding'],
        categories: 'UX Design / UX Research / Information Architecture / Branding',
        description: 'A strategic redesign of Sea Love’s website, focused on improving Information Architecture and UI to create a seamless, intuitive shopping and booking experience.',
        images: [
            'assets/images/sea-love.jpg'
        ],
        heroImage: 'assets/images/sea-love.jpg'
    },
    {
        id: 'google-nest',
        title: 'GOOGLE NEST THERMOSTAT FOR OFFICE SPACE',
        shortTitle: 'GOOGLE NEST',
        year: 2023,
        marqueeKey: 'GOOGLE NEST',
        tags: ['UXD', 'UXR', 'Branding'],
        categories: 'UX Design / UX Research / Branding',
        description: 'Redesigned the Nest thermostat for cheerful office spaces, introducing a collaborative temperature-setting feature that empowers employees to contribute, fostering a collaborative, comfortable, and inclusive environment.',
        images: [
            'assets/images/google-nest.jpg'
        ],
        heroImage: 'assets/images/google-nest.jpg'
    },
    {
        id: 'kohler',
        title: 'KOHLER X SCADPRO - THE FUTURE OF HYDROTHERAPY',
        shortTitle: 'KOHLER',
        year: 2022,
        marqueeKey: 'KOHLER',
        tags: ['Lead UXD', 'UXR', 'Product Design'],
        categories: 'Lead UX Design / UX Research / Product Design',
        description: 'A collaborative industry project with Kohler through SCADpro focused on reimagining the future of hydrotherapy through human-centered research, concept development, and immersive experience design.',
        images: [
            'assets/images/kohler-scadpro.jpg'
        ],
        heroImage: 'assets/images/kohler-scadpro.jpg'
    }
];

/* Works page has 2 additional projects not in the home card rotation */
const WORKS_ONLY_PROJECTS = [
    {
        id: '7west',
        title: '7WEST — YOUR ALL-IN-ONE STUDENT ECOSYSTEM',
        shortTitle: '7WEST',
        year: 2024,
        marqueeKey: '7WEST',
        tags: ['Co-Founder', 'Design Lead', 'UX Design'],
        categories: 'Co-Founder / Design Lead / UX Design',
        description: '7WEST is an AI-first student ecosystem that connects every layer of university life from organizations and events to housing, jobs, and student discounts into a single, unified platform.',
        images: ['assets/images/7west.jpg'],
        heroImage: 'assets/images/7west.jpg'
    },
    {
        id: 'kroger',
        title: 'RETHINKING THE SELF-CHECKOUT EXPERIENCE AT KROGER',
        shortTitle: 'KROGER',
        year: 2023,
        marqueeKey: 'KROGER',
        tags: ['UXR', 'Service Design'],
        categories: 'UX Research / Service Design',
        description: 'An in-depth service design investigation addressing the rising theft, employee stress, and customer frustration surrounding Kroger’s self-checkout systems.',
        images: ['assets/images/kroger.jpg'],
        heroImage: 'assets/images/kroger.jpg'
    },
    {
        id: 'imessage',
        title: 'IMESSAGE - A RELATIONAL WELLNESS UPDATE',
        shortTitle: 'IMESSAGE',
        year: 2024,
        marqueeKey: 'IMESSAGE',
        tags: ['Placeholder Tag'],
        categories: 'Placeholder Category / Tag 2',
        description: 'A hypothetical iMessage update centered around relational wellness, empowering users to maintain their relationships through outreach, context, and organizational support.',
        images: ['assets/images/imessage.jpg'],
        heroImage: 'assets/images/imessage.jpg'
    },
    {
        id: 'sync',
        title: 'SYNC - THE REAL-TIME COACHING',
        shortTitle: 'SYNC',
        year: 2024,
        marqueeKey: 'SYNC',
        tags: ['Placeholder Tag'],
        categories: 'Placeholder Category / Tag 2',
        description: 'An intelligent smart sneaker system that translates gait sensor data into real-time haptic feedback and immersive visual insights to prevent running injuries.',
        images: ['assets/images/sync.jpg'],
        heroImage: 'assets/images/sync.jpg'
    },
    {
        id: 'zillow',
        title: 'ZILLOW - SIMPLIFYING SEARCH FOR HOME',
        shortTitle: 'ZILLOW',
        year: 2024,
        marqueeKey: 'ZILLOW',
        tags: ['Placeholder Tag'],
        categories: 'Placeholder Category / Tag 2',
        description: 'A usability redesign of Zillow\'s mobile app to streamline search, filters, and saved listings for renters navigating high-stakes housing decisions.',
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
    return [
        PROJECT_DATA[0],             // SONIX
        WORKS_ONLY_PROJECTS[2],      // IMESSAGE
        PROJECT_DATA[1],             // SEALOVE
        PROJECT_DATA[2]              // GOOGLE NEST
    ];
}
