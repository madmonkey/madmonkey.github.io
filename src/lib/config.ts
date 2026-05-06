import settings from '../content/settings.json';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/** Prefix a root-relative path with the base URL */
export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith(base + '/')) return path;
  return `${base}${path}`;
}

/** Strip file extension and /index suffix from content collection IDs for clean URLs */
export function cleanSlug(id: string): string {
  return id.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '');
}

/** Site-wide configuration — edit via /admin or settings.json */
export const siteConfig = {
  title: settings.title || 'My Photo Site',
  description: settings.description || 'A photography site on the Pirate Social network',
  author: settings.author || 'Photographer',
  bio: settings.bio || 'I take photos of things.',
  avatar: withBase(settings.avatar || ''),
  location: settings.location || '',
  camera: settings.camera || '',
  siteUrl: import.meta.env.SITE || (settings.github ? `https://${settings.github}.github.io` : ''),
  hubUrl: 'https://piratesocial.app',
  social: {
    github: settings.github || '',
    instagram: settings.instagram || '',
    mastodon: settings.mastodon || '',
  },
  giphyKey: (settings as any).giphyKey || '',
};
