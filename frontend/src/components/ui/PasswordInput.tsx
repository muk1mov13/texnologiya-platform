import { useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { cx, FOCUS_RING } from '@/lib/cx'
import { Input } from './Field'

/** Parol maydoni: chapda qulf ikonka, o'ngda ko'rsatish/yashirish tugmasi. */
export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      icon="lock"
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
          aria-pressed={visible}
          className={cx(
            'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700',
            FOCUS_RING,
          )}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} className="size-5" />
        </button>
      }
    />
  )
}
