import { useStore } from "zustand";
import { useUIStore } from "../../store/useUIStore";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import { useState } from "react";

export function DesignerToolbar() {
  const pageTitle = useUIStore((s) => s.pageTitle);
  const setPageTitle = useUIStore((s) => s.setPageTitle);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const setCanvasZoom = useUIStore((s) => s.setCanvasZoom);
  const showGrid = useUIStore((s) => s.showGrid);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const components = useUIStore((s) => s.components);
  const saveLayout = useUIStore((s) => s.saveLayout);

  const [showProjectSettings, setShowProjectSettings] = useState(false);

  const undo = () => useUIStore.temporal.getState().undo();
  const redo = () => useUIStore.temporal.getState().redo();
  const pastStates = useStore(useUIStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useUIStore.temporal, (s) => s.futureStates);

  const handlePreview = () => {
    const layout = {
      version: "1.0",
      components,
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleSave = () => {
    saveLayout();
  };

  const zoomIn = () => setCanvasZoom(Math.min(canvasZoom + 0.1, 2));
  const zoomOut = () => setCanvasZoom(Math.max(canvasZoom - 0.1, 0.3));
  const zoomReset = () => setCanvasZoom(1);

  return (
    <div className="designer-toolbar">
      <h1 className="designer-toolbar__title">
        <input
          className="designer-toolbar__title-input"
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
          placeholder="Page name..."
        />
      </h1>

      <div className="designer-toolbar__divider" />

      <div className="designer-toolbar__actions">
        <button
          className="designer-toolbar__btn"
          onClick={undo}
          disabled={pastStates.length === 0}
          title="Undo"
        >
          ↶
        </button>
        <button
          className="designer-toolbar__btn"
          onClick={redo}
          disabled={futureStates.length === 0}
          title="Redo"
        >
          ↷
        </button>

        <div className="designer-toolbar__divider" />

        <div className="designer-toolbar__zoom">
          <button
            className="designer-toolbar__btn"
            onClick={zoomOut}
            title="Zoom out"
          >
            −
          </button>
          <span className="designer-toolbar__zoom-value">
            {Math.round(canvasZoom * 100)}%
          </span>
          <button
            className="designer-toolbar__btn"
            onClick={zoomIn}
            title="Zoom in"
          >
            +
          </button>
          <button
            className="designer-toolbar__btn"
            onClick={zoomReset}
            title="Reset zoom"
          >
            ⊙
          </button>
        </div>

        <div className="designer-toolbar__divider" />

        <button
          className="designer-toolbar__btn"
          onClick={toggleGrid}
          title="Toggle grid"
          style={showGrid ? { background: "var(--eut-color-border)" } : undefined}
        >
          ▦ Grid
        </button>

        <div className="designer-toolbar__divider" />

        <button
          className="designer-toolbar__btn"
          onClick={() => setShowProjectSettings(true)}
          title="Configure target project integration"
        >
          ⚙️ Project Settings
        </button>

        <div className="designer-toolbar__divider" />

        <button
          className="designer-toolbar__btn"
          onClick={handlePreview}
          title="Preview in new tab"
        >
          ▶ Preview
        </button>
        <button
          className="designer-toolbar__btn designer-toolbar__btn--primary"
          onClick={handleSave}
          title="Save layout_json"
        >
          💾 Save
        </button>
      </div>

      <ProjectSettingsModal
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
      />
    </div>
  );
}
