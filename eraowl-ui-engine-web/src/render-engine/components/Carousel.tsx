interface CarouselProps {
  id?: string
  type?: "carousel" | "Carousel"
  items?: Array<{ title?: string; content?: string; image?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Carousel({ id, items = [] }: CarouselProps) {
  return (
    <div id={id} data-eut-component="carousel" className="eut-carousel">
      <div className="eut-carousel__track">
        {items.map((item, i) => (
          <div key={i} className="eut-carousel__slide">
            {item.image && <img src={item.image} alt={item.title ?? ''} className="eut-carousel__img" />}
            {item.title && <h3 className="eut-carousel__title">{item.title}</h3>}
            {item.content && <p className="eut-carousel__content">{item.content}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
