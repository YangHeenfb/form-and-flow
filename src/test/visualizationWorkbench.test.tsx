import { act, useRef, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { identityMatrix } from '../math/matrix.ts'
import { MatrixMotionLab } from '../modules/matrix/MatrixMotionLab.tsx'
import { useResizeObserver } from '../platform/useElementSize.ts'
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

function WorkbenchHarness({ onTogglePlay = vi.fn() }: { onTogglePlay?: () => void }) {
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
      rightPanel={<p>Right Panel</p>}
      transport={<button type="button">Transport</button>}
      overlayPanels={panels}
      shortcutActions={{ togglePlay: onTogglePlay }}
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
