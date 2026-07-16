interface CommentsProps {
  id?: string
  type?: "comments" | "Comments"
  items?: Array<{ author: string; avatar?: string; text: string; timestamp?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Comments({ id, items = [] }: CommentsProps) {
  return (
    <div id={id} data-eut-component="comments" className="eut-comments">
      {items.map((item, i) => (
        <div key={i} className="eut-comments__item">
          {item.avatar && <img src={item.avatar} alt={item.author} className="eut-comments__avatar" />}
          <div className="eut-comments__body">
            <strong className="eut-comments__author">{item.author}</strong>
            {item.timestamp && <span className="eut-comments__time">{item.timestamp}</span>}
            <p className="eut-comments__text">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
