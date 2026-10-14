import { usePageMeta } from '@/lib/usePageMeta'
import { ExploreSection } from './home/ExploreSection'
import { FeaturesSection } from './home/FeaturesSection'
import { HeroSection } from './home/HeroSection'
import { HowItWorksSection } from './home/HowItWorksSection'
import { NewsSection } from './home/NewsSection'

/** Ochiq sayt bosh sahifasi: bo'limlar `home/` papkasida, har biri o'z konteyneri bilan. */
export function HomePage() {
  usePageMeta('')
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <NewsSection />
      <ExploreSection />
    </>
  )
}
