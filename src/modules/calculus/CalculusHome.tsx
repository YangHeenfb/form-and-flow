import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { calculusManifest } from './manifest.ts'

export function CalculusHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(calculusManifest, locale)
  return <ModuleHomeLayout module={module} className="calculus-home" />
}
