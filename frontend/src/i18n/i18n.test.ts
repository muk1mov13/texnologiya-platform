import { i18n, setLanguage } from '.'
import ru from './ru.json'
import uz from './uz.json'

type Dict = { [key: string]: string | Dict }

function flatten(dict: Dict, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(dict)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else Object.assign(result, flatten(value, path))
  }
  return result
}

const flatUz = flatten(uz as Dict)
const flatRu = flatten(ru as Dict)

function variables(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
}

test('uz va ru lug\'atlarida kalitlar bir xil', () => {
  expect(Object.keys(flatRu).sort()).toEqual(Object.keys(flatUz).sort())
})

test('bo\'sh tarjima yo\'q', () => {
  for (const [key, value] of [...Object.entries(flatUz), ...Object.entries(flatRu)]) {
    expect(value.trim(), key).not.toBe('')
  }
})

test('interpolatsiya o\'zgaruvchilari ikkala tilda bir xil', () => {
  for (const key of Object.keys(flatUz)) {
    expect(variables(flatRu[key]), key).toEqual(variables(flatUz[key]))
  }
})

test('setLanguage tilni almashtiradi va html lang ni yangilaydi', () => {
  setLanguage('ru')
  expect(localStorage.getItem('locale')).toBe('ru')
  expect(i18n.t('steps.lecture')).toBe(flatRu['steps.lecture'])
  expect(document.documentElement.lang).toBe('ru')
  setLanguage('uz')
  expect(i18n.t('steps.lecture')).toBe(flatUz['steps.lecture'])
})
