import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { fourierManifest } from './manifest.ts'

export function FourierHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(fourierManifest, locale)
  const description = locale === 'zh'
    ? '通过缠绕信号、扫描频率空间和用傅里叶系数重建信号，探索信号如何分解成频率。'
    : 'Explore how signals decompose into frequencies by winding them around circles, scanning frequency space, and reconstructing signals from Fourier coefficients.'
  return <ModuleHomeLayout module={module} className="fourier-home" description={<p>{description}</p>} />
}
