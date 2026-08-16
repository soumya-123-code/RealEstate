/**
 * Default website page → section registry.
 * Used to seed WebsitePage/PageSection and as a public fallback
 * when the composition tables are not yet migrated.
 */
export const DEFAULT_WEBSITE_PAGES = [
  {
    key: 'home',
    title: 'Home',
    path: '/',
    description: 'Main landing page for Suretreaven.',
    isPublished: true,
    sections: [
      { key: 'hero', type: 'HERO', title: 'Hero Banner', order: 1 },
      { key: 'search', type: 'SEARCH', title: 'Property Search', order: 2 },
      { key: 'stats', type: 'STATS', title: 'Company Stats', order: 3 },
      { key: 'featured', type: 'FEATURED_PROPERTIES', title: 'Featured Properties', order: 4 },
      { key: 'services', type: 'SERVICES', title: 'Why Choose Us / Services', order: 5 },
      { key: 'cities', type: 'CUSTOM', title: 'Popular Cities', order: 6 },
      { key: 'testimonials', type: 'TESTIMONIALS', title: 'Testimonials', order: 7 },
      { key: 'partners', type: 'PARTNERS', title: 'Partners', order: 8 },
      { key: 'blog', type: 'BLOG', title: 'Latest Blog', order: 9 },
      { key: 'cta', type: 'CTA', title: 'Bottom CTA', subtitle: 'Ready to find your dream property?', buttonText: 'Browse Properties', buttonLink: '/list', order: 10 },
    ],
  },
  {
    key: 'about',
    title: 'About',
    path: '/about',
    description: 'Company story, mission, vision, and team.',
    isPublished: true,
    sections: [
      { key: 'hero', type: 'CUSTOM', title: 'About Hero', order: 1 },
      { key: 'intro', type: 'COMPANY_INTRO', title: 'Company Introduction', order: 2 },
      { key: 'mission', type: 'MISSION_VISION', title: 'Mission & Vision', order: 3 },
      { key: 'services', type: 'SERVICES', title: 'Why Choose Us', order: 4 },
      { key: 'team', type: 'TEAM', title: 'Our Team', order: 5 },
      { key: 'partners', type: 'PARTNERS', title: 'Partners', order: 6 },
      { key: 'cta', type: 'CTA', title: 'Contact CTA', buttonText: 'Contact Us', buttonLink: '/contact', order: 7 },
    ],
  },
  {
    key: 'properties',
    title: 'Properties',
    path: '/list',
    description: 'Property listing, filters, and search.',
    isPublished: true,
    sections: [
      { key: 'hero', type: 'CUSTOM', title: 'Listings Header', order: 1 },
      { key: 'search', type: 'SEARCH', title: 'Search & Filters', order: 2 },
      { key: 'list', type: 'PROPERTY_LIST', title: 'Property Listing', order: 3 },
      { key: 'cta', type: 'CTA', title: 'Need Help CTA', buttonText: 'Contact Us', buttonLink: '/contact', order: 4 },
    ],
  },
  {
    key: 'contact',
    title: 'Contact',
    path: '/contact',
    description: 'Contact details and inquiry form.',
    isPublished: true,
    sections: [
      { key: 'hero', type: 'CUSTOM', title: 'Contact Hero', order: 1 },
      { key: 'info', type: 'CONTACT_INFO', title: 'Contact Information', order: 2 },
      { key: 'form', type: 'CUSTOM', title: 'Contact Form', order: 3 },
      { key: 'chat', type: 'CUSTOM', title: 'Live Chat', order: 4 },
    ],
  },
  {
    key: 'faq',
    title: 'FAQ',
    path: '/faq',
    description: 'Frequently asked questions.',
    isPublished: true,
    sections: [
      { key: 'hero', type: 'CUSTOM', title: 'FAQ Hero', order: 1 },
      { key: 'faqs', type: 'FAQ', title: 'Questions & Answers', order: 2 },
      { key: 'cta', type: 'CTA', title: 'Still have questions?', buttonText: 'Contact Us', buttonLink: '/contact', order: 3 },
    ],
  },
  {
    key: 'blog',
    title: 'Blog',
    path: '/blog',
    description: 'Articles and market insights.',
    isPublished: true,
    sections: [
      { key: 'hero', type: 'CUSTOM', title: 'Blog Hero', order: 1 },
      { key: 'list', type: 'BLOG', title: 'Blog Posts', order: 2 },
      { key: 'cta', type: 'CTA', title: 'Explore Properties CTA', buttonText: 'View Properties', buttonLink: '/list', order: 3 },
    ],
  },
];

export default DEFAULT_WEBSITE_PAGES;
