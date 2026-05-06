import pwa from '../content/pwa.json';

export async function GET() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const manifest = {
    name: pwa.name,
    short_name: pwa.shortName,
    description: pwa.description,
    start_url: pwa.startUrl || '/',
    display: pwa.display || 'standalone',
    background_color: pwa.backgroundColor || '#09090b',
    theme_color: pwa.themeColor || '#09090b',
    icons: [
      {
        src: `${base}${pwa.icon192}`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${base}${pwa.icon512}`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    ...(pwa.screenshot
      ? {
          screenshots: [
            {
              src: `${base}${pwa.screenshot}`,
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
            },
          ],
        }
      : {}),
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
