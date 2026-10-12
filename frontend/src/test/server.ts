import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import type { Dashboard } from '@/api/types'

const emptyDashboard: Dashboard = {
  xp_total: 0,
  streak: { current: 0, longest: 0, active_today: false },
  badges: [],
  continue_step: null,
}

// Har test o'ziga kerakli handler'larni `server.use(...)` bilan qo'shadi. Talaba bosh sahifasidagi
// XP/seriya bloki (`/api/me/dashboard`) uchun standart bo'sh javob shu yerda: unga tegishli
// bo'lmagan testlar alohida handler yozishi shart emas.
export const server = setupServer(http.get('/api/me/dashboard', () => HttpResponse.json(emptyDashboard)))
