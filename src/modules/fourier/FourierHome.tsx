import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { fourierManifest } from './manifest.ts'

export function FourierHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(fourierManifest, locale)
  const description = locale === 'zh'
    ? '信号通过绕圈、频率扫描和傅里叶系数重建，显露出组成它的旋转频率分量。'
    : 'Winding, frequency scans, and reconstruction from Fourier coefficients reveal the rotating frequency components inside a signal.'
  return <ModuleHomeLayout module={module} className="fourier-home" description={<p>{description}</p>} />
}
