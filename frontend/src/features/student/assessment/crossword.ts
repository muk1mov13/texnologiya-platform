import type { StudentLayout, StudentLayoutWord } from '@/api/types'

export type CellKey = `${number}:${number}`

export function cellKey(row: number, col: number): CellKey {
  return `${row}:${col}`
}

/** So'z kataklari boshidan oxirigacha. */
export function wordCells(word: StudentLayoutWord): CellKey[] {
  return Array.from({ length: word.length }, (_, k) =>
    word.direction === 'across' ? cellKey(word.row, word.col + k) : cellKey(word.row + k, word.col),
  )
}

/** To'rdagi har katak qaysi so'zlarga tegishli (`layout.words` indekslari; kesishmada ikkita). */
export function cellOwners(layout: StudentLayout): Map<CellKey, number[]> {
  const owners = new Map<CellKey, number[]>()
  layout.words.forEach((word, index) => {
    for (const key of wordCells(word)) owners.set(key, [...(owners.get(key) ?? []), index])
  })
  return owners
}

/** Kataklar qiymatidan backend kutgan javoblar ro'yxati (`layout.words` tartibida). */
export function answersFromCells(layout: StudentLayout, values: Map<CellKey, string>): string[] {
  return layout.words.map((word) =>
    wordCells(word)
      .map((key) => values.get(key) ?? '')
      .join(''),
  )
}

const APOSTROPHES = /['ʻʼ’‘`]/g

/** Katakka kiritilgan qiymatni normallashtiradi: oxirgi harf, katta; Oʻ va Gʻ bitta katak. */
export function normalizeCellInput(raw: string): string {
  const text = raw.toUpperCase().replace(APOSTROPHES, 'ʻ')
  const match = text.match(/[OG]ʻ$/u) ?? text.match(/\p{L}$/u)
  return match ? match[0] : ''
}

/** "O" yoki "G" dan keyin apostrof kelishi mumkin — bunday katakdan fokus darhol o'tmaydi. */
export function mayTakeApostrophe(value: string): boolean {
  return value === 'O' || value === 'G'
}
