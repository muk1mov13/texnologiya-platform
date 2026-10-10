// E2E uchun toza backend: yangi SQLite baza, migratsiyalar, admin va namuna PDF, so'ng uvicorn.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(here, '.data')
const backendDir = resolve(here, '../../backend')
const port = process.env.E2E_API_PORT ?? '8001'
const samplePdf = resolve(dataDir, 'sample.pdf')

rmSync(dataDir, { recursive: true, force: true })
mkdirSync(resolve(dataDir, 'media'), { recursive: true })

// Admin ma'lumotlari e2e/learning-flow.spec.ts dagi ADMIN bilan bir xil bo'lishi kerak.
const env = {
  ...process.env,
  ENV: 'dev',
  DATABASE_URL: `sqlite+aiosqlite:///${resolve(dataDir, 'e2e.db').replaceAll('\\', '/')}`,
  MEDIA_ROOT: resolve(dataDir, 'media'),
  JWT_SECRET: 'e2e-only-secret-not-for-production-000000',
  COOKIE_SECURE: 'false',
  ADMIN_EMAIL: 'admin@e2e.uz',
  ADMIN_PASSWORD: 'e2e-admin-parol-123',
}

function uv(args) {
  const result = spawnSync('uv', ['run', ...args], { cwd: backendDir, env, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`E2E backend tayyorlanmadi: uv run ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

uv(['alembic', 'upgrade', 'head'])
uv(['python', '-m', 'app.cli', 'create-admin', '--name', 'E2E Admin'])
uv([
  'python',
  '-c',
  `import pymupdf; d = pymupdf.open(); p = d.new_page(); p.insert_text((72, 72), "Kasb tanlash asoslari"); d.save(${JSON.stringify(samplePdf)})`,
])

const server = spawn('uv', ['run', 'uvicorn', 'app.main:create_app', '--factory', '--port', port], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.kill(signal)
    process.exit(0)
  })
}
server.on('exit', (code) => process.exit(code ?? 0))
