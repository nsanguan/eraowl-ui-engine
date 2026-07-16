import { useRef, useState, useCallback, useEffect, type ReactNode, type UIEvent } from 'react'

interface ScrollBarProps {
  id?: string
  type?: "scrollBar" | "ScrollBar"
  /** Scroll direction: "vertical" (default) or "horizontal" */
  orientation?: "vertical" | "horizontal"
  /** Height for vertical orientation (e.g. "300px", "100%") */
  height?: string
  /** Width for horizontal orientation (e.g. "100%", "500px") */
  width?: string
  /** Show scrollbar only when content overflows */
  autoHide?: boolean
  /** Thickness class: "thin" (default) or "auto" (browser default) */
  thickness?: "thin" | "auto"
  templateOptions?: Record<string, string | boolean | number>
  children?: ReactNode
  [key: string]: unknown
}

export function ScrollBar({
  id,
  orientation = "vertical",
  height = "300px",
  width = "100%",
  autoHide = false,
  thickness = "thin",
  children,
}: ScrollBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPos, setScrollPos] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const isVertical = orientation === "vertical"

  const updateScrollMetrics = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (isVertical) {
      setScrollPos(el.scrollTop)
      setMaxScroll(el.scrollHeight - el.clientHeight)
    } else {
      setScrollPos(el.scrollLeft)
      setMaxScroll(el.scrollWidth - el.clientWidth)
    }
  }, [isVertical])

  useEffect(() => {
    updateScrollMetrics()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollMetrics)
    const ro = new ResizeObserver(updateScrollMetrics)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollMetrics)
      ro.disconnect()
    }
  }, [updateScrollMetrics])

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const track = e.currentTarget
    const rect = track.getBoundingClientRect()
    const clickPos = isVertical
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width
    const target = scrollRef.current
    if (!target) return
    const moveTo = clickPos * maxScroll
    if (isVertical) {
      target.scrollTop = moveTo
    } else {
      target.scrollLeft = moveTo
    }
  }, [isVertical, maxScroll])

  const thumbSize = maxScroll > 0
    ? Math.max(30, (isVertical
        ? (scrollRef.current?.clientHeight ?? 300)
        : (scrollRef.current?.clientWidth ?? 300)) / ((scrollRef.current?.scrollHeight ?? 300) / (scrollRef.current?.clientHeight ?? 300) + 1))
    : 0
  const thumbPos = maxScroll > 0 ? (scrollPos / maxScroll) * 100 : 0

  const containerStyle: React.CSSProperties = isVertical
    ? { height, width, overflow: 'hidden', position: 'relative', display: 'flex' }
    : { width, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }

  const scrollStyle: React.CSSProperties = isVertical
    ? {
        overflowY: autoHide ? 'auto' : 'scroll',
        overflowX: 'hidden',
        flex: 1,
        scrollbarWidth: thickness,
      }
    : {
        overflowX: autoHide ? 'auto' : 'scroll',
        overflowY: 'hidden',
        flex: 1,
        scrollbarWidth: thickness,
      }

  const trackStyle: React.CSSProperties = isVertical
    ? { width: 10, background: 'var(--eut-color-surface, #e2e8f0)', borderRadius: 5, marginLeft: 4, cursor: 'pointer', flexShrink: 0 }
    : { height: 10, background: 'var(--eut-color-surface, #e2e8f0)', borderRadius: 5, marginTop: 4, cursor: 'pointer', flexShrink: 0 }

  const thumbStyle: React.CSSProperties = isVertical
    ? {
        width: '100%',
        height: thumbSize,
        borderRadius: 5,
        background: 'var(--eut-color-primary, #6366f1)',
        opacity: 0.7,
        transform: `translateY(${thumbPos}%)`,
        transition: isDragging ? 'none' : 'opacity 0.2s',
        cursor: 'grab',
      }
    : {
        height: '100%',
        width: thumbSize,
        borderRadius: 5,
        background: 'var(--eut-color-primary, #6366f1)',
        opacity: 0.7,
        transform: `translateX(${thumbPos}%)`,
        transition: isDragging ? 'none' : 'opacity 0.2s',
        cursor: 'grab',
      }

  return (
    <div
      id={id}
      data-eut-component="scrollBar"
      data-orientation={orientation}
      className="eut-scrollbar"
      style={containerStyle}
    >
      <div
        ref={scrollRef}
        className="eut-scrollbar__viewport"
        style={scrollStyle}
      >
        {children}
      </div>
      <div
        className="eut-scrollbar__track"
        style={trackStyle}
        onClick={handleTrackClick}
      >
        <div
          className="eut-scrollbar__thumb"
          style={thumbStyle}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        />
      </div>
    </div>
  )
}
