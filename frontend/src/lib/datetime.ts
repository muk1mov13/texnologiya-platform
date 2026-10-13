/** ISO sanani `<input type="datetime-local">` qiymatiga (mahalliy vaqt, `YYYY-MM-DDTHH:mm`) aylantiradi. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

/** `datetime-local` qiymatini (mahalliy vaqt) ISO UTC satriga aylantiradi; bo'sh bo'lsa `null`. */
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}
