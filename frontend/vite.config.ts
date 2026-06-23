import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('lucide-react')) return 'vendor-lucide'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('/react/')
          ) {
            return 'vendor-react'
          }
          if (id.includes('zustand') || id.includes('axios')) return 'vendor-utils'
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UMKM POS',
        short_name: 'UMKM POS',
        description: 'Kasir Toko Online untuk UMKM',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Precache shell saja — hindari 80+ request JS saat SW install
        globPatterns: ['**/*.{html,ico,png,svg,woff2,css,webmanifest}'],
        navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-assets',
              expiration: {
                maxEntries: 48,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
})
