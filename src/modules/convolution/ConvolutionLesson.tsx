import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from 'react'
import { CircleHelp, Download, Pause, Play, RotateCcw } from 'lucide-react'
import { drawGrid, GraphCanvas, worldToScreen, type GraphTheme, type GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton, type HelpTopic } from '../../core/ui/LearningHelp.tsx'
import { SelectMenu } from '../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../i18n.ts'
import { LessonStageActions } from '../../platform/LessonStageActions.tsx'
import { ModuleFocusFrame } from '../../platform/ModuleFocusFrame.tsx'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import type { BoundaryMode, ConvolutionMode, NumericSample, OperationMode, TermContribution } from './convolutionTypes.ts'
import { convolutionLessonCopy, convolutionUiCopy, type ConvolutionLessonId, type ConvolutionUiCopy } from './convolutionCopy.ts'
import {
  discretePresets,
  imageKernelPresets,
  polynomialPresets,
  probabilityPresets,
  signalKernelPresets,
  signalPresets,
} from './convolutionPresets.ts'
import { continuousConvolutionAt, continuousConvolutionCurve, makeContinuousPresetFunction, productCurveAtShift, sampleFunction, type ContinuousPresetId } from './math/continuousConvolution.ts'
import { crossCorrelate, discreteConvolutionTerms, discreteConvolve, flipSequence, isSymmetricKernel } from './math/discreteConvolution.ts'
import {
  applyKernelAtPixel,
  applyKernelToImageData,
  flipKernel2D,
  makeIdentityKernel3,
  normalizeKernel2D,
  type ImageConvolutionOptions,
  type Kernel2D,
} from './math/imageConvolution.ts'
import { convolutionTermsForCoefficient, evaluatePolynomial, formatCoefficientList, parseCoefficientList, polynomialMultiply, polynomialToString } from './math/polynomialConvolution.ts'
import { convolveDistributions, distributionMean, distributionVariance, normalizeDistribution, type DiscreteDistribution } from './math/probabilityConvolution.ts'
import { convolveSignal } from './math/signalKernels.ts'
import {
  decodeContinuousState,
  decodeDiscreteState,
  decodeImageKernelState,
  decodePolynomialState,
  decodeProbabilityState,
  decodeSignalState,
  formatNumberList,
} from './shared/convolutionUrlState.ts'

type ValueRow = {
  label: string
  value: string
}

type FormulaDisplay = {
  formula: string
  formulaTex: string
  note?: string
}

type ControlHelpers = {
  openTerm: (term: ConvolutionTermId) => void
}

type ConvolutionTermId =
  | 'sequence-a'
  | 'sequence-b'
  | 'index'
  | 'output-index'
  | 'flip'
  | 'kernel'
  | 'overlap'
  | 'multiply-sum'
  | 'correlation'
  | 'boundary'
  | 'image-kernel'
  | 'continuous-integral'
  | 'mode'
  | 'sigma'
  | 'noise'
  | 'seed'
  | 'normalize-kernel'
  | 'preserve-alpha'
  | 'grayscale'
  | 'integration-samples'
  | 'expectation'
  | 'variance'
  | 'probability-weight'
  | 'coefficient-sum'

type ConvolutionHelpMode = { kind: 'beginner' } | { kind: 'graph' } | { kind: 'term'; term: ConvolutionTermId }

const continuousPresetOptions: { id: ContinuousPresetId; label: string; tex: string }[] = [
  { id: 'rectangle', label: 'rectangle', tex: '\\operatorname{rect}(t)' },
  { id: 'triangle', label: 'triangle', tex: '\\max(0,1-|t|)' },
  { id: 'gaussian', label: 'gaussian', tex: 'e^{-t^2/(2\\sigma^2)}' },
  { id: 'exponential', label: 'exponential decay', tex: 'e^{-t}\\mathbf{1}_{t\\ge 0}' },
  { id: 'bumps', label: 'two bumps', tex: 'e^{-(t+0.75)^2/(2\\sigma^2)}+0.65e^{-(t-0.85)^2/(2(0.65\\sigma)^2)}' },
]

const discretePlaybackSpeedScale = 0.8

export function ConvolutionLesson({ lessonId }: { lessonId: ConvolutionLessonId }) {
  if (lessonId === 'discrete') return <DiscreteConvolutionLesson />
  if (lessonId === 'probability') return <ProbabilitySumLesson />
  if (lessonId === 'signal') return <SignalFilteringLesson />
  if (lessonId === 'image-kernel') return <ImageKernelLesson />
  if (lessonId === 'polynomial') return <PolynomialMultiplicationLesson />
  return <ContinuousConvolutionLesson />
}

function DiscreteConvolutionLesson() {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const initial = useMemo(() => decodeDiscreteState(readParams()), [])
  const [presetId, setPresetId] = useState('custom-small')
  const [a, setA] = useState(initial.a)
  const [b, setB] = useState(initial.b)
  const [mode, setMode] = useState<ConvolutionMode>(initial.mode)
  const [operation, setOperation] = useState<OperationMode>(initial.operation)
  const [k, setK] = useState(initial.k)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const output = useMemo(() => (operation === 'convolution' ? discreteConvolve(a, b, mode) : crossCorrelate(a, b, mode)), [a, b, mode, operation])
  const maxK = Math.max(0, output.length - 1)
  const currentK = clamp(Math.round(k), 0, maxK)
  const fullIndex = fullIndexFromVisibleIndex(currentK, mode, a.length, b.length)
  const orientedKernel = operation === 'convolution' ? b : flipSequence(b)
  const terms = discreteConvolutionTerms(a, orientedKernel, fullIndex)
  const displayTerms = termsForDisplayedKernel(terms, b.length, operation)
  const currentValue = output[currentK] ?? 0
  const formula = operationFormula('discrete', operation, ui)

  useAnimationStep(playing, speed * discretePlaybackSpeedScale, () => setK((value) => (value >= maxK ? 0 : value + 1)))

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawDiscreteScene(ctx, viewport, theme, { a, b, output, currentK, fullIndex, terms, operation, labels: ui.canvas })
    },
    [a, b, currentK, fullIndex, operation, output, terms, ui.canvas],
  )

  const values: ValueRow[] = [
    { label: ui.labels.currentK, value: String(currentK) },
    { label: ui.labels.yk, value: formatNumber(currentValue, ui) },
    { label: ui.labels.overlapCount, value: String(terms.length) },
    { label: ui.labels.operation, value: optionLabel(ui, operation) },
    { label: ui.labels.kernelSymmetric, value: isSymmetricKernel(b) ? ui.yes : ui.no },
    { label: ui.labels.currentCalculation, value: formatTermCalculation(displayTerms, ui, 'y', currentK, currentValue) },
  ]

  return (
    <LessonFrame
      lessonId="discrete"
      operation={operation}
      formula={formula}
      canvas={
        <GraphCanvas
          className="graph-canvas convolution-canvas"
          ariaLabel={ui.canvas.discreteAria}
          xMin={0}
          xMax={1}
          yMin={0}
          yMax={1}
          draw={draw}
        />
      }
      controls={({ openTerm }) => (
        <>
          <SelectControl
            label={ui.preset}
            value={presetId}
            options={discretePresets.map((preset) => ({ value: preset.id, label: optionLabel(ui, preset.label) }))}
            onChange={(id) => {
              const preset = discretePresets.find((candidate) => candidate.id === id) ?? discretePresets[0]
              setPresetId(preset.id)
              setA(preset.a)
              setB(preset.b)
              setK(0)
            }}
          />
          <SequenceEditor label={ui.labels.sequenceA} values={a} onChange={(values) => {
            setPresetId('custom-small')
            setA(values)
          }} addLabel={ui.add} helpTerm="sequence-a" onHelp={openTerm} />
          <SequenceEditor label={ui.labels.kernelB} values={b} onChange={(values) => {
            setPresetId('custom-small')
            setB(values)
          }} addLabel={ui.add} helpTerm="sequence-b" onHelp={openTerm} />
          <SelectControl label={ui.labels.mode} value={mode} options={modeOptions(ui)} onChange={(next) => setMode(next as ConvolutionMode)} helpTerm="mode" onHelp={openTerm} />
          <SelectControl label={ui.labels.operation} value={operation} options={operationOptions(ui)} onChange={(next) => setOperation(next as OperationMode)} helpTerm="correlation" onHelp={openTerm} />
          <Range label={ui.labels.shiftOutputIndex} value={currentK} min={0} max={maxK} step={1} onChange={setK} helpTerm="output-index" onHelp={openTerm} />
          <p className="input-help">{ui.operationNote}</p>
        </>
      )}
      playback={<PlaybackControls ui={ui} playing={playing} speed={speed} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onReset={() => setK(0)} onSpeed={setSpeed} />}
      values={values}
      onExport={() => exportConvolutionCanvas('discrete')}
    />
  )
}

function ProbabilitySumLesson() {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const initial = useMemo(() => decodeProbabilityState(readParams()), [])
  const [presetId, setPresetId] = useState(initial.preset)
  const [sum, setSum] = useState(initial.sum)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const preset = probabilityPresets.find((candidate) => candidate.id === presetId) ?? probabilityPresets[0]
  const xDistribution = normalizeDistribution(preset.x)
  const yDistribution = normalizeDistribution(preset.y)
  const output = useMemo(() => convolveDistributions(xDistribution, yDistribution), [xDistribution, yDistribution])
  const minSum = output.support[0] ?? 0
  const maxSum = output.support[output.support.length - 1] ?? 0
  const currentSum = clamp(Math.round(sum), minSum, maxSum)
  const probability = output.probabilities[output.support.indexOf(currentSum)] ?? 0
  const pairTerms = probabilityPairTerms(xDistribution, yDistribution, currentSum)

  useAnimationStep(playing, speed, () => setSum((value) => (value >= maxSum ? minSum : value + 1)))

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawProbabilityScene(ctx, viewport, theme, { xDistribution, yDistribution, output, selectedSum: currentSum, labels: ui.canvas })
    },
    [currentSum, output, xDistribution, yDistribution, ui.canvas],
  )

  const values: ValueRow[] = [
    { label: ui.labels.selectedSum, value: String(currentSum) },
    { label: ui.labels.probabilityAtSum, value: formatNumber(probability, ui) },
    { label: ui.labels.ex, value: formatNumber(distributionMean(xDistribution), ui) },
    { label: ui.labels.ey, value: formatNumber(distributionMean(yDistribution), ui) },
    { label: ui.labels.exPlusY, value: formatNumber(distributionMean(output), ui) },
    { label: ui.labels.varXPlusY, value: formatNumber(distributionVariance(output), ui) },
    { label: ui.labels.currentCalculation, value: formatProbabilityCalculation(pairTerms, currentSum, probability, ui) },
  ]

  return (
    <LessonFrame
      lessonId="probability"
      canvas={<GraphCanvas className="graph-canvas convolution-canvas" ariaLabel={ui.canvas.probabilityAria} xMin={0} xMax={1} yMin={0} yMax={1} draw={draw} />}
      controls={({ openTerm }) => (
        <>
          <SelectControl
            label={ui.preset}
            value={preset.id}
            options={probabilityPresets.map((candidate) => ({ value: candidate.id, label: optionLabel(ui, candidate.label) }))}
            onChange={(id) => {
              const next = probabilityPresets.find((candidate) => candidate.id === id) ?? probabilityPresets[0]
              setPresetId(next.id)
              const nextOutput = convolveDistributions(next.x, next.y)
              setSum(nextOutput.support[Math.floor(nextOutput.support.length / 2)] ?? 0)
            }}
          />
          <Range label={ui.labels.sumS} value={currentSum} min={minSum} max={maxSum} step={1} onChange={setSum} helpTerm="probability-weight" onHelp={openTerm} />
          <p className="input-help">{optionLabel(ui, preset.note)}</p>
          <DistributionTable xDistribution={xDistribution} yDistribution={yDistribution} selectedSum={currentSum} ariaLabel={ui.canvas.pairsForSum} ui={ui} />
        </>
      )}
      playback={<PlaybackControls ui={ui} playing={playing} speed={speed} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onReset={() => setSum(minSum)} onSpeed={setSpeed} />}
      values={values}
      onExport={() => exportConvolutionCanvas('probability')}
    />
  )
}

function SignalFilteringLesson() {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const initial = useMemo(() => decodeSignalState(readParams()), [])
  const [signalId, setSignalId] = useState(initial.signal)
  const [kernelId, setKernelId] = useState(initial.kernel)
  const [mode, setMode] = useState<ConvolutionMode>(initial.mode)
  const [boundary, setBoundary] = useState<BoundaryMode>(initial.boundary)
  const [operation, setOperation] = useState<OperationMode>('convolution')
  const [length, setLength] = useState(initial.length)
  const [sigma, setSigma] = useState(initial.sigma)
  const [noise, setNoise] = useState(initial.noise)
  const [seed, setSeed] = useState(initial.seed)
  const [index, setIndex] = useState(initial.index)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const signalPreset = signalPresets.find((candidate) => candidate.id === signalId) ?? signalPresets[0]
  const kernelPreset = signalKernelPresets.find((candidate) => candidate.id === kernelId) ?? signalKernelPresets[0]
  const signal = useMemo(() => signalPreset.make(Math.round(length), seed, noise), [length, noise, seed, signalPreset])
  const kernel = useMemo(() => kernelPreset.make(kernelId === 'gaussian' ? 7 : 5, sigma), [kernelId, kernelPreset, sigma])
  const output = useMemo(() => filterSignal(signal, kernel, mode, boundary, operation), [boundary, kernel, mode, operation, signal])
  const maxIndex = Math.max(0, output.length - 1)
  const currentIndex = clamp(Math.round(index), 0, maxIndex)
  const currentValue = output[currentIndex] ?? 0
  const fullIndex = fullIndexFromVisibleIndex(currentIndex, mode, signal.length, kernel.length)
  const signalTerms = discreteConvolutionTerms(signal, operation === 'convolution' ? kernel : flipSequence(kernel), fullIndex)
  const displayTerms = termsForDisplayedKernel(signalTerms, kernel.length, operation)
  const formula = operationFormula('signal', operation, ui)

  useAnimationStep(playing, speed, () => setIndex((value) => (value >= maxIndex ? 0 : value + 1)))

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawSignalScene(ctx, viewport, theme, { signal, kernel, output, currentIndex, fullIndex, operation, labels: ui.canvas })
    },
    [currentIndex, fullIndex, kernel, operation, output, signal, ui.canvas],
  )

  const values: ValueRow[] = [
    { label: ui.labels.currentIndex, value: String(currentIndex) },
    { label: ui.labels.kernelSize, value: String(kernel.length) },
    { label: ui.labels.outputValue, value: formatNumber(currentValue, ui) },
    { label: ui.labels.mode, value: optionLabel(ui, mode) },
    { label: ui.labels.boundaryMode, value: optionLabel(ui, boundary) },
    { label: ui.labels.currentCalculation, value: formatTermCalculation(displayTerms, ui, 'y', currentIndex, currentValue) },
  ]

  return (
    <LessonFrame
      lessonId="signal"
      operation={operation}
      formula={formula}
      canvas={<GraphCanvas className="graph-canvas convolution-canvas" ariaLabel={ui.canvas.signalAria} xMin={0} xMax={1} yMin={0} yMax={1} draw={draw} />}
      controls={({ openTerm }) => (
        <>
          <div className="control-group">
            <h3>{ui.labels.basicControls}</h3>
            <SelectControl label={ui.labels.signal} value={signalPreset.id} options={signalPresets.map((preset) => ({ value: preset.id, label: optionLabel(ui, preset.label) }))} onChange={setSignalId} helpTerm="sequence-a" onHelp={openTerm} />
            <SelectControl label={ui.labels.kernel} value={kernelPreset.id} options={signalKernelPresets.map((preset) => ({ value: preset.id, label: optionLabel(ui, preset.label) }))} onChange={setKernelId} helpTerm="kernel" onHelp={openTerm} />
            <Range label={ui.labels.kernelPosition} value={currentIndex} min={0} max={maxIndex} step={1} onChange={setIndex} helpTerm="output-index" onHelp={openTerm} />
          </div>
          <div className="control-group">
            <h3>{ui.labels.advancedControls}</h3>
            <SelectControl label={ui.labels.mode} value={mode} options={modeOptions(ui)} onChange={(next) => setMode(next as ConvolutionMode)} helpTerm="mode" onHelp={openTerm} />
            <SelectControl label={ui.labels.boundaryMode} value={boundary} options={boundaryOptions(ui)} onChange={(next) => setBoundary(next as BoundaryMode)} helpTerm="boundary" onHelp={openTerm} />
            <SelectControl label={ui.labels.operation} value={operation} options={operationOptions(ui)} onChange={(next) => setOperation(next as OperationMode)} helpTerm="correlation" onHelp={openTerm} />
            <Range label={ui.labels.length} value={length} min={16} max={160} step={1} onChange={setLength} />
            <Range label={ui.labels.gaussianSigma} value={sigma} min={0.2} max={3} step={0.1} onChange={setSigma} helpTerm="sigma" onHelp={openTerm} />
            <Range label={ui.labels.noiseAmplitude} value={noise} min={0} max={1.5} step={0.05} onChange={setNoise} helpTerm="noise" onHelp={openTerm} />
            <Range label={ui.labels.seed} value={seed} min={1} max={200} step={1} onChange={setSeed} helpTerm="seed" onHelp={openTerm} />
          </div>
          <p className="input-help">{ui.operationNote}</p>
        </>
      )}
      playback={<PlaybackControls ui={ui} playing={playing} speed={speed} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onReset={() => setIndex(0)} onSpeed={setSpeed} />}
      values={values}
      onExport={() => exportConvolutionCanvas('signal')}
    />
  )
}

function ImageKernelLesson() {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const initial = useMemo(() => decodeImageKernelState(readParams()), [])
  const [imagePreset, setImagePreset] = useState(initial.image)
  const [kernelPresetId, setKernelPresetId] = useState(initial.kernel)
  const [boundary, setBoundary] = useState<BoundaryMode>(initial.boundary)
  const [operation, setOperation] = useState<OperationMode>(initial.operation)
  const [normalize, setNormalize] = useState(initial.normalize)
  const [preserveAlpha, setPreserveAlpha] = useState(initial.preserveAlpha)
  const [grayscale, setGrayscale] = useState(initial.grayscale)
  const [kernelSize, setKernelSize] = useState(3)
  const [kernel, setKernel] = useState<Kernel2D>(() => imageKernelPresets.find((preset) => preset.id === initial.kernel)?.kernel ?? makeIdentityKernel3())
  const [inputImage, setInputImage] = useState<ImageData>(() => makeSampleImageData(initial.image, 180, 140))
  const [selectedPixel, setSelectedPixel] = useState({ x: 90, y: 70 })
  const [error, setError] = useState<string | null>(null)
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const outputImage = useMemo(() => {
    try {
      setError(null)
      const options: ImageConvolutionOptions = { mode: operation, boundaryMode: boundary, normalize, preserveAlpha, grayscaleBeforeApply: grayscale }
      return applyKernelToImageData(inputImage, kernel, options)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : ui.couldNotReadImage)
      return inputImage
    }
  }, [boundary, grayscale, inputImage, kernel, normalize, operation, preserveAlpha, ui.couldNotReadImage])
  const pixelResult = applyKernelAtPixel(inputImage, selectedPixel.x, selectedPixel.y, kernel, { mode: operation, boundaryMode: boundary, normalize, preserveAlpha, grayscaleBeforeApply: grayscale })
  const kernelSum = kernel.flat().reduce((sum, value) => sum + value, 0)
  const appliedKernel = useMemo(() => previewAppliedKernel(kernel, operation, normalize), [kernel, normalize, operation])
  const formula = operationFormula('image-kernel', operation, ui)

  useEffect(() => {
    if (imagePreset === 'upload') return
    const nextImage = makeSampleImageData(imagePreset, 180, 140)
    setInputImage(nextImage)
    setSelectedPixel({ x: Math.floor(nextImage.width / 2), y: Math.floor(nextImage.height / 2) })
  }, [imagePreset])

  useEffect(() => {
    drawImageDataToCanvas(inputCanvasRef.current, inputImage)
    drawImageDataToCanvas(outputCanvasRef.current, outputImage)
  }, [inputImage, outputImage])

  return (
    <LessonFrame
      lessonId="image-kernel"
      operation={operation}
      formula={formula}
      canvas={
        <div className="image-kernel-stage">
          <ImageCanvas
            title={ui.labels.inputImage}
            canvasRef={inputCanvasRef}
            imageData={inputImage}
            selectedPixel={selectedPixel}
            onSelect={(point) => setSelectedPixel(point)}
          />
          <ImageCanvas title={ui.labels.outputImage} canvasRef={outputCanvasRef} imageData={outputImage} selectedPixel={selectedPixel} onSelect={(point) => setSelectedPixel(point)} />
        </div>
      }
      controls={({ openTerm }) => (
        <>
          <SelectControl
            label={ui.labels.sampleImage}
            value={imagePreset}
            options={[
              { value: 'gradient', label: optionLabel(ui, 'gradient') },
              { value: 'checkerboard', label: optionLabel(ui, 'checkerboard') },
              { value: 'face', label: optionLabel(ui, 'simple face-like pattern') },
              { value: 'noise', label: optionLabel(ui, 'noise') },
              { value: 'edge-shapes', label: optionLabel(ui, 'edge shapes') },
              { value: 'upload', label: ui.labels.uploadImage },
            ]}
            onChange={setImagePreset}
          />
          <label>
            {ui.uploadLocalImage}
            <input type="file" accept="image/*" onChange={(event) => void loadUploadedImage(event, setInputImage, setImagePreset, setError, ui)} />
          </label>
          <SelectControl
            label={ui.labels.kernelPreset}
            value={kernelPresetId}
            options={imageKernelPresets.map((preset) => ({ value: preset.id, label: optionLabel(ui, preset.label) }))}
            onChange={(id) => {
              const preset = imageKernelPresets.find((candidate) => candidate.id === id) ?? imageKernelPresets[0]
              setKernelPresetId(preset.id)
              setKernel(resizeKernel(preset.kernel, kernelSize))
            }}
            helpTerm="image-kernel"
            onHelp={openTerm}
          />
          <SelectControl
            label={ui.labels.gridSize}
            value={String(kernelSize)}
            options={[
              { value: '3', label: '3x3' },
              { value: '5', label: '5x5' },
            ]}
            onChange={(value) => {
              const size = Number(value)
              setKernelSize(size)
              setKernel((current) => resizeKernel(current, size))
            }}
            helpTerm="kernel"
            onHelp={openTerm}
          />
          <KernelGridEditor kernel={kernel} onChange={(next) => {
            setKernel(next)
            setKernelPresetId('custom')
          }} />
          <KernelPreview
            title={operation === 'convolution' ? ui.labels.appliedKernelFlipped : ui.labels.appliedKernelDirect}
            kernel={appliedKernel}
            ui={ui}
          />
          <SelectControl label={ui.labels.operation} value={operation} options={operationOptions(ui)} onChange={(next) => setOperation(next as OperationMode)} helpTerm="correlation" onHelp={openTerm} />
          <SelectControl label={ui.labels.boundaryMode} value={boundary} options={boundaryOptions(ui)} onChange={(next) => setBoundary(next as BoundaryMode)} helpTerm="boundary" onHelp={openTerm} />
          <Toggle label={ui.labels.normalizeKernel} checked={normalize} onChange={setNormalize} helpTerm="normalize-kernel" onHelp={openTerm} />
          <Toggle label={ui.labels.preserveAlpha} checked={preserveAlpha} onChange={setPreserveAlpha} helpTerm="preserve-alpha" onHelp={openTerm} />
          <Toggle label={ui.labels.grayscaleBeforeApply} checked={grayscale} onChange={setGrayscale} helpTerm="grayscale" onHelp={openTerm} />
          <button type="button" onClick={() => exportCanvasElement(outputCanvasRef.current, 'convolution-image-output.png')}>
            <Download size={16} />
            {ui.exportOutputImage}
          </button>
          {error && <p className="warning-text">{error}</p>}
        </>
      )}
      playback={<p className="input-help">{ui.imageProcessingHelp}</p>}
      values={[
        { label: ui.labels.selectedPixel, value: `${selectedPixel.x}, ${selectedPixel.y}` },
        { label: ui.labels.kernelSum, value: formatNumber(kernelSum, ui) },
        { label: ui.labels.boundaryMode, value: optionLabel(ui, boundary) },
        { label: ui.labels.operation, value: optionLabel(ui, operation) },
        { label: ui.labels.outputRgb, value: pixelResult.slice(0, 3).map((value) => formatNumber(value, ui)).join(', ') },
      ]}
      onExport={() => exportCanvasElement(outputCanvasRef.current, 'convolution-image-kernel.png')}
    />
  )
}

function PolynomialMultiplicationLesson() {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const initial = useMemo(() => decodePolynomialState(readParams()), [])
  const [presetId, setPresetId] = useState('binomial')
  const [aText, setAText] = useState(formatNumberList(initial.a))
  const [bText, setBText] = useState(formatNumberList(initial.b))
  const [k, setK] = useState(initial.k)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const a = useMemo(() => parseCoefficientList(aText), [aText])
  const b = useMemo(() => parseCoefficientList(bText), [bText])
  const product = useMemo(() => polynomialMultiply(a, b), [a, b])
  const maxK = Math.max(0, product.length - 1)
  const currentK = clamp(Math.round(k), 0, maxK)
  const terms = convolutionTermsForCoefficient(a, b, currentK)
  const currentValue = product[currentK] ?? 0

  useAnimationStep(playing, speed, () => setK((value) => (value >= maxK ? 0 : value + 1)))

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawPolynomialScene(ctx, viewport, theme, { a, b, product, currentK, labels: ui.canvas })
    },
    [a, b, currentK, product, ui.canvas],
  )

  return (
    <LessonFrame
      lessonId="polynomial"
      canvas={<GraphCanvas className="graph-canvas convolution-canvas" ariaLabel={ui.canvas.polynomialAria} xMin={0} xMax={1} yMin={0} yMax={1} draw={draw} />}
      controls={({ openTerm }) => (
        <>
          <SelectControl
            label={ui.preset}
            value={presetId}
            options={[{ value: 'custom', label: locale === 'zh' ? '自定义' : 'custom' }, ...polynomialPresets.map((preset) => ({ value: preset.id, label: optionLabel(ui, preset.label) }))]}
            onChange={(id) => {
              if (id === 'custom') {
                setPresetId('custom')
                return
              }
              const preset = polynomialPresets.find((candidate) => candidate.id === id) ?? polynomialPresets[0]
              setPresetId(preset.id)
              setAText(formatCoefficientList(preset.a))
              setBText(formatCoefficientList(preset.b))
              setK(0)
            }}
          />
          <label>
            {ui.labels.aCoefficients}
            <input value={aText} onChange={(event) => {
              setPresetId('custom')
              setAText(event.target.value)
            }} />
          </label>
          <label>
            {ui.labels.bCoefficients}
            <input value={bText} onChange={(event) => {
              setPresetId('custom')
              setBText(event.target.value)
            }} />
          </label>
          <p className="input-help">{ui.labels.ascendingPowersHelp}</p>
          <Range label={ui.labels.coefficientK} value={currentK} min={0} max={maxK} step={1} onChange={setK} helpTerm="output-index" onHelp={openTerm} />
        </>
      )}
      playback={<PlaybackControls ui={ui} playing={playing} speed={speed} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onReset={() => setK(0)} onSpeed={setSpeed} />}
      values={[
        { label: 'A(x)', value: polynomialToString(a) },
        { label: 'B(x)', value: polynomialToString(b) },
        { label: 'C(x)', value: polynomialToString(product) },
        { label: 'c[k]', value: formatNumber(currentValue, ui) },
        { label: ui.labels.degreeOfResult, value: String(Math.max(0, product.length - 1)) },
        { label: ui.labels.currentCalculation, value: formatTermCalculation(terms, ui, 'c', currentK, currentValue) },
        { label: 'C(1)=A(1)B(1)', value: formatNumber(evaluatePolynomial(product, 1), ui) },
      ]}
      onExport={() => exportConvolutionCanvas('polynomial')}
    />
  )
}

function ContinuousConvolutionLesson() {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const initial = useMemo(() => decodeContinuousState(readParams()), [])
  const [fId, setFId] = useState<ContinuousPresetId>(coerceContinuousPreset(initial.f))
  const [gId, setGId] = useState<ContinuousPresetId>(coerceContinuousPreset(initial.g))
  const [t, setT] = useState(initial.t)
  const [samples, setSamples] = useState(initial.samples)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const fPreset = continuousPresetOptions.find((preset) => preset.id === fId) ?? continuousPresetOptions[0]
  const gPreset = continuousPresetOptions.find((preset) => preset.id === gId) ?? continuousPresetOptions[0]
  const f = useMemo(() => makeContinuousPresetFunction(fId), [fId])
  const g = useMemo(() => makeContinuousPresetFunction(gId), [gId])
  const currentT = clamp(t, -4, 4)
  const integral = useMemo(() => continuousConvolutionAt(f, g, currentT, -5, 5, Math.round(samples)), [currentT, f, g, samples])
  const product = useMemo(() => productCurveAtShift(f, g, currentT, -5, 5, Math.round(samples)), [currentT, f, g, samples])
  const outputCurve = useMemo(() => continuousConvolutionCurve(f, g, -4, 4, -5, 5, Math.max(48, Math.round(samples / 2))), [f, g, samples])

  useAnimationStep(playing, speed, () => setT((value) => (value >= 4 ? -4 : value + 0.08)))

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawContinuousScene(ctx, viewport, theme, { f, g, t: currentT, product, outputCurve, labels: ui.canvas })
    },
    [currentT, f, g, outputCurve, product, ui.canvas],
  )

  return (
    <LessonFrame
      lessonId="continuous"
      canvas={<GraphCanvas className="graph-canvas convolution-canvas" ariaLabel={ui.canvas.continuousAria} xMin={-5} xMax={5} yMin={-1.5} yMax={2.2} draw={draw} />}
      controls={({ openTerm }) => (
        <>
          <SelectControl label={ui.labels.functionF} value={fId} options={continuousPresetOptions.map((preset) => ({ value: preset.id, textValue: optionLabel(ui, preset.label), label: <Formula tex={preset.tex} label={optionLabel(ui, preset.label)} /> }))} onChange={(next) => setFId(next as ContinuousPresetId)} />
          <SelectControl label={ui.labels.functionG} value={gId} options={continuousPresetOptions.map((preset) => ({ value: preset.id, textValue: optionLabel(ui, preset.label), label: <Formula tex={preset.tex} label={optionLabel(ui, preset.label)} /> }))} onChange={(next) => setGId(next as ContinuousPresetId)} />
          <div className="math-formula-preview" aria-label={ui.selectedFunctions}>
            <span>{ui.selectedFunctions}</span>
            <Formula tex={`f(t)=${fPreset.tex},\\quad g(t)=${gPreset.tex}`} label={`${ui.selectedFunctions}: f=${optionLabel(ui, fPreset.label)}, g=${optionLabel(ui, gPreset.label)}`} />
          </div>
          <Range label={ui.labels.shiftT} value={currentT} min={-4} max={4} step={0.05} onChange={setT} helpTerm="output-index" onHelp={openTerm} />
          <Range label={ui.labels.integrationSamples} value={samples} min={24} max={240} step={4} onChange={setSamples} helpTerm="integration-samples" onHelp={openTerm} />
        </>
      )}
      playback={<PlaybackControls ui={ui} playing={playing} speed={speed} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onReset={() => setT(-4)} onSpeed={setSpeed} />}
      values={[
        { label: ui.labels.currentT, value: formatNumber(currentT, ui) },
        { label: ui.labels.convolutionValue, value: formatNumber(integral, ui) },
        { label: ui.labels.sampleCount, value: String(Math.round(samples)) },
        { label: ui.labels.fPreset, value: optionLabel(ui, fPreset.label) },
        { label: ui.labels.gPreset, value: optionLabel(ui, gPreset.label) },
      ]}
      onExport={() => exportConvolutionCanvas('continuous')}
    />
  )
}

function LessonFrame({
  lessonId,
  operation,
  formula,
  controls,
  canvas,
  playback,
  values,
  onExport,
}: {
  lessonId: ConvolutionLessonId
  operation?: OperationMode
  formula?: FormulaDisplay
  controls: ReactNode | ((helpers: ControlHelpers) => ReactNode)
  canvas: ReactNode
  playback: ReactNode
  values: ValueRow[]
  onExport: () => void
}) {
  const { locale } = usePlatformLocale()
  const ui = convolutionUiCopy[locale]
  const copy = convolutionLessonCopy[locale][lessonId]
  const [helpMode, setHelpMode] = useState<ConvolutionHelpMode | null>(null)
  const helpLabels = getConvolutionHelpLabels(locale)
  const activeHelpTopic = helpMode ? getConvolutionHelpTopic(helpMode, lessonId, locale) : null
  const openTerm = (term: ConvolutionTermId) => setHelpMode({ kind: 'term', term })
  const currentFormula: FormulaDisplay = formula ?? { formula: copy.formula, formulaTex: copy.formulaTex }
  return (
    <>
    <ModuleFocusFrame>
      {({ focusButton }) => (
    <section className="convolution-lesson">
      <aside className="convolution-controls platform-card">
        <div className="calculus-learning-entry learning-help-entry">
          <HelpTrigger onClick={() => setHelpMode({ kind: 'beginner' })} ariaLabel={helpLabels.beginner}>
            {helpLabels.beginner}
          </HelpTrigger>
        </div>
        <h2>{ui.controls}</h2>
        {typeof controls === 'function' ? controls({ openTerm }) : controls}
      </aside>

      <main className="convolution-main">
        <div className="convolution-title-row">
          <div>
            <p className="eyebrow">{ui.moduleEyebrow}</p>
            <h1>{copy.title}</h1>
          </div>
        </div>
        <div className="convolution-stage" data-convolution-export={lessonId}>
          {canvas}
          <LessonStageActions
            graphLabel={helpLabels.graph}
            graphAriaLabel={helpLabels.graph}
            onGraphHelp={() => setHelpMode({ kind: 'graph' })}
            focusButton={focusButton}
            exportLabel={ui.exportPng}
            onExport={onExport}
          />
        </div>
        <div className="convolution-playback platform-card">{playback}</div>
      </main>

      <aside className="convolution-explanation platform-card">
        <h2>{ui.seeing}</h2>
        <p>{renderConvolutionWhat(lessonId, locale, copy.what, openTerm, operation)}</p>
        <h2>{ui.why}</h2>
        <p>{copy.why}</p>
        <h2>{ui.formula}</h2>
        <p className="formula-text formula-card">
          <Formula tex={currentFormula.formulaTex} block label={currentFormula.formula} />
        </p>
        {currentFormula.note && <p className="formula-note">{currentFormula.note}</p>}
        <h2>{ui.values}</h2>
        <dl>
          {values.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <h2>{ui.watch}</h2>
        <p>{copy.watch}</p>
      </aside>
    </section>
      )}
    </ModuleFocusFrame>
    <LearningDrawer topic={activeHelpTopic} closeLabel={helpLabels.close} onClose={() => setHelpMode(null)} />
    </>
  )
}

function renderConvolutionWhat(lessonId: ConvolutionLessonId, locale: Locale, fallback: string, onTerm: (term: ConvolutionTermId) => void, operation?: OperationMode): ReactNode {
  const term = (id: ConvolutionTermId, labelText: string) => (
    <TermButton key={id} onClick={() => onTerm(id)}>
      {labelText}
    </TermButton>
  )

  if (lessonId === 'discrete') {
    if (operation === 'correlation') {
      return locale === 'zh' ? (
        <>
          {term('sequence-a', 'a')} 是固定参考序列，{term('sequence-b', 'b')} 会直接滑过 a；相关模式不会先 {term('flip', '翻转')} b，而是按输出 {term('output-index', '索引 k')} 对齐后，把重叠项 {term('multiply-sum', '相乘再求和')}。
        </>
      ) : (
        <>
          {term('sequence-a', 'a')} is the reference sequence and {term('sequence-b', 'b')} slides directly across it. Correlation does not {term('flip', 'flip')} b first; it aligns b by output {term('output-index', 'index k')}, then {term('multiply-sum', 'multiplies and sums')} the overlapping values.
        </>
      )
    }
    return locale === 'zh' ? (
      <>
        {term('sequence-a', 'a')} 是固定参考序列，{term('sequence-b', 'b')} 是要滑过去的序列；卷积会先把 b {term('flip', '翻转')}，再按输出 {term('output-index', '索引 k')} 对齐，取重叠项 {term('multiply-sum', '相乘再求和')}。
      </>
    ) : (
      <>
        {term('sequence-a', 'a')} is the reference sequence and {term('sequence-b', 'b')} is the sequence that slides across it. Convolution {term('flip', 'flips')} b first, aligns it by output {term('output-index', 'index k')}, then {term('multiply-sum', 'multiplies and sums')} the overlapping values.
      </>
    )
  }

  if (lessonId === 'signal') {
    if (operation === 'correlation') {
      return locale === 'zh' ? (
        <>
          输入信号像一排数据点，{term('kernel', '卷积核')} 像一个小窗口；相关模式让窗口直接滑动，不先翻转。窗口到某个 {term('index', '索引')} 时，会读取附近数据并做加权和。
        </>
      ) : (
        <>
          The signal is a row of samples, and the {term('kernel', 'kernel')} is a small window. In correlation mode, that window slides directly without flipping. At each {term('index', 'index')}, it reads nearby values and makes a weighted sum.
        </>
      )
    }
    return locale === 'zh' ? (
      <>
        输入信号像一排数据点，{term('kernel', '卷积核')} 像一个小窗口；窗口滑到某个 {term('index', '索引')} 时，会读取附近数据并做加权和，所以不同卷积核会产生平滑、锐化或边缘检测。
      </>
    ) : (
      <>
        The signal is a row of samples, and the {term('kernel', 'kernel')} is a small window. At each {term('index', 'index')}, the window reads nearby values and makes a weighted sum, so different kernels smooth, sharpen, or detect changes.
      </>
    )
  }

  if (lessonId === 'image-kernel') {
    if (operation === 'correlation') {
      return locale === 'zh' ? (
        <>
          图像 {term('image-kernel', '卷积核')} 是一个小数字网格。当前是相关模式：卷积核中心对准像素后直接滑过去，把邻近像素按权重相加，得到输出图像里的新颜色。
        </>
      ) : (
        <>
          An image {term('image-kernel', 'kernel')} is a small grid of weights. This is correlation mode: the kernel center sits over each pixel and slides directly, combining nearby pixels into the new output color.
        </>
      )
    }
    return locale === 'zh' ? (
      <>
        图像 {term('image-kernel', '卷积核')} 是一个小数字网格。卷积模式会先把卷积核上下左右翻转，再放到某个像素周围，把邻近像素按权重相加，得到输出图像里的新颜色。
      </>
    ) : (
      <>
        An image {term('image-kernel', 'kernel')} is a small grid of weights. In convolution mode it is flipped both vertically and horizontally before it sits over a pixel neighborhood and combines nearby pixels into the new output color.
      </>
    )
  }

  if (lessonId === 'probability') {
    return locale === 'zh' ? (
      <>
        每个输出柱会收集所有满足同一个和的组合；每个组合贡献 {term('probability-weight', '两个概率的乘积')}。中间热力图显示哪些结果对正在贡献到当前和。
      </>
    ) : (
      <>
        Each output bar collects all pairs with the same sum. Each pair contributes a {term('probability-weight', 'product of two probabilities')}. The middle heatmap shows which outcome pairs contribute to the selected sum.
      </>
    )
  }

  if (lessonId === 'polynomial') {
    return locale === 'zh' ? (
      <>
        多项式的系数也能看成序列。输出 {term('output-index', '索引 k')} 对应 {formula('x^k')} 的系数，它收集所有次数相加等于 k 的乘积项。
      </>
    ) : (
      <>
        Polynomial coefficients can be read as sequences. Output {term('output-index', 'index k')} is the coefficient of {formula('x^k')}; it collects every product whose powers add to k.
      </>
    )
  }

  if (lessonId === 'continuous') {
    return locale === 'zh' ? (
      <>
        连续卷积把一个函数 {term('flip', '翻转')} 后平移；每个平移位置都计算两个函数 {term('overlap', '重叠')} 的乘积面积，也就是一个 {term('continuous-integral', '积分')}。
      </>
    ) : (
      <>
        Continuous convolution {term('flip', 'flips')} one function and shifts it. At each shift, it measures the product area where the functions {term('overlap', 'overlap')}, which is an {term('continuous-integral', 'integral')}.
      </>
    )
  }

  return fallback
}

function getConvolutionHelpLabels(locale: Locale): { beginner: string; graph: string; close: string } {
  return locale === 'zh'
    ? { beginner: '新手解释', graph: '怎么看图', close: '关闭解释' }
    : { beginner: 'Beginner explanation', graph: 'Read the graph', close: 'Close explanation' }
}

function getConvolutionHelpTopic(mode: ConvolutionHelpMode, lessonId: ConvolutionLessonId, locale: Locale): HelpTopic {
  if (mode.kind === 'term') return convolutionTermTopic(mode.term, locale)
  if (mode.kind === 'graph') return convolutionGraphTopic(lessonId, locale)
  return convolutionBeginnerTopic(lessonId, locale)
}

function convolutionBeginnerTopic(lessonId: ConvolutionLessonId, locale: Locale): HelpTopic {
  if (lessonId === 'discrete') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '离散卷积到底在做什么',
          summary: '卷积可以先记成五个动作：翻转、平移、找重叠、逐项相乘、把乘积加起来。',
          sections: [
            {
              title: 'a 和 b 分别是什么',
              body: (
                <>
                  {formula('a[i]')} 和 {formula('b[j]')} 都是一排数字。a 通常当作输入或参考序列，b 常常当作卷积核，也就是拿来测量、平滑、加权或匹配 a 的小模板。
                </>
              ),
            },
            {
              title: '索引是什么',
              body: (
                <>
                  索引就是数字在序列里的位置。{formula('a[0]')} 是 a 的第 0 个数，{formula('a[1]')} 是下一个。输出 {formula('y[k]')} 的 k 表示“当前算的是输出序列里的第几个位置”。
                </>
              ),
            },
            {
              title: '为什么要翻转 b',
              body: (
                <>
                  公式 {formula('y[k]=\\sum_i a[i]b[k-i]')} 里，当 i 往右走时，{formula('k-i')} 会往左走，所以 b 的读取方向是反的。把 b 先翻转再滑动，就是把这个公式画出来。
                </>
              ),
            },
            {
              title: '怎么探索',
              items: ['先选“非对称卷积核”，看卷积和相关的结果不同。', '再选“对称卷积核”，看翻转前后没有区别。', '移动 k，观察中间“重叠乘积”如何变成下方的一个输出柱。'],
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'What discrete convolution is doing',
          summary: 'Convolution is five moves: flip, shift, overlap, multiply, and sum.',
          sections: [
            {
              title: 'What a and b mean',
              body: (
                <>
                  {formula('a[i]')} and {formula('b[j]')} are two sequences of numbers. a is usually the input or reference sequence; b is often the kernel, a small template used to measure, smooth, weight, or match a.
                </>
              ),
            },
            {
              title: 'What index means',
              body: (
                <>
                  An index is a position in a sequence. {formula('a[0]')} is the first value of a, {formula('a[1]')} is the next. The k in {formula('y[k]')} means “which output position are we computing?”
                </>
              ),
            },
            {
              title: 'Why b is flipped',
              body: (
                <>
                  In {formula('y[k]=\\sum_i a[i]b[k-i]')}, as i moves right, {formula('k-i')} moves left, so b is read in the opposite direction. Flipping b before sliding is the visual version of that formula.
                </>
              ),
            },
            {
              title: 'How to explore',
              items: ['Choose an asymmetric kernel and compare convolution with correlation.', 'Choose a symmetric kernel and notice that flipping changes nothing.', 'Move k and watch the overlap products become one output bar.'],
            },
          ],
        }
  }

  if (lessonId === 'image-kernel') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '图像卷积核是什么',
          summary: '图像卷积核是一个小矩阵，用来告诉每个像素应该怎样参考周围像素。',
          sections: [
            { title: '一个像素怎么变成新像素', body: '把卷积核放在一个像素周围，每个格子的数字乘以对应邻居像素的颜色，最后相加，就得到输出图像里的新像素。' },
            { title: '常见效果', items: ['平均型卷积核会模糊，因为它把周围颜色混在一起。', '锐化卷积核会强调中心像素和邻居的差别。', '边缘检测卷积核会让变化剧烈的位置变亮。'] },
            { title: '边界模式', body: '图像边缘没有完整邻居，所以需要决定缺失部分怎么处理：补零、钳制到边缘，或从另一边环绕。' },
            { title: '怎么探索', items: ['选择 emboss 或 Sobel X 这类非对称卷积核。', '在卷积和相关之间切换。', '看“实际使用的卷积核”是否翻转，以及输出图像如何变化。'] },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'What an image kernel is',
          summary: 'An image kernel is a small matrix that tells each pixel how to combine nearby pixels.',
          sections: [
            { title: 'How one pixel becomes a new pixel', body: 'Place the kernel over a pixel neighborhood, multiply each kernel weight by the matching neighbor color, then sum the results.' },
            { title: 'Common effects', items: ['Averaging kernels blur by mixing nearby colors.', 'Sharpening kernels emphasize the center pixel against its neighbors.', 'Edge kernels brighten places where the image changes abruptly.'] },
            { title: 'Boundary modes', body: 'At image edges, some neighbors are missing, so the app must decide whether to use zeros, clamp to the edge, or wrap around.' },
            { title: 'How to explore', items: ['Choose an asymmetric kernel such as emboss or Sobel X.', 'Switch between convolution and correlation.', 'Watch the applied kernel flip and compare the output image.'] },
          ],
        }
  }

  if (lessonId === 'signal') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '卷积为什么能做信号滤波',
          summary: '卷积核是一个小的加权窗口。窗口怎么加权，就决定保留或削弱信号里的什么特征。',
          sections: [
            { title: '平滑', body: '移动平均或高斯卷积核会把附近点混合起来，所以随机噪声会被压低，但尖锐变化也可能变钝。' },
            { title: '检测变化', body: '差分或边缘卷积核会比较相邻点，所以信号突然跳变的位置会变得明显。' },
            { title: '怎么探索', items: ['选择 noisy sine，再选择 moving average 或 gaussian。', '拖动卷积核位置，看紫色权重怎样贴到输入信号上。', '切到 difference，看跳变处如何被放大。'] },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'Why convolution filters signals',
          summary: 'A kernel is a small weighted window. Its weights decide which features are kept or reduced.',
          sections: [
            { title: 'Smoothing', body: 'Moving-average or Gaussian kernels mix nearby samples, reducing random noise but also softening sharp changes.' },
            { title: 'Detecting change', body: 'Difference or edge kernels compare neighboring samples, making sudden changes stand out.' },
            { title: 'How to explore', items: ['Choose noisy sine, then use moving average or Gaussian.', 'Drag kernel position and watch the purple weights sit on the input signal.', 'Switch to difference and notice how jumps become larger.'] },
          ],
        }
  }

  if (lessonId === 'probability') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '为什么概率相加会用卷积',
          summary: '两个独立随机变量相加时，每个可能的和都会收集所有能产生它的组合，并把这些组合的概率加起来。',
          sections: [
            { title: '为什么 7 比 2 更常见', body: '两个公平骰子掷出 7 的组合有 1+6、2+5、3+4、4+3、5+2、6+1；掷出 2 只有 1+1。组合越多，总概率通常越大。' },
            { title: '偏置时怎么算', body: <>{formula('x+y=s')} 的每个组合不是同样重要。组合 {formula('(x,y)')} 的贡献是 {formula('P_X(x)P_Y(y)')}。把所有贡献加起来，就是 {formula('P(S=s)')}。</> },
            { title: '怎么探索', items: ['先看公平 d6 + 公平 d6，观察 7 的组合最多。', '再看偏置硬币，注意每个组合下面的概率贡献不同。', '拖动和 s，看当前计算如何把多个概率乘积加起来。'] },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'Why probability sums use convolution',
          summary: 'When two independent random variables are added, each possible sum collects every pair that can make it, then adds the pair probabilities.',
          sections: [
            { title: 'Why 7 beats 2 for dice', body: 'Two fair dice can make 7 as 1+6, 2+5, 3+4, 4+3, 5+2, and 6+1. They can make 2 only as 1+1. More contributing pairs usually means more probability.' },
            { title: 'How biased pairs count', body: <>Pairs are not always equally important. A pair {formula('(x,y)')} with {formula('x+y=s')} contributes {formula('P_X(x)P_Y(y)')}. Adding all such contributions gives {formula('P(S=s)')}.</> },
            { title: 'How to explore', items: ['Start with fair d6 + fair d6 and watch the center sums collect more pairs.', 'Switch to biased coins and notice that pair contributions have different sizes.', 'Drag sum s and read the current probability product calculation.'] },
          ],
        }
  }

  if (lessonId === 'polynomial') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '多项式乘法为什么像卷积',
          summary: '每个系数可以看成序列里的一个数。相乘时，次数相加后相同的项会被收集到同一个输出系数。',
          sections: [
            { title: '系数怎么读', body: '升幂排列 [1, 2, 3] 表示 1 + 2x + 3x^2。第 0 个数是常数项，第 1 个数是 x 的系数。' },
            { title: '同一个 k 收集什么', body: <>{formula('c[k]')} 收集所有满足 {formula('i+j=k')} 的乘积 {formula('a_i b_j')}。这和离散卷积的“同一个输出位置收集多项乘积”是同一种结构。</> },
            { title: '怎么探索', items: ['选择 (1+x)(1+x)，看 x 的系数为什么是 2。', '拖动 k，看网格中哪条对角线被选中。', '选择 asymmetric polynomials，观察负系数和不同长度如何进入同一个 c[k]。'] },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'Why polynomial multiplication looks like convolution',
          summary: 'Coefficients can be read as a sequence. During multiplication, products with the same final power are collected into the same output coefficient.',
          sections: [
            { title: 'How coefficients are read', body: 'Ascending powers [1, 2, 3] means 1 + 2x + 3x^2. The 0th number is the constant term; the 1st number is the coefficient of x.' },
            { title: 'What one k collects', body: <>{formula('c[k]')} collects every product {formula('a_i b_j')} where {formula('i+j=k')}. This is the same structure as discrete convolution collecting products into one output position.</> },
            { title: 'How to explore', items: ['Choose (1+x)(1+x) and see why the coefficient of x is 2.', 'Drag k and watch which diagonal of the grid is selected.', 'Try asymmetric polynomials and see how negative coefficients and unequal lengths enter one c[k].'] },
          ],
        }
  }

  if (lessonId === 'continuous') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '连续卷积在做什么',
          summary: '离散卷积是一格一格相乘再相加。连续卷积做同一类事，只是格子变成曲线：每一点相乘，再把乘积下面的面积加起来。',
          sections: [
            { title: 'τ 和 t 的角色', body: <>{formula('\\tau')} 是沿着横轴扫过的变量。{formula('t')} 是当前平移量；你拖动 t，就是移动紫色函数，重新测量重叠面积。</> },
            { title: '为什么是积分', body: '离散版把有限个乘积加起来；连续版有无穷多个点，所以用积分来表示“把整段面积加起来”。' },
            { title: '怎么探索', items: ['选择 rectangle 和 gaussian。', '拖动 t，观察重叠面积最大时，上方输出曲线也接近最大。', '增加积分采样数，看曲线近似是否更平滑。'] },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'What continuous convolution is doing',
          summary: 'Discrete convolution multiplies entries and adds them. Continuous convolution does the same kind of thing with curves: multiply values point by point, then add the product area.',
          sections: [
            { title: 'What tau and t do', body: <>{formula('\\tau')} is the variable sweeping along the horizontal axis. {formula('t')} is the current shift; dragging t moves the purple function and recomputes the overlap area.</> },
            { title: 'Why it uses an integral', body: 'The discrete version adds finitely many products. The continuous version has infinitely many points, so an integral represents adding the whole area.' },
            { title: 'How to explore', items: ['Choose rectangle and Gaussian.', 'Drag t and watch the output curve peak near the strongest overlap.', 'Increase integration samples and see the numerical approximation become smoother.'] },
          ],
        }
  }

  if (lessonId === 'probability') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '概率和图像读法',
          summary: '从上到下读：上方是 X 和 Y 的原始分布，中间是当前和的组合，下方是 X+Y 的分布。',
          sections: [
            { title: '上方分布', body: '青色柱是 X 的概率，紫色柱是 Y 的概率。柱越高，那个结果越可能出现。' },
            { title: '中间热力图', body: '亮起来的格子满足 x+y=s。亮度会受到 P_X(x)P_Y(y) 的影响，所以偏置分布里不同组合贡献不同。' },
            { title: '下方输出', body: '黄色分布是和 S=X+Y。高亮柱就是当前选中的 P(S=s)。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read probability sums',
          summary: 'Read top to bottom: original distributions for X and Y, pairs for the current sum, then the distribution of X+Y.',
          sections: [
            { title: 'Source distributions', body: 'Teal bars show probabilities for X; purple bars show probabilities for Y. Taller bars are more likely outcomes.' },
            { title: 'Pair heatmap', body: 'Highlighted cells satisfy x+y=s. Brightness reflects P_X(x)P_Y(y), so biased distributions give different pair weights.' },
            { title: 'Output distribution', body: 'The yellow distribution is S=X+Y. The highlighted bar is the currently selected P(S=s).' },
          ],
        }
  }

  if (lessonId === 'polynomial') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '多项式乘法图像读法',
          summary: '上方网格显示每一项乘每一项；下方柱状图显示乘积多项式的系数。',
          sections: [
            { title: '乘法网格', body: '第 i 行来自 A 的 x^i 项，第 j 列来自 B 的 x^j 项。格子里的数字是这两个系数的乘积。' },
            { title: '高亮对角线', body: '被高亮的格子满足 i+j=k，所以它们都会被加进 c[k]。' },
            { title: '输出系数', body: '下方黄色柱是 C(x) 的系数。高亮柱就是当前 c[k]。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read polynomial multiplication',
          summary: 'The grid shows every term times every term; the lower bars show the coefficients of the product polynomial.',
          sections: [
            { title: 'Multiplication grid', body: 'Row i comes from the x^i term of A; column j comes from the x^j term of B. The cell value is the product of those two coefficients.' },
            { title: 'Highlighted diagonal', body: 'Highlighted cells satisfy i+j=k, so they all add into c[k].' },
            { title: 'Output coefficients', body: 'The yellow bars are coefficients of C(x). The highlighted bar is the current c[k].' },
          ],
        }
  }

  if (lessonId === 'continuous') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '连续卷积图像读法',
          summary: '青色曲线是 f(τ)，紫色曲线是翻转并平移后的 g(t−τ)，浅色阴影是两者相乘后的面积，上方曲线是输出。',
          sections: [
            { title: '输入曲线', body: '青色 f(τ) 固定不动。紫色 g(t−τ) 会随 t 移动；它已经包含卷积里的翻转和平移。' },
            { title: '乘积面积', body: '黄色曲线和浅色阴影表示 f(τ)g(t−τ)。当前输出值就是这块带符号面积的积分。' },
            { title: '上方输出', body: '上方蓝色曲线是每个 t 对应的卷积输出。它向上挪了一点，只是为了和下方曲线分开看清楚。虚线表示当前 t。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read continuous convolution',
          summary: 'Teal is f(tau), purple is flipped-and-shifted g(t-tau), the pale fill is product area, and the upper curve is the output.',
          sections: [
            { title: 'Input curves', body: 'Teal f(tau) stays fixed. Purple g(t-tau) moves with t and already includes the convolution flip and shift.' },
            { title: 'Product area', body: 'The yellow curve and pale fill show f(tau)g(t-tau). The current output value is the integral of this signed area.' },
            { title: 'Upper output', body: 'The upper blue curve is the convolution output for every t. It is shifted upward only so it is easier to see. The dashed line marks the current t.' },
          ],
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '从零开始',
        title: '卷积的共同模式',
        summary: '不管对象是概率、信号、图像、多项式还是函数，卷积都在做同一件事：滑动一个对象，计算重叠有多强。',
        sections: [
          { title: '核心动作', items: ['把一个对象移动到某个位置。', '找出它和另一个对象重叠的部分。', '把重叠位置逐项相乘。', '把乘积加起来，得到当前位置的输出。'] },
          { title: '为什么有用', body: '它把“局部关系”变成一整排输出：哪里重叠强，输出就大；哪里重叠弱，输出就小。' },
        ],
      }
    : {
        eyebrow: 'Start from zero',
        title: 'The shared convolution pattern',
        summary: 'Whether the objects are probabilities, signals, images, polynomials, or functions, convolution slides one object and measures overlap strength.',
        sections: [
          { title: 'Core moves', items: ['Move one object to a position.', 'Find the part that overlaps the other object.', 'Multiply matching overlapping parts.', 'Sum the products to get the output at that position.'] },
          { title: 'Why it helps', body: 'It turns local matching into a whole output: strong overlap gives a large output; weak overlap gives a small output.' },
        ],
      }
}

function convolutionGraphTopic(lessonId: ConvolutionLessonId, locale: Locale): HelpTopic {
  if (lessonId === 'discrete') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '离散卷积图像读法',
          summary: '从上到下读：上方看 a 和 b 的相对位置，中间看当前重叠项的乘积，下方看输出序列 y。',
          sections: [
            { title: '上方', body: '青色柱是 a，紫色柱是 b。当前重叠项会变亮，但不会改变 a / b 的颜色。卷积模式下，紫色 b 已经先被翻转，再随着 k 平移。' },
            { title: '中间', body: '这里只显示当前 k 下真正重叠的项。每根柱代表一对 a[i] 和 b[k-i] 的乘积。' },
            { title: '下方', body: '黄色输出 y 的高亮柱就是当前 y[k]。它等于中间所有重叠乘积相加。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read discrete convolution',
          summary: 'Read top to bottom: relative positions of a and b, current overlap products, then output y.',
          sections: [
            { title: 'Top', body: 'Teal bars are a and purple bars are b. Current overlaps become brighter, but a and b keep their colors. In convolution mode, b is flipped before it slides with k.' },
            { title: 'Middle', body: 'This band shows only the values that overlap for the current k. Each bar is one product a[i] times b[k-i].' },
            { title: 'Bottom', body: 'The highlighted yellow output bar is y[k]. It equals the sum of the middle overlap products.' },
          ],
        }
  }

  if (lessonId === 'image-kernel') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '图像卷积核读法',
          summary: '左边是输入图，右边是应用卷积核后的输出图。点击像素可以看同一个位置如何被改写。',
          sections: [
            { title: '输入图', body: '这是被处理的原图。选中的小圆点表示当前检查的像素位置。' },
            { title: '输出图', body: '这是每个像素用邻域加权和重新计算后的结果。模糊、锐化和边缘检测都是不同权重造成的。' },
            { title: '卷积核网格', body: '控制面板里的数字网格就是权重。中心附近的数字越大，中心像素对结果影响越大；周围数字越大，邻居影响越大。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read the image kernel view',
          summary: 'The left image is input; the right image is the output after applying the kernel. Click a pixel to inspect the matching location.',
          sections: [
            { title: 'Input image', body: 'This is the original image. The marker shows the pixel currently being inspected.' },
            { title: 'Output image', body: 'Each output pixel is recomputed from a weighted neighborhood. Blur, sharpen, and edge detection come from different weights.' },
            { title: 'Kernel grid', body: 'The grid in the controls is the set of weights. Larger center weights preserve the center; larger surrounding weights increase neighbor influence.' },
          ],
        }
  }

  if (lessonId === 'signal') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '信号滤波图像读法',
          summary: '上方是输入信号，中间是当前卷积核，下方是滤波后的输出。',
          sections: [
            { title: '窗口框', body: '虚线框表示当前卷积核覆盖的输入范围。移动卷积核位置时，框会沿信号滑动。' },
            { title: '输出', body: '下方高亮点是当前索引的输出值，来自窗口内输入值和卷积核权重的加权和。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read signal filtering',
          summary: 'The top is the input signal, the middle is the current kernel, and the bottom is the filtered output.',
          sections: [
            { title: 'Window', body: 'The dashed box marks which input samples the kernel covers. Moving the kernel position slides this window.' },
            { title: 'Output', body: 'The highlighted point below is the output at the current index, made from the weighted sum inside the window.' },
          ],
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '怎么看图',
        title: '卷积图像读法',
        summary: '先看输入对象，再看当前重叠或组合，最后看输出。',
        sections: [
          { title: '输入', body: '图中青色和紫色通常表示两个被组合的对象。' },
          { title: '中间关系', body: '中间区域显示当前平移位置下哪些部分正在相互作用。' },
          { title: '输出', body: '输出图或输出柱表示把当前相互作用求和后的结果。' },
        ],
      }
    : {
        eyebrow: 'Read the graph',
        title: 'How to read convolution views',
        summary: 'Read the inputs first, then the current overlap or pairing, then the output.',
        sections: [
          { title: 'Inputs', body: 'Teal and purple usually represent the two objects being combined.' },
          { title: 'Middle relation', body: 'The middle area shows which parts interact at the current shift.' },
          { title: 'Output', body: 'The output graph or bars show the summed result of that current interaction.' },
        ],
      }
}

function convolutionTermTopic(term: ConvolutionTermId, locale: Locale): HelpTopic {
  const zh: Record<ConvolutionTermId, HelpTopic> = {
    'sequence-a': {
      eyebrow: '术语',
      title: 'a 是什么',
      summary: 'a 是第一个离散序列，也就是一排按位置排列的数字。',
      sections: [{ title: '在离散卷积里', body: '你可以把 a 当成输入信号或参考对象。b 会沿着它移动，检查每个位置的重叠情况。' }],
    },
    'sequence-b': {
      eyebrow: '术语',
      title: 'b 是什么',
      summary: 'b 是第二个序列，很多场景下也叫卷积核。',
      sections: [{ title: '在图里', body: 'b 是紫色柱。卷积会先翻转 b，再让它沿 a 滑动；相关则不翻转。' }],
    },
    index: {
      eyebrow: '术语',
      title: '索引',
      summary: '索引就是元素在序列里的位置。',
      sections: [{ title: '例子', body: 'a[0] 是 a 的第 0 个元素，a[3] 是第 3 个元素。索引让公式能精确说出正在取哪个数。' }],
    },
    'output-index': {
      eyebrow: '术语',
      title: '输出索引 k',
      summary: 'k 表示当前正在计算输出序列 y 的哪个位置。',
      sections: [{ title: '直觉', body: '当 k 改变时，b 相对 a 的位置也改变；每个 k 都会得到一个新的 y[k]。' }],
    },
    flip: {
      eyebrow: '术语',
      title: '翻转',
      summary: '翻转就是把 b 的顺序倒过来。',
      sections: [{ title: '为什么卷积要翻转', body: '因为公式里是 b[k-i]。当 i 增加时，k-i 反而减小，所以 b 被反向读取。先翻转再滑动，正好画出了这个反向读取。' }],
    },
    kernel: {
      eyebrow: '术语',
      title: '卷积核（kernel）',
      summary: '卷积核是一个小模板或小窗口，用来决定附近数值怎样被加权。',
      sections: [{ title: '例子', body: '平滑卷积核会平均邻近值；差分卷积核会比较相邻值；图像卷积核会把周围像素按权重混合。' }],
    },
    overlap: {
      eyebrow: '术语',
      title: '重叠',
      summary: '重叠是两个对象在当前平移位置同时覆盖到的部分。',
      sections: [{ title: '为什么重要', body: '只有重叠到的项会相乘并参与当前输出。没有重叠时，贡献就是 0。' }],
    },
    'multiply-sum': {
      eyebrow: '术语',
      title: '相乘再求和',
      summary: '把重叠位置一对一相乘，再把这些乘积加起来。',
      sections: [{ title: '公式', body: <>{formula('y[k]=\\sum_i a[i]b[k-i]')} 里的求和符号就是“把所有重叠乘积加起来”。</> }],
    },
    correlation: {
      eyebrow: '术语',
      title: '相关',
      summary: '相关和卷积很像，但不会先翻转卷积核。',
      sections: [{ title: '怎么比较', body: '如果卷积核对称，卷积和相关结果相同；如果卷积核不对称，两者通常不同。' }],
    },
    boundary: {
      eyebrow: '术语',
      title: '边界模式',
      summary: '边界模式决定窗口滑到边缘时，缺失的邻居怎么处理。',
      sections: [{ title: '常见选择', body: '补零把外面当 0；钳制复制边缘值；环绕会从另一侧取值。' }],
    },
    'image-kernel': {
      eyebrow: '术语',
      title: '图像卷积核',
      summary: '图像卷积核是一个二维权重网格，在图像处理教材里也常叫卷积模板。',
      sections: [{ title: '作用', body: '它会覆盖像素周围的小邻域，把每个邻居像素乘以对应权重，然后相加得到新像素。' }],
    },
    'continuous-integral': {
      eyebrow: '术语',
      title: '积分',
      summary: '积分可以理解为连续版本的求和。',
      sections: [{ title: '在连续卷积里', body: '离散卷积把一堆乘积加起来；连续卷积把整段重叠区域的乘积面积加起来。' }],
    },
    mode: {
      eyebrow: '术语',
      title: 'full / same / valid',
      summary: 'mode 决定保留哪些滑动位置的输出。',
      sections: [{ title: '三种选择', body: 'full 显示所有滑动位置，包括只有一点点重叠的位置；same 只保留和原输入长度一样的输出；valid 只保留卷积核完全覆盖输入的位置。' }],
    },
    sigma: {
      eyebrow: '术语',
      title: 'sigma',
      summary: 'sigma 控制高斯卷积核的宽度。',
      sections: [{ title: '直觉', body: 'sigma 越大，平滑范围越宽；sigma 越小，卷积核只看更近的邻居。' }],
    },
    noise: {
      eyebrow: '术语',
      title: '噪声幅度',
      summary: '噪声幅度控制随机抖动有多强。',
      sections: [{ title: '直觉', body: '数值越大，输入信号的小抖动越明显；平滑卷积核的作用也越容易看出来。' }],
    },
    seed: {
      eyebrow: '术语',
      title: '随机种子',
      summary: 'seed 控制随机模式。',
      sections: [{ title: '为什么有它', body: '同一个 seed 会生成同一组噪声，方便你重复观察同一个例子。' }],
    },
    'normalize-kernel': {
      eyebrow: '术语',
      title: '归一化卷积核',
      summary: '如果权重总和不是 0，把权重缩放到总和为 1。',
      sections: [{ title: '为什么常用', body: '模糊或平均时，归一化能帮助保持整体亮度或平均值。边缘检测这种总和为 0 的卷积核不会被强行归一化。' }],
    },
    'preserve-alpha': {
      eyebrow: '术语',
      title: '保留 alpha',
      summary: 'alpha 是像素的透明度。',
      sections: [{ title: '打开时', body: '输出图像沿用原图透明度，只改变颜色通道。关闭时，透明度也会参与卷积核计算。' }],
    },
    grayscale: {
      eyebrow: '术语',
      title: '先转灰度',
      summary: '先把颜色转成灰度，再应用卷积核。',
      sections: [{ title: '什么时候有用', body: '边缘检测时，先转灰度可以让你更专注于明暗变化，而不是颜色差异。' }],
    },
    'integration-samples': {
      eyebrow: '术语',
      title: '积分采样数',
      summary: '用多少小片段近似连续积分。',
      sections: [{ title: '权衡', body: '采样越多，曲线和面积近似越细；计算也会更重。' }],
    },
    expectation: {
      eyebrow: '术语',
      title: 'E[X]',
      summary: 'E[X] 是随机变量 X 的平均值或期望值。',
      sections: [{ title: '在和里面', body: '独立随机变量相加时，E[X+Y] = E[X] + E[Y]。' }],
    },
    variance: {
      eyebrow: '术语',
      title: 'Var(X + Y)',
      summary: '方差描述分布分散得有多开。',
      sections: [{ title: '在和里面', body: '独立随机变量相加时，方差也会相加；这解释了多次随机相加后分布会变宽。' }],
    },
    'probability-weight': {
      eyebrow: '术语',
      title: '概率贡献',
      summary: '一个结果对的贡献是两个独立概率的乘积。',
      sections: [{ title: '公式', body: <>{formula('x+y=s')} 时，这一对贡献 {formula('P_X(x)P_Y(y)')}。把所有满足同一个和的贡献加起来，就得到 {formula('P(S=s)')}。</> }],
    },
    'coefficient-sum': {
      eyebrow: '术语',
      title: 'C(1)=A(1)B(1)',
      summary: '把 x=1 代入多项式时，得到的是所有系数的总和。',
      sections: [{ title: '为什么成立', body: '乘积多项式的系数总和，等于两边系数总和的乘积。所以 C(1) 可以快速检查乘法结果是否合理。' }],
    },
  }

  const en: Record<ConvolutionTermId, HelpTopic> = {
    'sequence-a': {
      eyebrow: 'Term',
      title: 'a',
      summary: 'a is the first discrete sequence: a row of numbers arranged by position.',
      sections: [{ title: 'In discrete convolution', body: 'Think of a as the input or reference object. b moves across it so the app can measure overlap at each position.' }],
    },
    'sequence-b': {
      eyebrow: 'Term',
      title: 'b',
      summary: 'b is the second sequence, often called the kernel.',
      sections: [{ title: 'On the graph', body: 'b is the purple sequence. Convolution flips b before sliding; correlation slides it directly.' }],
    },
    index: {
      eyebrow: 'Term',
      title: 'Index',
      summary: 'An index is the position of an element in a sequence.',
      sections: [{ title: 'Example', body: 'a[0] is the first element of a, and a[3] is the element at position 3. Indexes let formulas name exact values.' }],
    },
    'output-index': {
      eyebrow: 'Term',
      title: 'Output index k',
      summary: 'k tells you which position of the output sequence y is being computed.',
      sections: [{ title: 'Intuition', body: 'Changing k changes where b sits relative to a. Each k produces a different y[k].' }],
    },
    flip: {
      eyebrow: 'Term',
      title: 'Flip',
      summary: 'Flipping reverses the order of b.',
      sections: [{ title: 'Why convolution flips', body: 'The formula uses b[k-i]. As i increases, k-i decreases, so b is read backward. Flipping before sliding visualizes that backward read.' }],
    },
    kernel: {
      eyebrow: 'Term',
      title: 'Kernel',
      summary: 'A kernel is a small template or window that decides how nearby values are weighted.',
      sections: [{ title: 'Examples', body: 'A smoothing kernel averages nearby values; a difference kernel compares neighbors; an image kernel mixes nearby pixels by weights.' }],
    },
    overlap: {
      eyebrow: 'Term',
      title: 'Overlap',
      summary: 'Overlap is the part where two objects cover the same positions at the current shift.',
      sections: [{ title: 'Why it matters', body: 'Only overlapping items multiply and contribute to the current output. No overlap means zero contribution.' }],
    },
    'multiply-sum': {
      eyebrow: 'Term',
      title: 'Multiply and sum',
      summary: 'Multiply matching overlapping positions, then add those products.',
      sections: [{ title: 'Formula', body: <>The summation in {formula('y[k]=\\sum_i a[i]b[k-i]')} means “add all overlap products.”</> }],
    },
    correlation: {
      eyebrow: 'Term',
      title: 'Correlation',
      summary: 'Correlation is like convolution, but it does not flip the kernel first.',
      sections: [{ title: 'How to compare', body: 'For symmetric kernels, convolution and correlation match. For asymmetric kernels, they usually differ.' }],
    },
    boundary: {
      eyebrow: 'Term',
      title: 'Boundary mode',
      summary: 'Boundary mode decides what happens when a window reaches the edge and some neighbors are missing.',
      sections: [{ title: 'Common choices', body: 'Zero treats outside values as 0; clamp repeats edge values; wrap reads from the opposite side.' }],
    },
    'image-kernel': {
      eyebrow: 'Term',
      title: 'Image kernel',
      summary: 'An image kernel is a 2D grid of weights.',
      sections: [{ title: 'What it does', body: 'It covers a small pixel neighborhood, multiplies each neighbor by the matching weight, then sums the result into a new pixel.' }],
    },
    'continuous-integral': {
      eyebrow: 'Term',
      title: 'Integral',
      summary: 'An integral is a continuous version of summing.',
      sections: [{ title: 'In continuous convolution', body: 'Discrete convolution adds a list of products. Continuous convolution adds the product area across a whole overlap region.' }],
    },
    mode: {
      eyebrow: 'Term',
      title: 'full / same / valid',
      summary: 'Mode decides which sliding positions are kept in the output.',
      sections: [{ title: 'Three choices', body: 'full keeps every slide position, including tiny overlaps; same keeps an output the same length as the input; valid keeps only positions where the kernel fully covers the input.' }],
    },
    sigma: {
      eyebrow: 'Term',
      title: 'Sigma',
      summary: 'Sigma controls the width of a Gaussian kernel.',
      sections: [{ title: 'Intuition', body: 'Larger sigma spreads smoothing across a wider neighborhood; smaller sigma focuses on closer neighbors.' }],
    },
    noise: {
      eyebrow: 'Term',
      title: 'Noise amplitude',
      summary: 'Noise amplitude controls how strong the random jitter is.',
      sections: [{ title: 'Intuition', body: 'Larger values make the input signal wobble more, making smoothing kernels easier to compare.' }],
    },
    seed: {
      eyebrow: 'Term',
      title: 'Seed',
      summary: 'The seed controls the random pattern.',
      sections: [{ title: 'Why it exists', body: 'The same seed creates the same noise again, so you can repeat and compare one example.' }],
    },
    'normalize-kernel': {
      eyebrow: 'Term',
      title: 'Normalize kernel',
      summary: 'If the weight sum is not 0, normalize rescales weights so they sum to 1.',
      sections: [{ title: 'Why it is common', body: 'For blur or averaging, normalization helps preserve overall brightness or average value. Zero-sum edge kernels are not forced to normalize.' }],
    },
    'preserve-alpha': {
      eyebrow: 'Term',
      title: 'Preserve alpha',
      summary: 'Alpha is pixel transparency.',
      sections: [{ title: 'When enabled', body: 'The output image keeps the original transparency and only changes color channels. When disabled, transparency also goes through the kernel calculation.' }],
    },
    grayscale: {
      eyebrow: 'Term',
      title: 'Grayscale before apply',
      summary: 'Convert the image to grayscale before applying the kernel.',
      sections: [{ title: 'When useful', body: 'For edge detection, grayscale lets you focus on light/dark changes instead of color differences.' }],
    },
    'integration-samples': {
      eyebrow: 'Term',
      title: 'Integration samples',
      summary: 'The number of small pieces used to approximate the continuous integral.',
      sections: [{ title: 'Tradeoff', body: 'More samples make the curve and area approximation finer, but require more computation.' }],
    },
    expectation: {
      eyebrow: 'Term',
      title: 'E[X]',
      summary: 'E[X] is the average or expected value of random variable X.',
      sections: [{ title: 'For sums', body: 'For independent random variables, E[X+Y] = E[X] + E[Y].' }],
    },
    variance: {
      eyebrow: 'Term',
      title: 'Var(X + Y)',
      summary: 'Variance describes how spread out a distribution is.',
      sections: [{ title: 'For sums', body: 'For independent random variables, variances add too; this explains why repeated random sums spread out.' }],
    },
    'probability-weight': {
      eyebrow: 'Term',
      title: 'Probability contribution',
      summary: 'One outcome pair contributes the product of two independent probabilities.',
      sections: [{ title: 'Formula', body: <>When {formula('x+y=s')}, that pair contributes {formula('P_X(x)P_Y(y)')}. Adding all contributions for the same sum gives {formula('P(S=s)')}.</> }],
    },
    'coefficient-sum': {
      eyebrow: 'Term',
      title: 'C(1)=A(1)B(1)',
      summary: 'Plugging in x=1 gives the sum of all coefficients.',
      sections: [{ title: 'Why it works', body: 'The coefficient sum of the product equals the product of the two input coefficient sums, so C(1) is a quick sanity check for multiplication.' }],
    },
  }

  return locale === 'zh' ? zh[term] : en[term]
}

function formula(tex: string) {
  return <Formula tex={tex} />
}

function PlaybackControls({
  ui,
  playing,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeed,
}: {
  ui: ConvolutionUiCopy
  playing: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeed: (speed: number) => void
}) {
  return (
    <>
      <div className="transport-buttons">
        <button type="button" className="primary-button" aria-label={playing ? ui.pause : ui.play} onClick={playing ? onPause : onPlay}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? ui.pause : ui.play}
        </button>
        <button type="button" onClick={onReset}>
          <RotateCcw size={16} />
          {ui.reset}
        </button>
      </div>
      <Range label={ui.speed} value={speed} min={0.25} max={4} step={0.05} valueSuffix="x" onChange={onSpeed} />
    </>
  )
}

function SelectControl({
  label,
  value,
  options,
  onChange,
  helpTerm,
  onHelp,
}: {
  label: string
  value: string
  options: { value: string; label: ReactNode; textValue?: string }[]
  onChange: (value: string) => void
  helpTerm?: ConvolutionTermId
  onHelp?: (term: ConvolutionTermId) => void
}) {
  return (
    <div className="control-field">
      <ControlLabel label={label} helpTerm={helpTerm} onHelp={onHelp} />
      <SelectMenu
        value={value}
        options={options.map((option) => ({ value: option.value, textValue: option.textValue ?? (typeof option.label === 'string' ? option.label : option.value), label: option.label }))}
        onChange={onChange}
        ariaLabel={label}
      />
    </div>
  )
}

function Range({
  label,
  value,
  min,
  max,
  step,
  valueSuffix,
  onChange,
  helpTerm,
  onHelp,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueSuffix?: string
  onChange: (value: number) => void
  helpTerm?: ConvolutionTermId
  onHelp?: (term: ConvolutionTermId) => void
}) {
  if (valueSuffix) {
    return (
      <div className="speed-control">
        <ControlLabel label={label} helpTerm={helpTerm} onHelp={onHelp} />
        <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{`${value.toFixed(2)}${valueSuffix}`}</strong>
      </div>
    )
  }

  return (
    <div className="range-control">
      <ControlLabel label={`${label}: ${formatNumber(value)}`} helpTerm={helpTerm} onHelp={onHelp} />
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  )
}

function Toggle({ label, checked, onChange, helpTerm, onHelp }: { label: string; checked: boolean; onChange: (checked: boolean) => void; helpTerm?: ConvolutionTermId; onHelp?: (term: ConvolutionTermId) => void }) {
  return (
    <div className="checkbox-line">
      <label>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </label>
      {helpTerm && onHelp && <ControlHelpButton label={label} term={helpTerm} onHelp={onHelp} />}
    </div>
  )
}

function SequenceEditor({
  label,
  values,
  onChange,
  addLabel,
  helpTerm,
  onHelp,
}: {
  label: string
  values: number[]
  onChange: (values: number[]) => void
  addLabel: string
  helpTerm?: ConvolutionTermId
  onHelp?: (term: ConvolutionTermId) => void
}) {
  return (
    <div className="sequence-editor">
      <div className="section-heading">
        <ControlLabel label={label} helpTerm={helpTerm} onHelp={onHelp} />
        <button type="button" className="mini-button" onClick={() => onChange([...values, 0].slice(0, 12))}>
          {addLabel}
        </button>
      </div>
      <div className="sequence-row">
        {values.map((value, index) => (
          <label key={index}>
            {index}
            <input type="number" value={value} step={0.25} onChange={(event) => onChange(replaceAt(values, index, Number(event.target.value)))} />
            <input type="range" value={value} min={-4} max={4} step={0.1} onChange={(event) => onChange(replaceAt(values, index, Number(event.target.value)))} />
          </label>
        ))}
      </div>
    </div>
  )
}

function ControlLabel({ label, helpTerm, onHelp }: { label: string; helpTerm?: ConvolutionTermId; onHelp?: (term: ConvolutionTermId) => void }) {
  return (
    <span className="control-label-row">
      <span>{label}</span>
      {helpTerm && onHelp && <ControlHelpButton label={label} term={helpTerm} onHelp={onHelp} />}
    </span>
  )
}

function ControlHelpButton({ label, term, onHelp }: { label: string; term: ConvolutionTermId; onHelp: (term: ConvolutionTermId) => void }) {
  return (
    <button type="button" className="mini-help-button" aria-label={`Explain ${label}`} title={`Explain ${label}`} onClick={() => onHelp(term)}>
      <CircleHelp size={14} />
    </button>
  )
}

function KernelGridEditor({ kernel, onChange }: { kernel: Kernel2D; onChange: (kernel: Kernel2D) => void }) {
  return (
    <div className="kernel-grid-editor" style={{ gridTemplateColumns: `repeat(${kernel[0]?.length ?? 1}, minmax(0, 1fr))` }}>
      {kernel.map((row, rowIndex) =>
        row.map((value, columnIndex) => (
          <input
            aria-label={`kernel row ${rowIndex + 1} column ${columnIndex + 1}`}
            key={`${rowIndex}-${columnIndex}`}
            type="number"
            step={0.25}
            value={value}
            onChange={(event) => onChange(updateKernelValue(kernel, rowIndex, columnIndex, Number(event.target.value)))}
          />
        )),
      )}
    </div>
  )
}

function DistributionTable({
  xDistribution,
  yDistribution,
  selectedSum,
  ariaLabel,
  ui,
}: {
  xDistribution: DiscreteDistribution
  yDistribution: DiscreteDistribution
  selectedSum: number
  ariaLabel: string
  ui: ConvolutionUiCopy
}) {
  return (
    <div className="distribution-table" aria-label={ariaLabel}>
      {xDistribution.support.flatMap((xValue, row) =>
        yDistribution.support.map((yValue, column) => {
          const active = xValue + yValue === selectedSum
          const contribution = (xDistribution.probabilities[row] ?? 0) * (yDistribution.probabilities[column] ?? 0)
          return (
            <span className={active ? 'active' : ''} key={`${row}-${column}`} title={`${xValue}+${yValue}: ${formatNumber(contribution, ui)}`}>
              <strong>{xValue}+{yValue}</strong>
              {active && <small>{formatNumber(contribution, ui)}</small>}
            </span>
          )
        }),
      )}
    </div>
  )
}

function KernelPreview({ title, kernel, ui }: { title: string; kernel: Kernel2D; ui: ConvolutionUiCopy }) {
  return (
    <div className="kernel-preview">
      <ControlLabel label={title} />
      <div className="kernel-grid-preview" style={{ gridTemplateColumns: `repeat(${kernel[0]?.length ?? 1}, minmax(0, 1fr))` }}>
        {kernel.map((row, rowIndex) =>
          row.map((value, columnIndex) => (
            <span key={`${rowIndex}-${columnIndex}`}>{formatNumber(value, ui)}</span>
          )),
        )}
      </div>
    </div>
  )
}

function ImageCanvas({
  title,
  canvasRef,
  imageData,
  selectedPixel,
  onSelect,
}: {
  title: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  imageData: ImageData
  selectedPixel: { x: number; y: number }
  onSelect: (point: { x: number; y: number }) => void
}) {
  return (
    <figure className="image-canvas-frame">
      <figcaption>{title}</figcaption>
      <canvas
        ref={canvasRef}
        width={imageData.width}
        height={imageData.height}
        aria-label={title}
        data-convolution-image-canvas
        onPointerDown={(event) => {
          const canvas = event.currentTarget
          const rect = canvas.getBoundingClientRect()
          const x = Math.floor(((event.clientX - rect.left) / rect.width) * imageData.width)
          const y = Math.floor(((event.clientY - rect.top) / rect.height) * imageData.height)
          onSelect({ x: clamp(x, 0, imageData.width - 1), y: clamp(y, 0, imageData.height - 1) })
        }}
      />
      <span className="pixel-marker" style={{ left: `${(selectedPixel.x / Math.max(1, imageData.width)) * 100}%`, top: `${(selectedPixel.y / Math.max(1, imageData.height)) * 100}%` }} aria-hidden="true" />
    </figure>
  )
}

function drawDiscreteScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: {
    a: number[]
    b: number[]
    output: number[]
    currentK: number
    fullIndex: number
    terms: TermContribution[]
    operation: OperationMode
    labels: ConvolutionUiCopy['canvas']
  },
) {
  fillCanvas(ctx, viewport, theme)
  const bands = splitBands(viewport, 3, 18)
  drawDiscreteAlignmentBand(ctx, bands[0], theme, state)
  drawProductBand(ctx, bands[1], theme, state.terms, state.fullIndex, state.labels.overlapProducts)
  drawSequenceBand(ctx, bands[2], theme, state.output, { label: state.labels.outputY, color: theme.warning, highlight: state.currentK })
}

function drawProbabilityScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: { xDistribution: DiscreteDistribution; yDistribution: DiscreteDistribution; output: DiscreteDistribution; selectedSum: number; labels: ConvolutionUiCopy['canvas'] },
) {
  fillCanvas(ctx, viewport, theme)
  const bands = splitBands(viewport, 3, 18)
  drawDistributionBand(ctx, bands[0], theme, state.xDistribution, 'X', theme.primary)
  drawDistributionBand(ctx, bands[0], theme, state.yDistribution, 'Y', theme.secondary, 0.45)
  drawPairHeatmap(ctx, bands[1], theme, state.xDistribution, state.yDistribution, state.selectedSum, state.labels.pairsForSum)
  drawDistributionBand(ctx, bands[2], theme, state.output, 'X + Y', theme.warning, 0, state.selectedSum)
}

function drawSignalScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: { signal: number[]; kernel: number[]; output: number[]; currentIndex: number; fullIndex: number; operation: OperationMode; labels: ConvolutionUiCopy['canvas'] },
) {
  fillCanvas(ctx, viewport, theme)
  const bands = splitBands(viewport, 3, 18)
  const visualKernel = state.operation === 'convolution' ? flipSequence(state.kernel) : state.kernel
  drawLineBand(ctx, bands[0], theme, state.signal, state.labels.inputSignal, theme.primary)
  drawWindowOverlay(ctx, bands[0], theme, state.fullIndex, visualKernel.length, state.signal.length)
  drawKernelOverlayOnSignal(ctx, bands[0], theme, visualKernel, state.fullIndex, state.signal.length)
  drawSequenceBand(ctx, bands[1], theme, visualKernel, { label: state.operation === 'convolution' ? state.labels.kernelFlipped : state.labels.kernelCorrelation, color: theme.secondary })
  drawLineBand(ctx, bands[2], theme, state.output, state.labels.filteredOutput, theme.warning, state.currentIndex)
}

function drawPolynomialScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: { a: number[]; b: number[]; product: number[]; currentK: number; labels: ConvolutionUiCopy['canvas'] },
) {
  fillCanvas(ctx, viewport, theme)
  const gridBand = { x: 18, y: 18, width: viewport.width - 36, height: viewport.height * 0.55 - 24 }
  const outputBand = { x: 18, y: viewport.height * 0.58, width: viewport.width - 36, height: viewport.height * 0.36 }
  drawPolynomialGrid(ctx, gridBand, theme, state.a, state.b, state.currentK, state.labels.polynomialGrid)
  drawSequenceBand(ctx, outputBand, theme, state.product, { label: state.labels.productCoefficients, color: theme.warning, highlight: state.currentK })
}

function drawContinuousScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: { f: (x: number) => number; g: (x: number) => number; t: number; product: NumericSample[]; outputCurve: NumericSample[]; labels: ConvolutionUiCopy['canvas'] },
) {
  drawGrid(ctx, viewport, theme)
  drawCurve(ctx, viewport, sampleFunction(state.f, viewport.xMin, viewport.xMax, 220), theme.primary, 2)
  drawCurve(ctx, viewport, sampleFunction((tau) => state.g(state.t - tau), viewport.xMin, viewport.xMax, 220), theme.secondary, 2)
  drawArea(ctx, viewport, state.product, theme.fill)
  drawCurve(ctx, viewport, state.product, theme.warning, 1.8)
  drawCurve(ctx, viewport, state.outputCurve, theme.accent, 2.4, 1.2)
  const marker = worldToScreen(viewport, state.t, 0)
  ctx.strokeStyle = theme.accent
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(marker.x, 0)
  ctx.lineTo(marker.x, viewport.height)
  ctx.stroke()
  ctx.setLineDash([])
  drawText(ctx, `t = ${formatNumber(state.t)}`, marker.x + 8, 22, theme)
  drawLegend(ctx, theme, [
    { label: state.labels.continuousF, color: theme.primary },
    { label: state.labels.continuousShiftedG, color: theme.secondary },
    { label: state.labels.continuousProduct, color: theme.warning },
    { label: state.labels.continuousOutputOffset, color: theme.accent },
  ], 18, viewport.height - 72)
}

function fillCanvas(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) {
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, viewport.width, viewport.height)
  ctx.strokeStyle = theme.gridMajor
  ctx.lineWidth = 1
  for (let y = 42; y < viewport.height; y += 42) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(viewport.width, y)
    ctx.stroke()
  }
}

function drawDiscreteAlignmentBand(
  ctx: CanvasRenderingContext2D,
  band: DrawBand,
  theme: GraphTheme,
  state: {
    a: number[]
    b: number[]
    fullIndex: number
    terms: TermContribution[]
    operation: OperationMode
    labels: ConvolutionUiCopy['canvas']
  },
) {
  const visualB = state.operation === 'convolution' ? flipSequence(state.b) : state.b
  const label = state.operation === 'convolution' ? state.labels.aWithFlippedB : state.labels.aWithDirectB
  drawText(ctx, label, band.x, band.y + 14, theme)
  if (state.a.length === 0 || visualB.length === 0) return

  const activeA = new Set(state.terms.map((term) => term.aIndex))
  const activeVisualB = new Set(state.terms.map((term) => visualB.length - 1 - term.bIndex))
  const left = state.fullIndex - visualB.length + 1
  const minPosition = -(visualB.length - 1)
  const positionCount = state.a.length + visualB.length - 1
  const step = band.width / Math.max(1, positionCount)
  const barWidth = Math.max(7, step * 0.42)
  const maxMagnitude = Math.max(1, ...state.a.map((value) => Math.abs(value)), ...visualB.map((value) => Math.abs(value)))
  const baselineA = band.y + band.height * 0.42
  const baselineB = band.y + band.height * 0.8
  const rowHeight = band.height * 0.22
  const xForPosition = (position: number) => band.x + (position - minPosition + 0.5) * step

  state.terms.forEach((term) => {
    const x = xForPosition(term.aIndex)
    ctx.fillStyle = theme.fill
    ctx.globalAlpha = 0.6
    ctx.fillRect(x - step * 0.42, band.y + 22, step * 0.84, band.height - 28)
    ctx.globalAlpha = 1
  })

  drawAlignedBars(ctx, theme, state.a, 0, baselineA, rowHeight, maxMagnitude, xForPosition, theme.primary, activeA, (index) => `a${index}`)
  drawAlignedBars(
    ctx,
    theme,
    visualB,
    left,
    baselineB,
    rowHeight,
    maxMagnitude,
    xForPosition,
    theme.secondary,
    activeVisualB,
    (visualIndex) => (state.operation === 'convolution' ? `b${visualB.length - 1 - visualIndex}` : `b${visualIndex}`),
    barWidth,
  )

  drawText(ctx, `k = ${state.fullIndex}`, band.x + band.width - 64, band.y + 14, theme, 11)
}

function drawAlignedBars(
  ctx: CanvasRenderingContext2D,
  theme: GraphTheme,
  values: number[],
  leftPosition: number,
  baseline: number,
  rowHeight: number,
  maxMagnitude: number,
  xForPosition: (position: number) => number,
  color: string,
  activeIndexes: Set<number>,
  indexLabel: (index: number) => string,
  barWidth = 10,
) {
  ctx.strokeStyle = theme.gridMajor
  ctx.beginPath()
  const firstX = xForPosition(leftPosition) - barWidth
  const lastX = xForPosition(leftPosition + values.length - 1) + barWidth
  ctx.moveTo(firstX, baseline)
  ctx.lineTo(lastX, baseline)
  ctx.stroke()

  values.forEach((value, index) => {
    const position = leftPosition + index
    const height = (Math.abs(value) / maxMagnitude) * rowHeight
    const x = xForPosition(position) - barWidth / 2
    const y = value >= 0 ? baseline - height : baseline
    const active = activeIndexes.has(index)
    ctx.fillStyle = color
    ctx.globalAlpha = active ? 1 : 0.28
    ctx.fillRect(x, y, barWidth, Math.max(2, height))
    ctx.globalAlpha = 1
    drawText(ctx, indexLabel(index), x - 2, baseline + 14, theme, 10)
  })
}

function drawSequenceBand(
  ctx: CanvasRenderingContext2D,
  band: DrawBand,
  theme: GraphTheme,
  values: number[],
  options: { label: string; color: string; offset?: number; highlight?: number },
) {
  drawText(ctx, options.label, band.x, band.y + 14, theme)
  if (values.length === 0) return
  const maxMagnitude = Math.max(1, ...values.map((value) => Math.abs(value)))
  const barWidth = Math.max(8, (band.width / Math.max(values.length, 1)) * 0.66)
  const step = band.width / Math.max(values.length, 1)
  const baseline = band.y + band.height * (options.offset ?? 0.58)
  ctx.strokeStyle = theme.gridMajor
  ctx.beginPath()
  ctx.moveTo(band.x, baseline)
  ctx.lineTo(band.x + band.width, baseline)
  ctx.stroke()
  values.forEach((value, index) => {
    const height = (Math.abs(value) / maxMagnitude) * band.height * 0.36
    const x = band.x + index * step + (step - barWidth) / 2
    const y = value >= 0 ? baseline - height : baseline
    ctx.fillStyle = index === options.highlight ? theme.accent : options.color
    ctx.globalAlpha = index === options.highlight ? 1 : 0.82
    ctx.fillRect(x, y, barWidth, height)
    ctx.globalAlpha = 1
    drawText(ctx, String(index), x + barWidth * 0.35, band.y + band.height - 6, theme, 11)
  })
}

function drawProductBand(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, terms: TermContribution[], fullIndex: number, labelPrefix: string) {
  drawText(ctx, `${labelPrefix} ${fullIndex}`, band.x, band.y + 14, theme)
  const values = terms.map((term) => term.product)
  drawSequenceBand(ctx, { ...band, y: band.y + 10, height: band.height - 12 }, theme, values, { label: '', color: theme.warning })
}

function drawDistributionBand(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, distribution: DiscreteDistribution, label: string, color: string, offset = 0, highlight?: number) {
  const inner = { ...band, y: band.y + band.height * offset, height: band.height * 0.55 }
  drawText(ctx, label, inner.x, inner.y + 14, theme)
  const maxProbability = Math.max(0.001, ...distribution.probabilities)
  const step = inner.width / Math.max(1, distribution.support.length)
  distribution.support.forEach((value, index) => {
    const barWidth = Math.max(8, step * 0.62)
    const height = (distribution.probabilities[index] / maxProbability) * inner.height * 0.58
    const x = inner.x + index * step + (step - barWidth) / 2
    const y = inner.y + inner.height - height - 16
    ctx.fillStyle = value === highlight ? theme.accent : color
    ctx.fillRect(x, y, barWidth, height)
    drawText(ctx, String(value), x, inner.y + inner.height - 2, theme, 10)
  })
}

function drawPairHeatmap(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, xDistribution: DiscreteDistribution, yDistribution: DiscreteDistribution, selectedSum: number, label: string) {
  drawText(ctx, label, band.x, band.y + 14, theme)
  const columns = yDistribution.support.length
  const rows = xDistribution.support.length
  const cell = Math.min((band.width - 12) / Math.max(1, columns), (band.height - 28) / Math.max(1, rows))
  const startX = band.x
  const startY = band.y + 24
  const maxContribution = Math.max(
    0.001,
    ...xDistribution.probabilities.flatMap((px) => yDistribution.probabilities.map((py) => px * py)),
  )
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sum = xDistribution.support[row] + yDistribution.support[column]
      const contribution = (xDistribution.probabilities[row] ?? 0) * (yDistribution.probabilities[column] ?? 0)
      const active = sum === selectedSum
      ctx.fillStyle = active ? theme.accent : theme.gridMajor
      ctx.globalAlpha = active ? 0.35 + 0.55 * (contribution / maxContribution) : 0.22
      ctx.fillRect(startX + column * cell, startY + row * cell, cell - 2, cell - 2)
      ctx.globalAlpha = 1
    }
  }
}

function drawLineBand(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, values: number[], label: string, color: string, highlightIndex?: number) {
  drawText(ctx, label, band.x, band.y + 14, theme)
  if (values.length === 0) return
  const min = Math.min(-1, ...values)
  const max = Math.max(1, ...values)
  const xFor = (index: number) => band.x + (index / Math.max(1, values.length - 1)) * band.width
  const yFor = (value: number) => band.y + band.height - 18 - ((value - min) / Math.max(0.001, max - min)) * (band.height - 36)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  values.forEach((value, index) => {
    const x = xFor(index)
    const y = yFor(value)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  if (highlightIndex !== undefined) {
    const index = clamp(Math.round(highlightIndex), 0, values.length - 1)
    ctx.fillStyle = theme.accent
    ctx.beginPath()
    ctx.arc(xFor(index), yFor(values[index]), 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawWindowOverlay(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, fullIndex: number, kernelLength: number, signalLength: number) {
  const step = band.width / Math.max(1, signalLength - 1)
  const left = fullIndex - kernelLength + 1
  const start = band.x + left * step - step * 0.5
  const width = Math.max(step, kernelLength * step)
  ctx.strokeStyle = theme.accent
  ctx.setLineDash([6, 4])
  ctx.strokeRect(start, band.y + 22, width, band.height - 34)
  ctx.setLineDash([])
}

function drawKernelOverlayOnSignal(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, kernel: number[], fullIndex: number, signalLength: number) {
  if (kernel.length === 0 || signalLength === 0) return
  const step = band.width / Math.max(1, signalLength - 1)
  const left = fullIndex - kernel.length + 1
  const baseY = band.y + band.height - 26
  const maxWeight = Math.max(0.001, ...kernel.map((value) => Math.abs(value)))
  kernel.forEach((weight, kernelIndex) => {
    const signalIndex = left + kernelIndex
    const x = band.x + signalIndex * step
    if (x < band.x - step || x > band.x + band.width + step) return
    const height = (Math.abs(weight) / maxWeight) * band.height * 0.22
    const y = weight >= 0 ? baseY - height : baseY
    const inside = signalIndex >= 0 && signalIndex < signalLength
    ctx.strokeStyle = inside ? theme.secondary : theme.gridMajor
    ctx.fillStyle = inside ? theme.secondary : theme.gridMajor
    ctx.globalAlpha = inside ? 0.82 : 0.35
    ctx.beginPath()
    ctx.moveTo(x, baseY)
    ctx.lineTo(x, weight >= 0 ? y : y + height)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, weight >= 0 ? y : y + height, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  })
}

function drawPolynomialGrid(ctx: CanvasRenderingContext2D, band: DrawBand, theme: GraphTheme, a: number[], b: number[], currentK: number, label: string) {
  drawText(ctx, label, band.x, band.y + 14, theme)
  const cell = Math.min((band.width - 20) / Math.max(1, b.length), (band.height - 36) / Math.max(1, a.length))
  const startX = band.x
  const startY = band.y + 26
  for (let row = 0; row < a.length; row += 1) {
    for (let column = 0; column < b.length; column += 1) {
      const active = row + column === currentK
      const x = startX + column * cell
      const y = startY + row * cell
      ctx.fillStyle = active ? theme.fill : theme.gridMajor
      ctx.strokeStyle = active ? theme.accent : theme.gridMinor
      ctx.fillRect(x, y, cell - 3, cell - 3)
      ctx.strokeRect(x, y, cell - 3, cell - 3)
      drawText(ctx, formatNumber(a[row] * b[column]), x + 6, y + 17, theme, 11)
    }
  }
}

function drawCurve(ctx: CanvasRenderingContext2D, viewport: GraphViewport, samples: NumericSample[], color: string, width: number, yOffset = 0) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  let started = false
  for (const sample of samples) {
    if (!Number.isFinite(sample.y)) {
      started = false
      continue
    }
    const point = worldToScreen(viewport, sample.x, sample.y + yOffset)
    if (!started) {
      ctx.moveTo(point.x, point.y)
      started = true
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  ctx.stroke()
}

function drawArea(ctx: CanvasRenderingContext2D, viewport: GraphViewport, samples: NumericSample[], color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  let started = false
  for (const sample of samples) {
    if (!Number.isFinite(sample.y)) continue
    const point = worldToScreen(viewport, sample.x, sample.y)
    if (!started) {
      const baseline = worldToScreen(viewport, sample.x, 0)
      ctx.moveTo(baseline.x, baseline.y)
      ctx.lineTo(point.x, point.y)
      started = true
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    const sample = samples[index]
    if (!Number.isFinite(sample.y)) continue
    const baseline = worldToScreen(viewport, sample.x, 0)
    ctx.lineTo(baseline.x, baseline.y)
  }
  ctx.closePath()
  ctx.fill()
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, theme: GraphTheme, size = 12) {
  ctx.fillStyle = theme.text
  ctx.font = `${size}px Inter, system-ui, sans-serif`
  ctx.fillText(text, x, y)
}

function drawLegend(ctx: CanvasRenderingContext2D, theme: GraphTheme, items: { label: string; color: string }[], x: number, y: number) {
  items.forEach((item, index) => {
    const itemY = y + index * 18
    ctx.fillStyle = item.color
    ctx.fillRect(x, itemY - 8, 10, 10)
    drawText(ctx, item.label, x + 16, itemY, theme, 11)
  })
}

type DrawBand = {
  x: number
  y: number
  width: number
  height: number
}

function splitBands(viewport: GraphViewport, count: number, gap: number): DrawBand[] {
  const totalGap = gap * (count + 1)
  const height = (viewport.height - totalGap) / count
  return Array.from({ length: count }, (_, index) => ({
    x: 18,
    y: gap + index * (height + gap),
    width: viewport.width - 36,
    height,
  }))
}

function useAnimationStep(playing: boolean, speed: number, step: () => void) {
  const reducedMotion = usePrefersReducedMotion()
  useEffect(() => {
    if (!playing || reducedMotion) return
    let frame = 0
    let previous = performance.now()
    let accumulated = 0
    const tick = (now: number) => {
      const delta = Math.min(120, now - previous)
      previous = now
      accumulated += delta * speed
      if (accumulated >= 220) {
        step()
        accumulated = 0
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, reducedMotion, speed, step])
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false))
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function filterSignal(signal: number[], kernel: number[], mode: ConvolutionMode, boundary: BoundaryMode, operation: OperationMode): number[] {
  const orientedKernel = operation === 'convolution' ? kernel : flipSequence(kernel)
  if (boundary === 'zero' || mode !== 'same') return convolveSignal(signal, orientedKernel, mode)
  const center = Math.floor(orientedKernel.length / 2)
  return signal.map((_, index) => {
    let total = 0
    for (let kernelIndex = 0; kernelIndex < orientedKernel.length; kernelIndex += 1) {
      const sampleIndex = index + kernelIndex - center
      total += sampleSignal(signal, sampleIndex, boundary) * orientedKernel[kernelIndex]
    }
    return total
  })
}

function sampleSignal(signal: number[], index: number, boundary: BoundaryMode): number {
  if (index >= 0 && index < signal.length) return signal[index]
  if (boundary === 'clamp') return signal[clamp(index, 0, signal.length - 1)] ?? 0
  if (boundary === 'wrap') return signal[((index % signal.length) + signal.length) % signal.length] ?? 0
  return 0
}

function fullIndexFromVisibleIndex(index: number, mode: ConvolutionMode, aLength: number, bLength: number): number {
  if (mode === 'same') return index + Math.floor((bLength - 1) / 2)
  if (mode === 'valid') return index + Math.min(aLength, bLength) - 1
  return index
}

function modeOptions(ui: ConvolutionUiCopy): { value: string; label: string }[] {
  return [
    { value: 'full', label: optionLabel(ui, 'full') },
    { value: 'same', label: optionLabel(ui, 'same') },
    { value: 'valid', label: optionLabel(ui, 'valid') },
  ]
}

function operationOptions(ui: ConvolutionUiCopy): { value: string; label: string }[] {
  return [
    { value: 'convolution', label: optionLabel(ui, 'convolution') },
    { value: 'correlation', label: optionLabel(ui, 'correlation') },
  ]
}

function boundaryOptions(ui: ConvolutionUiCopy): { value: string; label: string }[] {
  return [
    { value: 'zero', label: optionLabel(ui, 'zero') },
    { value: 'clamp', label: optionLabel(ui, 'clamp') },
    { value: 'wrap', label: optionLabel(ui, 'wrap') },
  ]
}

function optionLabel(ui: ConvolutionUiCopy, key: string): string {
  return ui.options[key] ?? key
}

function coerceContinuousPreset(value: string): ContinuousPresetId {
  return continuousPresetOptions.some((preset) => preset.id === value) ? (value as ContinuousPresetId) : 'rectangle'
}

function operationFormula(lessonId: 'discrete' | 'signal' | 'image-kernel', operation: OperationMode, ui: ConvolutionUiCopy): FormulaDisplay {
  const note = ui.formulaOperationNote
  if (lessonId === 'image-kernel') {
    if (operation === 'correlation') {
      return {
        formula: 'out[x,y] = sum_u sum_v I[x+u,y+v] K[u,v]',
        formulaTex: '\\operatorname{out}[x,y]=\\sum_{u,v} I[x+u,y+v]K[u,v]',
        note,
      }
    }
    return {
      formula: 'out[x,y] = sum_u sum_v I[x-u,y-v] K[u,v]',
      formulaTex: '\\operatorname{out}[x,y]=\\sum_{u,v} I[x-u,y-v]K[u,v]',
      note,
    }
  }

  const outputName = lessonId === 'signal' ? 'y' : 'y'
  const inputName = lessonId === 'signal' ? 'x' : 'a'
  const kernelName = lessonId === 'signal' ? 'h' : 'b'
  if (operation === 'correlation') {
    return {
      formula: `${outputName}[k] = sum_i ${inputName}[i] ${kernelName}[i - k]`,
      formulaTex: `${outputName}[k]=\\sum_i ${inputName}[i]${kernelName}[i-k]`,
      note,
    }
  }
  return {
    formula: `${outputName}[k] = sum_i ${inputName}[i] ${kernelName}[k - i]`,
    formulaTex: `${outputName}[k]=\\sum_i ${inputName}[i]${kernelName}[k-i]`,
    note,
  }
}

function readParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function exportConvolutionCanvas(lessonId: ConvolutionLessonId) {
  const host = document.querySelector<HTMLElement>(`.convolution-stage[data-convolution-export="${lessonId}"]`)
  const canvas = host?.querySelector<HTMLCanvasElement>('canvas')
  exportCanvasElement(canvas ?? null, `convolution-${lessonId}-${todayStamp()}.png`)
}

function exportCanvasElement(canvas: HTMLCanvasElement | null, filename: string) {
  if (!canvas) return
  const anchor = document.createElement('a')
  anchor.href = canvas.toDataURL('image/png')
  anchor.download = filename
  anchor.click()
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatTerms(terms: TermContribution[], ui: ConvolutionUiCopy): string {
  if (terms.length === 0) return ui.noOverlap
  return terms.map((term) => `a[${term.aIndex}] × b[${term.bIndex}] = ${formatNumber(term.aValue, ui)} × ${formatNumber(term.bValue, ui)} = ${formatNumber(term.product, ui)}`).join(' + ')
}

function formatTermCalculation(terms: TermContribution[], ui: ConvolutionUiCopy, outputSymbol: string, index: number, value?: number): string {
  const total = value ?? terms.reduce((sum, term) => sum + term.product, 0)
  if (terms.length === 0) return `${outputSymbol}[${index}] = ${ui.noOverlap} = ${formatNumber(total, ui)}`
  const compactProducts = terms.map((term) => `${formatNumber(term.aValue, ui)}×${formatNumber(term.bValue, ui)}`).join(' + ')
  const indexedProducts = terms.length <= 4 ? ` (${formatTerms(terms, ui)})` : ''
  return `${outputSymbol}[${index}] = ${compactProducts} = ${formatNumber(total, ui)}${indexedProducts}`
}

function termsForDisplayedKernel(terms: TermContribution[], kernelLength: number, operation: OperationMode): TermContribution[] {
  if (operation !== 'correlation') return terms
  return terms.map((term) => ({ ...term, bIndex: kernelLength - 1 - term.bIndex }))
}

function probabilityPairTerms(xDistribution: DiscreteDistribution, yDistribution: DiscreteDistribution, selectedSum: number): { x: number; y: number; px: number; py: number; contribution: number }[] {
  const terms: { x: number; y: number; px: number; py: number; contribution: number }[] = []
  xDistribution.support.forEach((x, xIndex) => {
    yDistribution.support.forEach((y, yIndex) => {
      if (x + y !== selectedSum) return
      const px = xDistribution.probabilities[xIndex] ?? 0
      const py = yDistribution.probabilities[yIndex] ?? 0
      terms.push({ x, y, px, py, contribution: px * py })
    })
  })
  return terms
}

function formatProbabilityCalculation(terms: ReturnType<typeof probabilityPairTerms>, selectedSum: number, probability: number, ui: ConvolutionUiCopy): string {
  if (terms.length === 0) return `P(S=${selectedSum}) = 0`
  const parts = terms.map((term) => `${formatNumber(term.px, ui)}×${formatNumber(term.py, ui)}`)
  return `P(S=${selectedSum}) = ${parts.join(' + ')} = ${formatNumber(probability, ui)}`
}

function previewAppliedKernel(kernel: Kernel2D, operation: OperationMode, normalize: boolean): Kernel2D {
  const oriented = operation === 'convolution' ? flipKernel2D(kernel) : kernel.map((row) => [...row])
  return normalize ? normalizeKernel2D(oriented) : oriented
}

function replaceAt(values: number[], index: number, nextValue: number): number[] {
  return values.map((value, currentIndex) => (currentIndex === index ? (Number.isFinite(nextValue) ? nextValue : value) : value))
}

function updateKernelValue(kernel: Kernel2D, rowIndex: number, columnIndex: number, nextValue: number): Kernel2D {
  return kernel.map((row, currentRow) => row.map((value, currentColumn) => (currentRow === rowIndex && currentColumn === columnIndex ? (Number.isFinite(nextValue) ? nextValue : value) : value)))
}

function resizeKernel(kernel: Kernel2D, size: number): Kernel2D {
  const next = Array.from({ length: size }, () => Array.from({ length: size }, () => 0))
  const sourceRows = kernel.length
  const sourceColumns = kernel[0]?.length ?? 0
  const rowOffset = Math.floor((size - sourceRows) / 2)
  const columnOffset = Math.floor((size - sourceColumns) / 2)
  for (let row = 0; row < sourceRows; row += 1) {
    for (let column = 0; column < sourceColumns; column += 1) {
      const nextRow = row + rowOffset
      const nextColumn = column + columnOffset
      if (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size) next[nextRow][nextColumn] = kernel[row][column]
    }
  }
  return next
}

function drawImageDataToCanvas(canvas: HTMLCanvasElement | null, imageData: ImageData) {
  if (!canvas) return
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.putImageData(imageData, 0, 0)
}

async function loadUploadedImage(
  event: ChangeEvent<HTMLInputElement>,
  setInputImage: (imageData: ImageData) => void,
  setImagePreset: (preset: string) => void,
  setError: (error: string | null) => void,
  ui: ConvolutionUiCopy,
) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error(ui.couldNotReadImage)
    ctx.drawImage(bitmap, 0, 0, width, height)
    setInputImage(ctx.getImageData(0, 0, width, height))
    setImagePreset('upload')
    setError(null)
  } catch {
    setError(ui.uploadFailed)
  }
}

function makeSampleImageData(preset: string, width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  let seed = 97
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      let r = (x / width) * 255
      let g = (y / height) * 255
      let b = 160
      if (preset === 'checkerboard') {
        const active = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0
        r = active ? 230 : 30
        g = active ? 230 : 40
        b = active ? 235 : 55
      }
      if (preset === 'face') {
        const dx = (x - width / 2) / (width / 2)
        const dy = (y - height / 2) / (height / 2)
        const face = dx * dx + dy * dy < 0.72
        const eye = ((x - width * 0.38) ** 2 + (y - height * 0.42) ** 2 < 42) || ((x - width * 0.62) ** 2 + (y - height * 0.42) ** 2 < 42)
        const mouth = y > height * 0.62 && y < height * 0.66 && Math.abs(x - width / 2) < width * 0.18
        r = face ? 210 : 35
        g = face ? 176 : 48
        b = face ? 132 : 62
        if (eye || mouth) {
          r = 30
          g = 38
          b = 45
        }
      }
      if (preset === 'noise') {
        seed = (seed * 16807) % 2147483647
        const value = ((seed - 1) / 2147483646) * 255
        r = value
        g = 255 - value * 0.6
        b = 80 + value * 0.4
      }
      if (preset === 'edge-shapes') {
        const circle = (x - width * 0.32) ** 2 + (y - height * 0.5) ** 2 < 900
        const rect = x > width * 0.58 && x < width * 0.86 && y > height * 0.25 && y < height * 0.76
        r = circle ? 230 : rect ? 50 : 35
        g = circle ? 95 : rect ? 190 : 60
        b = circle ? 80 : rect ? 210 : 80
      }
      data[offset] = clamp(r, 0, 255)
      data[offset + 1] = clamp(g, 0, 255)
      data[offset + 2] = clamp(b, 0, 255)
      data[offset + 3] = 255
    }
  }
  if (typeof ImageData !== 'undefined') return new ImageData(data as ImageDataArray, width, height)
  return { data, width, height, colorSpace: 'srgb' } as ImageData
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function formatNumber(value: number, ui?: ConvolutionUiCopy): string {
  if (!Number.isFinite(value)) return ui?.undefinedValue ?? 'undefined'
  return String(Math.round(value * 1000) / 1000)
}
