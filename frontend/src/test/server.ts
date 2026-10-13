import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import type { AiUsageMe, Dashboard } from '@/api/types'

const emptyDashboard: Dashboard = {
  xp_total: 0,
  streak: { current: 0, longest: 0, active_today: false },
  badges: [],
  continue_step: null,
}

const aiDisabled: AiUsageMe = { used: 0, limit: null, enabled: false }

// Har test o'ziga kerakli handler'larni `server.use(...)` bilan qo'shadi. Bosh sahifalardagi
// yordamchi bloklar — talabaning XP/seriyasi (`/api/me/dashboard`) va o'qituvchining
// tekshirilmagan javoblar soni (`/api/teach/summary`) — uchun standart bo'sh javoblar shu yerda:
// ularga tegishli bo'lmagan testlar alohida handler yozishi shart emas. AI (`/api/ai/usage`)
// sukut bo'yicha o'chiq — AI elementlari chizilmaydi; AI testlari o'z handler'ini beradi.
export const server = setupServer(
  http.get('/api/me/dashboard', () => HttpResponse.json(emptyDashboard)),
  http.get('/api/teach/summary', () => HttpResponse.json({ pending_submissions: 0 })),
  http.get('/api/ai/usage', () => HttpResponse.json(aiDisabled)),
)
