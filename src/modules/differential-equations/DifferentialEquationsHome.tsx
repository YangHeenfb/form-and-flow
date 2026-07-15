import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { differentialEquationsManifest } from './manifest.ts'

export function DifferentialEquationsHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(differentialEquationsManifest, locale)
  return <ModuleHomeLayout module={module} className="diffeq-home" />
}
