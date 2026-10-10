// Backend OpenAPI sxemasidan `src/api/schema.gen.ts` ni generatsiya qiladi.
// Server ishga tushirilmaydi: sxema `create_app().openapi()` dan to'g'ridan-to'g'ri olinadi.
// CI shu skriptni ishga tushirib, fayl o'zgarmaganini tekshiradi (backend bilan drift).
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const here = dirname(fileURLToPath(import.meta.url))
const backendDir = resolve(here, '../../backend')
const output = resolve(here, '../src/api/schema.gen.ts')
const mediaDir = mkdtempSync(join(tmpdir(), 'texnologiya-openapi-'))

const dump = [
  'import json',
  'from app.main import create_app',
  'print(json.dumps(create_app().openapi(), ensure_ascii=False, sort_keys=True))',
].join('; ')

const result = spawnSync('uv', ['run', 'python', '-c', dump], {
  cwd: backendDir,
  encoding: 'utf8',
  env: {
    ...process.env,
    ENV: 'dev',
    DATABASE_URL: 'sqlite+aiosqlite:///:memory:',
    MEDIA_ROOT: mediaDir,
    PYTHONIOENCODING: 'utf-8',
  },
  maxBuffer: 32 * 1024 * 1024,
})
rmSync(mediaDir, { recursive: true, force: true })
if (result.status !== 0) {
  process.stderr.write(result.stderr)
  console.error('OpenAPI sxemasi olinmadi (backend/uv tekshirilsin).')
  process.exit(result.status ?? 1)
}

// defaultNonNullable: false — so'rov sxemalarida `default` qiymati bor maydon ixtiyoriy
// (backend uni o'zi to'ldiradi). Javob sxemalarida majburiylik `required` orqali keladi.
const ast = await openapiTS(JSON.parse(result.stdout), { defaultNonNullable: false })
const header = [
  '// Bu fayl avtomatik generatsiya qilinadi — qo\'lda tahrirlamang.',
  '// Yangilash: `npm run gen:api` (backend OpenAPI sxemasidan).',
  '',
].join('\n')
writeFileSync(output, header + astToString(ast))
console.log(`Yozildi: ${output}`)
