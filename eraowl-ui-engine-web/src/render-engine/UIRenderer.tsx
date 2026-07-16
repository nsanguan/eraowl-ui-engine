import { useMemo } from 'react'
import { componentRegistry } from './registry/componentRegistry'
import type { LayoutJson, Component } from './types'

interface UIRendererProps {
  layout: LayoutJson
  resolveBaseUrl?: string
  token?: string
  onValidSubmit?: (payload: Record<string, unknown>) => void
  registry?: Record<string, React.ComponentType<Record<string, unknown>>>
}

export function UIRenderer({
  layout,
  registry = componentRegistry,
}: UIRendererProps) {
  const renderedRegions = useMemo(() => {
    return layout.regions.map((region) => {
      return (
        <div key={region.id} data-eowl-region={region.id}>
          {region.components.map((comp: Component) => {
            const Component = registry[comp.type]
            if (!Component) {
              return <div key={comp.id}>Unknown: {comp.type}</div>
            }
            return <Component key={comp.id} {...comp} />
          })}
        </div>
      )
    })
  }, [layout, registry])

  return <div data-eowl-renderer="">{renderedRegions}</div>
}
