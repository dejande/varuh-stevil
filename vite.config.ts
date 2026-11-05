import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

const REPO_BASE = '/varuh-stevil/';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? REPO_BASE : '/';
  return {
    base,
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
        },
      },
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        scope: base,
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'Varuh števil',
          short_name: 'Varuh števil',
          description: 'Math practice battles / Vaje iz računanja',
          lang: 'sl',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'any',
          background_color: '#1d2b3a',
          theme_color: '#1d2b3a',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,json}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
      }),
    ],
    test: {
      include: ['tests/**/*.test.ts'],
    },
  };
});
