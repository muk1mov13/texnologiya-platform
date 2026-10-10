import { setupServer } from 'msw/node'

// Har test o'ziga kerakli handler'larni `server.use(...)` bilan qo'shadi.
export const server = setupServer()
