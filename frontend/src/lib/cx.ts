export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** `Button`dagi kabi klaviatura fokusi halqasi — oddiy `Link`larda ham qayta ishlatiladi. */
export const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700'
