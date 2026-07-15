import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { matrixManifest } from './manifest.ts'

export function MatrixHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(matrixManifest, locale)
  return <ModuleHomeLayout module={module} />
}
