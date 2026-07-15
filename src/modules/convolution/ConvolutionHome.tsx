import { ModuleHomeLayout } from '../../platform/ModuleHomeLayout.tsx'
import { localizeModule } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { convolutionUiCopy } from './convolutionCopy.ts'
import { convolutionManifest } from './manifest.ts'

export function ConvolutionHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(convolutionManifest, locale)
  const copy = convolutionUiCopy[locale]
  const related = [
    {
      id: 'fourier',
      routeBase: '/modules/fourier',
      title: locale === 'zh' ? '傅里叶变换' : 'Fourier Transform',
    },
    {
      id: 'probability',
      routeBase: '/modules/probability',
      title: locale === 'zh' ? '概率直觉' : 'Probability Intuition',
    },
  ]

  return (
    <ModuleHomeLayout
      module={module}
      className="convolution-home"
      description={<><p>{module.description}</p><p>{copy.homeSummary}</p></>}
      relatedLinks={(
        <nav className="related-row" aria-label={copy.relatedModulesAria}>
        {related.map((relatedModule) => (
          <a href={relatedModule.routeBase} key={relatedModule.id}>
            {copy.relatedPrefix}: {relatedModule.title}
          </a>
        ))}
        </nav>
      )}
    />
  )
}
