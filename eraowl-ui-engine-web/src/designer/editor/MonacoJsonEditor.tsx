import { useRef, useEffect } from "react";

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export function MonacoJsonEditor({
  value,
  onChange,
  height = "400px",
}: MonacoJsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: initialize Monaco editor instance
    // For now, render a textarea as a placeholder
  }, []);

  return (
    <div className="eods-monaco-editor" ref={containerRef} style={{ height }}>
      <textarea
        className="eods-monaco-editor__fallback"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: "100%", fontFamily: "monospace" }}
      />
    </div>
  );
}
