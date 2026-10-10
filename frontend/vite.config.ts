/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// E2E testlar backend'ni boshqa portda ishga tushiradi (playwright.config.ts).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'
const proxy = { '/api': { target: apiTarget, changeOrigin: true } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Har bir worker o'z jsdom muhitini yaratadi. Sukut bo'yicha workerlar soni yadrolar
    // soniga teng (8 ta) va kam xotirali mashinada ular RAM'ni to'ldirib, jarayonni
    // 0xC0000409/134 kodi bilan yiqitardi. 2 ta worker bilan suite ~40 soniyada barqaror tugaydi.
    maxWorkers: 2,
  },
})
