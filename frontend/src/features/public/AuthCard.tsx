import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { scaleIn } from '@/lib/motion'
import { AuthAside } from './AuthAside'

interface AuthCardProps {
  title: string
  subtitle?: string
  /** Chap paneldagi matnlar qaysi sahifaga mos bo'lishi. */
  variant: 'login' | 'register'
  children: ReactNode
  footer?: ReactNode
}

/** Kirish/ro'yxatdan o'tish uchun split-screen karta: `lg+` da chapda brand panel, o'ngda forma. */
export function AuthCard({ title, subtitle, variant, children, footer }: AuthCardProps) {
  return (
    <m.div
      initial="hidden"
      animate="show"
      variants={scaleIn}
      className="mx-auto grid w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70 lg:max-w-5xl lg:grid-cols-[1fr_1.1fr]"
    >
      <AuthAside variant={variant} />
      <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 xl:px-14">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && (
            <p className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">{footer}</p>
          )}
        </div>
      </div>
    </m.div>
  )
}
