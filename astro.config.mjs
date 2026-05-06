// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

// For project sites (e.g. user.github.io/reponame), BASE_PATH must be set
const base = process.env.BASE_PATH || undefined;

export default defineConfig({
  site: process.env.SITE_URL || 'https://madmonkey.github.io',
  ...(base ? { base } : {}),
  integrations: [mdx(), sitemap(), preact({ compat: true })],
  vite: {
    plugins: [tailwindcss()],
    esbuild: {
      jsxImportSource: 'preact',
      jsx: 'automatic',
    },
    server: {
      fs: {
        allow: ['.', 'node_modules'],
      },
    },
  },
  output: 'static',
  build: {
    assets: '_assets',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
