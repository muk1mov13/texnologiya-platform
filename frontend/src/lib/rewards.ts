import type { Rewards } from '@/api/types'
import { pushToast } from '@/components/ui/toast-store'
import { i18n } from '@/i18n'

/** XP va yangi nishonlarni toast bilan e'lon qiladi (0 XP va nishonsiz bo'lsa hech narsa chiqmaydi). */
export function announceRewards(rewards: Rewards): void {
  if (rewards.xp > 0) pushToast('success', i18n.t('rewards.xp', { xp: rewards.xp }))
  for (const badge of rewards.new_badges) {
    const title = i18n.language === 'ru' ? badge.title_ru : badge.title_uz
    pushToast('info', i18n.t('rewards.badge', { icon: badge.icon, title }))
  }
}
