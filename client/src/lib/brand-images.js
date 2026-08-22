/** Curated imagery — Odisha landscapes, architecture & premium property photography */
export const BRAND_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85',
  cities: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1800&q=85',
  cta: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=85',
  about: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1800&q=85',
};

export const PLACEHOLDER_PROPERTY = '/properties/prop1.jpg';

export const CARD_ART_STRIPS = [
  '/brand/card-art/saura-card-01.png',
  '/brand/card-art/saura-card-02.png',
  '/brand/card-art/saura-card-03.png',
  '/brand/card-art/saura-card-04.png',
];

export const cardArtFor = (id) => {
  const key = String(id ?? '');
  const n = key.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return CARD_ART_STRIPS[n % CARD_ART_STRIPS.length];
};
