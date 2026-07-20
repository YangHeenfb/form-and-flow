import { act, useRef, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimationControls } from '../components/AnimationControls.tsx'
import { ExplorerStageHeader, ExplorerTransport, InspectorSection } from '../core/ui/ExplorerChrome.tsx'
import { LessonScaffold } from '../core/ui/LessonScaffold.tsx'
import { appCopy } from '../i18n.ts'
import { identityMatrix } from '../math/matrix.ts'
import { MatrixMotionLab } from '../modules/matrix/MatrixMotionLab.tsx'
import { FourierExplanation } from '../modules/fourier/FourierExplanation.tsx'
import { useResizeObserver } from '../platform/useElementSize.ts'
import { LessonStageActions } from '../platform/LessonStageActions.tsx'
import { VisualizationWorkbench } from '../platform/VisualizationWorkbench.tsx'
import type { OverlayPanelDefinition } from '../platform/visualizationLayoutTypes.ts'
import { useAppState } from '../state/useAppState.ts'

const reactActGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true

const labels = {
  focus: 'Focus',
  exitFocus: 'Exit focus',
  autoHideHud: 'Auto-hide HUD',
  closePanel: 'Close panel',
}

afterEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('VisualizationWorkbench', () => {
  it('toggles focus mode class from the keyboard shortcut', () => {
    const { container, unmount } = render(<WorkbenchHarness />)
    const workbench = getWorkbench(container)

    expect(workbench.classList.contains('is-focus')).toBe(false)
    pressKey(document, 'f')
    expect(workbench.classList.contains('is-focus')).toBe(true)
    pressKey(document, 'f')
    expect(workbench.classList.contains('is-focus')).toBe(false)

    unmount()
  })

  it('keeps the workbench title bar out of the standard layout', () => {
    const { container, unmount } = render(<WorkbenchHarness />)

    expect(container.querySelector('.visualization-stage-toolbar')).toBeNull()
    pressKey(document, 'f')
    expect(container.querySelector('.visualization-stage-toolbar')).toBeTruthy()

    unmount()
  })

  it('places an optional inspector action in the desktop and mobile headers', async () => {
    const onReference = vi.fn()
    const { container, unmount } = render(<WorkbenchHarness inspectorAction={<button type="button" onClick={onReference}>Reference</button>} />)
    const actions = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).filter((button) => button.textContent === 'Reference')

    expect(actions).toHaveLength(2)
    actions[0].focus()
    expect(document.activeElement).toBe(actions[0])
    await click(actions[0])
    expect(onReference).toHaveBeenCalledOnce()

    unmount()
  })

  it('opens the standard readout drawer and restores focus after Escape', async () => {
    const { container, unmount } = render(<WorkbenchHarness />)
    const readoutButton = container.querySelector<HTMLButtonElement>('.lesson-stage-readout-action')!

    expect(container.querySelector('.visualization-standard-readout-rail')).toBeNull()
    expect(readoutButton.getAttribute('aria-expanded')).toBe('false')
    readoutButton.focus()
    await click(readoutButton)
    expect(readoutButton.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Right Panel')

    pressKey(document, 'Escape')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(readoutButton)

    unmount()
  })

  it('places the readout action between graph help and focus and hides it in focus mode', () => {
    const { container, unmount } = render(<WorkbenchHarness />)
    const actionLabels = Array.from(container.querySelectorAll('.lesson-stage-actions > button')).map((button) =>
      button.textContent?.trim(),
    )

    expect(actionLabels).toEqual(['Graph notes', 'Readout', 'Focus', 'Export'])
    pressKey(document, 'f')
    expect(container.querySelector('.lesson-stage-readout-action')).toBeNull()

    unmount()
  })

  it('opens an overlay drawer and keeps focus mode after the first Escape', async () => {
    const { container, unmount } = render(<WorkbenchHarness />)
    const workbench = getWorkbench(container)

    pressKey(document, 'f')
    const matricesButton = getButton(container, 'Matrices')
    matricesButton.focus()
    await click(matricesButton)
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Matrix Panel')

    pressKey(document, 'Escape')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(workbench.classList.contains('is-focus')).toBe(true)
    expect(document.activeElement).toBe(matricesButton)

    pressKey(document, 'Escape')
    expect(workbench.classList.contains('is-focus')).toBe(false)

    unmount()
  })

  it('does not run shortcuts while an input has focus', () => {
    const onTogglePlay = vi.fn()
    const { container, unmount } = render(<WorkbenchHarness onTogglePlay={onTogglePlay} />)
    const input = container.querySelector('input')!

    input.focus()
    pressKey(input, 'f')
    pressKey(input, ' ')

    expect(getWorkbench(container).classList.contains('is-focus')).toBe(false)
    expect(onTogglePlay).not.toHaveBeenCalled()

    unmount()
  })
})

describe('LessonScaffold standard readout action', () => {
  it('opens the lesson readout drawer from the stage action and restores focus', async () => {
    const { container, unmount } = render(<LessonScaffoldHarness />)
    const readoutButton = container.querySelector<HTMLButtonElement>('.lesson-stage-readout-action')!

    expect(container.querySelector('.lesson-standard-readout-rail')).toBeNull()
    readoutButton.focus()
    await click(readoutButton)
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Lesson Readout')

    pressKey(document, 'Escape')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(readoutButton)

    unmount()
  })

  it('uses an optional readout label without changing the default label', async () => {
    const { container, unmount } = render(
      <LessonScaffold
        controls={<p>Controls</p>}
        title="Fourier"
        stage={<div>Stage</div>}
        stageActions={(
          <LessonStageActions
            graphLabel="Graph notes"
            onGraphHelp={vi.fn()}
            focusButton={<button type="button">Focus</button>}
            exportLabel="Export"
            onExport={vi.fn()}
          />
        )}
        explanation={<p>Intuition content</p>}
        readoutLabel="Intuition"
      />,
    )
    const button = container.querySelector<HTMLButtonElement>('.lesson-stage-readout-action')!
    expect(button.textContent).toContain('Intuition')
    await click(button)
    expect(container.querySelector('[role="dialog"] h2')?.textContent).toContain('Intuition')
    unmount()
  })
})

describe('FourierExplanation', () => {
  it('leads with three intuition steps and keeps exact formulas collapsed by default', () => {
    const { container, unmount } = render(
      <FourierExplanation
        model={{
          coreLabel: 'Core idea',
          currentLabel: 'What is happening now',
          continueLabel: 'Continue exploring',
          detailsLabel: 'Exact readout and formula',
          readingsLabel: 'Exact readout',
          formulaLabel: 'Formula',
          notesLabel: 'Conventions and limits',
          termsLabel: 'Related terms',
          steps: [
            { title: 'One', body: 'First step' },
            { title: 'Two', body: 'Second step' },
            { title: 'Three', body: 'Third step' },
          ],
          current: 'Current conclusion',
          nextAction: 'Continue',
          nextHref: '/modules/fourier?mode=reconstruction',
        }}
        values={[{ label: '|C(f)|', value: '0.5' }]}
        formulaTex="C(f)"
        formulaLabel="C(f)"
        notes={['Convention']}
      />,
    )
    expect(container.querySelectorAll('.fourier-intuition-steps li')).toHaveLength(3)
    expect(container.querySelector<HTMLDetailsElement>('.fourier-precision-details')?.open).toBe(false)
    expect(container.querySelector('.fourier-precision-details')?.textContent).toContain('|C(f)|')
    unmount()
  })
})

describe('shared explorer chrome', () => {
  it('renders the common title, inspector section, and capability-driven transport', async () => {
    const onPlay = vi.fn()
    const onReset = vi.fn()
    const { container, unmount } = render(
      <div>
        <ExplorerStageHeader eyebrow="Explorer" title="Shared title" actions={<button type="button">Action</button>} />
        <InspectorSection title="Parameters"><label>Value<input /></label></InspectorSection>
        <ExplorerTransport
          primaryAction={{ label: 'Play', onClick: onPlay }}
          secondaryActions={[{ label: 'Reset animation', onClick: onReset }]}
          progress={{ label: 'Playback progress', value: 0.25, onChange: vi.fn() }}
          speed={{ label: 'Speed', value: 1, min: 0.25, max: 3, step: 0.05, onChange: vi.fn() }}
        />
      </div>,
    )

    expect(container.querySelector('.explorer-stage-heading')?.textContent).toContain('Shared title')
    expect(container.querySelector('.inspector-section-header')?.textContent).toContain('Parameters')
    expect(container.querySelector<HTMLInputElement>('[aria-label="Playback progress"]')?.value).toBe('0.25')
    await click(getButton(container, 'Play'))
    await click(getButton(container, 'Reset animation'))
    expect(onPlay).toHaveBeenCalledOnce()
    expect(onReset).toHaveBeenCalledOnce()
    unmount()
  })

  it('marks static transports as compact and omits empty playback controls', () => {
    const { container, unmount } = render(
      <ExplorerTransport compact secondaryActions={[{ label: 'Reset parameters', onClick: vi.fn() }]} />,
    )
    expect(container.querySelector('.explorer-transport')?.getAttribute('data-compact')).toBe('true')
    expect(container.querySelector('.playback-progress-control')).toBeNull()
    expect(container.querySelector('.explorer-transport-speed')).toBeNull()
    unmount()
  })
})

describe('useResizeObserver', () => {
  it('notifies when the observed element size changes', () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const onResize = vi.fn()
    class ResizeObserverMock {
      static instances: ResizeObserverMock[] = []
      private readonly callback: ResizeObserverCallback

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
        ResizeObserverMock.instances.push(this)
      }
      observe() {
        return undefined
      }
      disconnect() {
        return undefined
      }
      emit(width: number, height: number) {
        this.callback([{ contentRect: { width, height } as DOMRectReadOnly } as ResizeObserverEntry], this as unknown as ResizeObserver)
      }
    }
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

    const { unmount } = render(<ResizeHarness onResize={onResize} />)
    act(() => ResizeObserverMock.instances[0].emit(320, 180))

    expect(onResize).toHaveBeenCalledWith(expect.objectContaining({ width: 320, height: 180 }))

    unmount()
    globalThis.ResizeObserver = originalResizeObserver
  })
})

describe('MatrixMotionLab workbench integration', () => {
  it('keeps mobile display options in a collapsed disclosure without removing desktop controls', () => {
    const { container, unmount } = render(
      <AnimationControls
        copy={appCopy.en.controls}
        animation={{ playing: false, progress: 0, speed: 1, mode: 'combined', stepIndex: 0 }}
        viewOptions={{ showGrid: true, showBasis: true, showUnitShape: true, showVectors: true, showTrails: true }}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onReset={vi.fn()}
        onResetView={vi.fn()}
        onSeek={vi.fn()}
        onSpeedChange={vi.fn()}
        onModeChange={vi.fn()}
        onViewOptionChange={vi.fn()}
      />,
    )
    const disclosure = container.querySelector<HTMLDetailsElement>('.view-options-disclosure')

    expect(disclosure?.open).toBe(false)
    expect(disclosure?.querySelector('summary')?.textContent).toContain('Display')
    expect(container.querySelectorAll('.view-toggles-mobile input')).toHaveLength(5)
    expect(container.querySelectorAll('.view-toggles-desktop input')).toHaveLength(5)
    expect(container.querySelector('[aria-label="Reset animation"]')?.getAttribute('title')).toBe('Reset animation')

    unmount()
  })

  it('renders one focus entry point in the graph header and no fullscreen entry point', () => {
    const html = renderToStaticMarkup(<MatrixMotionLab embedded />)

    expect(html).toContain('Focus')
    expect(html).not.toContain('Fullscreen')
    expect(html).toContain('visualization-header-focus-toggle')
  })

  it('keeps default vectors visible when the first matrix input changes to R3', async () => {
    type AppState = ReturnType<typeof useAppState>
    let latest: AppState | null = null
    const readState = (): AppState => {
      expect(latest).toBeTruthy()
      return latest as AppState
    }
    const { container, unmount } = render(<AppStateHarness onState={(state) => { latest = state }} />)

    expect(readState().vectors.map((vector) => vector.dim)).toEqual([2, 2])
    await click(getButton(container, 'Make first map 3D'))

    expect(readState().inputDim).toBe(3)
    expect(readState().vectors.map((vector) => vector.dim)).toEqual([3, 3])
    expect(readState().vectors.map((vector) => vector.values.length)).toEqual([3, 3])

    unmount()
  })
})

function WorkbenchHarness({
  onTogglePlay = vi.fn(),
  inspectorAction,
}: {
  onTogglePlay?: () => void
  inspectorAction?: ReactElement
}) {
  const panels: OverlayPanelDefinition[] = [
    { id: 'matrices', title: 'Matrices', content: <p>Matrix Panel</p>, side: 'left' },
    { id: 'vectors', title: 'Vectors', content: <p>Vector Panel</p>, side: 'left' },
  ]

  return (
    <VisualizationWorkbench
      title="Workbench"
      subtitle="Test workbench"
      labels={labels}
      leftPanel={<p>Left Panel</p>}
      stage={<input aria-label="Editable field" />}
      stageActions={(
        <>
          <LessonStageActions
            graphLabel="Graph notes"
            onGraphHelp={vi.fn()}
            focusButton={<button type="button">Focus</button>}
            exportLabel="Export"
            onExport={vi.fn()}
          />
        </>
      )}
      rightPanel={<p>Right Panel</p>}
      transport={<button type="button">Transport</button>}
      overlayPanels={panels}
      inspectorAction={inspectorAction}
      shortcutActions={{ togglePlay: onTogglePlay }}
    />
  )
}

function LessonScaffoldHarness() {
  return (
    <LessonScaffold
      controls={<p>Lesson Controls</p>}
      eyebrow="Explorer"
      title="Lesson"
      stage={<div>Lesson Stage</div>}
      stageActions={(
        <LessonStageActions
          graphLabel="Graph notes"
          onGraphHelp={vi.fn()}
          focusButton={<button type="button">Focus</button>}
          exportLabel="Export"
          onExport={vi.fn()}
        />
      )}
      explanation={<p>Lesson Readout</p>}
    />
  )
}

function ResizeHarness({ onResize }: { onResize: (rect: DOMRectReadOnly) => void }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useResizeObserver(ref, onResize)
  return <div ref={ref} />
}

function AppStateHarness({ onState }: { onState: (state: ReturnType<typeof useAppState>) => void }) {
  const state = useAppState()
  onState(state)
  return (
    <button
      type="button"
      onClick={() =>
        state.updateMap(state.maps[0].id, (map) => ({
          ...map,
          inputDim: 3,
          outputDim: 3,
          matrix: identityMatrix(3),
        }))
      }
    >
      Make first map 3D
    </button>
  )
}

function render(ui: ReactElement): { container: HTMLElement; root: Root; unmount: () => void } {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(ui))
  return {
    container,
    root,
    unmount: () => act(() => root.unmount()),
  }
}

async function click(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

function pressKey(target: EventTarget, key: string): void {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

function getButton(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === text)
  expect(button).toBeTruthy()
  return button as HTMLButtonElement
}

function getWorkbench(container: HTMLElement): HTMLElement {
  const workbench = container.querySelector('.visualization-workbench')
  expect(workbench).toBeTruthy()
  return workbench as HTMLElement
}
