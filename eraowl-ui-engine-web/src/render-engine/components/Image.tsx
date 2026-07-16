interface ImageProps {
  id?: string;
  type?: "image" | "Image";
  src?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Image({ id, src, alt, width, height, templateOptions }: ImageProps) {
  return (
    <div
      id={id}
      data-eut-component="image"
      className="eut-image"
    >
      <img
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        className="eut-image__img"
      />
    </div>
  );
}
