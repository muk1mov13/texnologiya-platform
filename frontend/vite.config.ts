/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// E2E testlar backend'ni boshqa portda ishga tushiradi (playwright.config.ts).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'
const proxy = { '/api': { target: apiTarget, changeOrigin: true } }
// Vite notanish Host'ni bloklaydi; saytni vaqtincha ngrok orqali ko'rsatish uchun
// uning domenlariga ruxsat (deploy/README.md, "ngrok" bo'limi).
const allowedHosts = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, proxy, allowedHosts },
  preview: { port: 4173, proxy, allowedHosts },
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
