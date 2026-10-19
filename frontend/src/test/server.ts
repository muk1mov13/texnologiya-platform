import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import type { AiUsageMe, Dashboard, NewsPage, SiteSettings, SupportStatus } from '@/api/types'

const emptyDashboard: Dashboard = {
  xp_total: 0,
  streak: { current: 0, longest: 0, active_today: false },
  badges: [],
  continue_step: null,
}

const aiDisabled: AiUsageMe = { used: 0, limit: null, enabled: false }

const supportDisabled: SupportStatus = { enabled: false }

const emptySite: SiteSettings = {
  contacts: { phone: '', email: '', address: '', hours: '' },
  socials: { telegram: '', instagram: '', facebook: '', youtube: '' },
  about: '',
}

const noNews: NewsPage = { items: [], total: 0, page: 1, size: 3 }

// Har test o'ziga kerakli handler'larni `server.use(...)` bilan qo'shadi. Bosh sahifalardagi
// yordamchi bloklar — talabaning XP/seriyasi (`/api/me/dashboard`) va o'qituvchining
// tekshirilmagan javoblar soni (`/api/teach/summary`) — uchun standart bo'sh javoblar shu yerda:
// ularga tegishli bo'lmagan testlar alohida handler yozishi shart emas. AI (`/api/ai/usage`)
// sukut bo'yicha o'chiq — AI elementlari chizilmaydi; AI testlari o'z handler'ini beradi.
// Ochiq saytdagi AI yordamchi (`/api/ai/support/status`) ham sukut bo'yicha o'chiq.
// Ochiq sayt footer'i (`/api/site`) va bosh sahifadagi so'nggi yangiliklar (`/api/news`) — bo'sh.
export const server = setupServer(
  http.get('/api/me/dashboard', () => HttpResponse.json(emptyDashboard)),
  http.get('/api/teach/summary', () => HttpResponse.json({ pending_submissions: 0 })),
  http.get('/api/ai/usage', () => HttpResponse.json(aiDisabled)),
  http.get('/api/site', () => HttpResponse.json(emptySite)),
  http.get('/api/news', () => HttpResponse.json(noNews)),
  http.get('/api/ai/support/status', () => HttpResponse.json(supportDisabled)),
)
