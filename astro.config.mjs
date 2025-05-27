// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { resolve } from 'node:path';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), react(), sitemap()],

  site: 'https://yeoford.org',

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@layouts': resolve(__dirname, './src/layout'),
      },
    },
  },
});
