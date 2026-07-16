import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UIRenderer } from '../UIRenderer'
import type { LayoutJson } from '../types'

vi.mock('../../store/useRenderStore', () => ({
  useRenderStore: Object.assign(
    (selector: (s: unknown) => unknown) => selector({ formValues: {}, touched: {}, errors: {}, submitState: 'idle' }),
    { getState: () => ({ formValues: {}, touched: {}, errors: {}, submitState: 'idle', setFieldValue: vi.fn(), setFieldTouched: vi.fn(), setErrors: vi.fn(), setSubmitState: vi.fn(), reset: vi.fn(), broadcast: vi.fn() }) }
  ),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: { items: [] }, isLoading: false, error: null })),
}))

const TestComponent = (props: Record<string, unknown>) => (
  <div data-testid={`test-${props.id as string}`}>Component {props.id as string}</div>
)

const customRegistry: Record<string, React.ComponentType<Record<string, unknown>>> = {
  region: TestComponent,
  lov: TestComponent,
  lov_select: TestComponent,
}

const mockLayout = {
  schemaVersion: '1.0.0' as const,
  regions: [
    {
      id: 'region-1',
      title: 'Region One',
      components: [
        { id: 'comp-1', type: 'region', position: { x: 0, y: 0, width: 100, height: 40 } },
        { id: 'comp-2', type: 'lov', position: { x: 0, y: 40, width: 100, height: 40 } },
      ],
    },
    {
      id: 'region-2',
      title: 'Region Two',
      components: [
        { id: 'comp-3', type: 'lov_select', position: { x: 0, y: 0, width: 100, height: 40 } },
      ],
    },
  ],
} as unknown as LayoutJson

describe('UIRenderer', () => {
  it('renders all regions from layout json', () => {
    const { container } = render(<UIRenderer layout={mockLayout} />)
    const regionDivs = container.querySelectorAll('[data-eowl-region]')
    expect(regionDivs).toHaveLength(2)
    expect(regionDivs[0]?.getAttribute('data-eowl-region')).toBe('region-1')
    expect(regionDivs[1]?.getAttribute('data-eowl-region')).toBe('region-2')
  })

  it('renders unknown component fallback for unregistered types', () => {
    const layoutWithUnknown = {
      schemaVersion: '1.0.0' as const,
      regions: [{
        id: 'r1',
        title: 'Test',
        components: [
          { id: 'unknown-1', type: 'region', position: { x: 0, y: 0, width: 100, height: 40 } },
        ],
      }],
    } as unknown as LayoutJson
    render(
      <UIRenderer
        layout={layoutWithUnknown}
        registry={{ region: TestComponent }}
      />
    )
    expect(screen.getByText('Component unknown-1')).toBeDefined()
  })

  it('uses custom registry when provided', () => {
    render(<UIRenderer layout={mockLayout} registry={customRegistry} />)
    expect(screen.getByTestId('test-comp-1')).toBeDefined()
    expect(screen.getByTestId('test-comp-2')).toBeDefined()
    expect(screen.getByTestId('test-comp-3')).toBeDefined()
  })

  it('renders empty regions', () => {
    const emptyLayout = {
      schemaVersion: '1.0.0' as const,
      regions: [{
        id: 'r-empty',
        title: 'Empty',
        components: [],
      }],
    } as unknown as LayoutJson
    const { container } = render(<UIRenderer layout={emptyLayout} />)
    expect(container.querySelector('[data-eowl-region="r-empty"]')).toBeDefined()
  })

  it('renders components in correct region order', () => {
    const layout = {
      schemaVersion: '1.0.0' as const,
      regions: [
        {
          id: 'region-a',
          title: 'A',
          components: [
            { id: 'first', type: 'region', position: { x: 0, y: 0, width: 100, height: 40 } },
          ],
        },
        {
          id: 'region-b',
          title: 'B',
          components: [
            { id: 'second', type: 'region', position: { x: 0, y: 0, width: 100, height: 40 } },
          ],
        },
      ],
    } as unknown as LayoutJson
    const orderRegistry: Record<string, React.ComponentType<Record<string, unknown>>> = {
      region: ({ id }: Record<string, unknown>) => <span data-testid={`span-${id as string}`}>{id as string}</span>,
    }
    render(<UIRenderer layout={layout} registry={orderRegistry} />)
    const spans = screen.getAllByTestId(/^span-/)
    expect(spans).toHaveLength(2)
    expect(spans[0]).toHaveTextContent('first')
    expect(spans[1]).toHaveTextContent('second')
  })

  it('shows fallback for component type not in registry', () => {
    const layout = {
      schemaVersion: '1.0.0' as const,
      regions: [{
        id: 'r1',
        title: 'Test',
        components: [
          { id: 'bad', type: 'region', position: { x: 0, y: 0, width: 100, height: 40 } },
        ],
      }],
    } as unknown as LayoutJson
    const emptyRegistry: Record<string, React.ComponentType<Record<string, unknown>>> = {}
    render(<UIRenderer layout={layout} registry={emptyRegistry} />)
    expect(screen.getByText('Unknown: region')).toBeDefined()
  })

  it('wraps rendered regions in a container with data-eowl-renderer', () => {
    const { container } = render(<UIRenderer layout={mockLayout} />)
    expect(container.querySelector('[data-eowl-renderer]')).toBeDefined()
  })
})
