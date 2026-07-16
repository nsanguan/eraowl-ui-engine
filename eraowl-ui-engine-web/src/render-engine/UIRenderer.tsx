import { useMemo } from 'react'
import { componentRegistry } from './registry/componentRegistry'
import type { LayoutJson, Component } from './types'

const CONTAINER_TYPES = new Set([
  'region',
  'gridrow',
  'gridcolumn',
  'card',
])

interface UIRendererProps {
  layout: LayoutJson
  resolveBaseUrl?: string
  token?: string
  onValidSubmit?: (payload: Record<string, unknown>) => void
  registry?: Record<string, React.ComponentType<Record<string, unknown>>>
}

function renderComponent(comp: Component, registry: Record<string, React.ComponentType<Record<string, unknown>>>): React.ReactNode {
  const Component = registry[String(comp.type).toLowerCase()]
  if (!Component) {
    return <div key={comp.id}>Unknown: {comp.type}</div>
  }

  const isContainer = CONTAINER_TYPES.has(String(comp.type).toLowerCase())
  const children = isContainer && Array.isArray((comp as unknown as { components?: Component[] }).components)
    ? (comp as unknown as { components: Component[] }).components.map((child) => renderComponent(child, registry))
    : undefined

  return <Component key={comp.id} {...comp} children={children} />
}

export function UIRenderer({
  layout,
  registry = componentRegistry,
}: UIRendererProps) {
  const renderedRegions = useMemo(() => {
    return layout.regions.map((region) => {
      return (
        <div key={region.id} data-eowl-region={region.id}>
          {region.components.map((comp: Component) => renderComponent(comp, registry))}
        </div>
      )
    })
  }, [layout, registry])

  return <div data-eowl-renderer="">{renderedRegions}</div>
}
