import { cx } from '@/lib/cx'

/** Kirish/ro'yxatdan o'tish formasining asosiy tugmasi (`Button` ustidan gradient va "glow"). */
export const AUTH_SUBMIT = cx(
  'group mt-2 w-full rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 py-3 font-bold shadow-glow',
  'hover:-translate-y-0.5 hover:brightness-110 motion-reduce:hover:translate-y-0',
)

/** Forma ichidagi ikkinchi darajali havola (masalan, "Kirish"). */
export const AUTH_LINK = 'font-semibold text-brand-700 underline-offset-4 hover:underline'
