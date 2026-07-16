interface AvatarProps {
  id?: string
  type?: "avatar" | "Avatar"
  src?: string
  initials?: string
  size?: "sm" | "md" | "lg" | "xl"
  shape?: "circle" | "square" | "rounded"
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Avatar({ id, src, initials, size = "md", shape = "circle" }: AvatarProps) {
  const classes = `eut-avatar eut-avatar--${size} eut-avatar--${shape}`

  if (src) {
    return <img id={id} data-eut-component="avatar" className={classes} src={src} alt={initials ?? "avatar"} />
  }

  return (
    <div id={id} data-eut-component="avatar" className={classes} aria-label={initials ?? "Avatar"}>
      {initials && <span className="eut-avatar__initials">{initials}</span>}
    </div>
  )
}
