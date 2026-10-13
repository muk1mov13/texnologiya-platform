/** LLM javobidagi oddiy markdown belgilarini olib tashlaydi (matn `whitespace-pre-wrap` bilan chiziladi). */
export function plainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
}
