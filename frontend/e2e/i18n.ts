import { readFileSync } from 'node:fs'

type Dict = { [key: string]: string | Dict }

const uz = JSON.parse(readFileSync(new URL('../src/i18n/uz.json', import.meta.url), 'utf8')) as Dict

export function t(path: string, vars: Record<string, string | number> = {}): string {
  let node: string | Dict = uz
  for (const part of path.split('.')) {
    if (typeof node === 'string' || !(part in node)) throw new Error(`i18n kaliti topilmadi: ${path}`)
    node = node[part]
  }
  if (typeof node !== 'string') throw new Error(`i18n kaliti matn emas: ${path}`)
  return node.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars[name] ?? ''))
}
