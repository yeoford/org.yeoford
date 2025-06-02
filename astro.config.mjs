// @ts-check
import { resolve } from 'node:path';

import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), react(), sitemap()],

  site: 'https://yeoford.org',

  viewTransitions: true,

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@layouts': resolve(__dirname, './src/layout')
      }
    }
  }
});
