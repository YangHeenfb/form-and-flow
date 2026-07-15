import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { probabilityManifest } from './manifest.ts'

export function ProbabilityHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(probabilityManifest, locale)
  return <ModuleHomeLayout module={module} className="probability-home" />
}
