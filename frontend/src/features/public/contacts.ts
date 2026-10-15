import type { SiteContacts } from '@/api/types'

/** Kamida bitta kontakt (telefon, email, manzil yoki ish vaqti) to'ldirilganmi. */
export function hasAnyContact(contacts: SiteContacts | undefined): contacts is SiteContacts {
  return !!contacts && !!(contacts.phone || contacts.email || contacts.address || contacts.hours)
}
