import { useCallback, useEffect, useState } from "react";
import { codegenTargetsApi, type CodegenTarget, type ScanResult } from "../../api/codegenTargets";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({ isOpen, onClose }: ProjectSettingsModalProps) {
  const [projectRoot, setProjectRoot] = useState("");
  const [targetSubpath, setTargetSubpath] = useState("apps/web/src/pages/generated");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTarget, setExistingTarget] = useState<CodegenTarget | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Load existing targets for the current page on mount
  const loadExisting = useCallback(async () => {
    const pageId = localStorage.getItem("eraowl-current-page-id");
    if (!pageId) return;

    try {
      const targets = await codegenTargetsApi.list(pageId);
      if (targets.length > 0) {
        const target = targets[0]!;
        setExistingTarget(target);
        setProjectRoot(target.project_root);
        setTargetSubpath(target.target_subpath);
        if (target.framework_detected) {
          setScanResult({
            framework_detected: target.framework_detected,
            component_style: "PascalCase + named export",
          });
        }
      }
    } catch {
      // silently fail — user can create a new target
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadExisting();
      // Reset form state
      setError(null);
      setScanResult(null);
    }
  }, [isOpen, loadExisting]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    const pageId = localStorage.getItem("eraowl-current-page-id");
    if (!pageId) {
      setError("No page selected. Please save the page first.");
      setSaving(false);
      return;
    }

    if (!projectRoot.trim()) {
      setError("Project Root Path is required.");
      setSaving(false);
      return;
    }

    if (!targetSubpath.trim()) {
      setError("Target Subpath is required.");
      setSaving(false);
      return;
    }

    try {
      let target: CodegenTarget;

      if (existingTarget) {
        // In a real app we'd PATCH the existing target; for now delete and recreate
        await codegenTargetsApi.delete(existingTarget.id);
      }

      // Create the target
      target = await codegenTargetsApi.create({
        page_id: pageId,
        project_root: projectRoot.trim(),
        target_subpath: targetSubpath.trim(),
      });

      setExistingTarget(target);
      setSaving(false);

      // Automatically scan after saving
      await handleScan(target.id);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Failed to save project settings.");
    }
  };

  const handleScan = async (targetId?: string) => {
    const id = targetId ?? existingTarget?.id;
    if (!id) {
      setError("No target to scan. Save the target first.");
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const result = await codegenTargetsApi.scan(id);
      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan project.");
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setScanResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const isBusy = saving || scanning;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-overlay" onClick={handleClose} />

      {/* Modal */}
      <div className="modal-container" role="dialog" aria-modal="true" aria-label="Project Settings">
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Project Settings</h2>
          <button className="modal-close-btn" onClick={handleClose} disabled={isBusy}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Configure the target project where generated code will be written.
            The scanner will detect the framework and conventions of the target
            project to match existing code style.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="project-root">
              Project Root Path
            </label>
            <input
              id="project-root"
              className="form-input"
              type="text"
              value={projectRoot}
              onChange={(e) => setProjectRoot(e.target.value)}
              placeholder="/u01/eraowl-ops"
              disabled={isBusy}
            />
            <span className="form-hint">
              Absolute path to the target project root directory
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="target-subpath">
              Target Subpath
            </label>
            <input
              id="target-subpath"
              className="form-input"
              type="text"
              value={targetSubpath}
              onChange={(e) => setTargetSubpath(e.target.value)}
              placeholder="apps/web/src/pages/generated"
              disabled={isBusy}
            />
            <span className="form-hint">
              Subdirectory under project root where generated files will be placed
            </span>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="scan-result-box">
              <div className="scan-result-header">Scan Results</div>
              <div className="scan-result-row">
                <span className="scan-result-label">Framework:</span>
                <span className="scan-result-value">
                  {scanResult.framework_detected || "Unknown"}
                </span>
              </div>
              <div className="scan-result-row">
                <span className="scan-result-label">Component Style:</span>
                <span className="scan-result-value">
                  {scanResult.component_style}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="form-btn form-btn--secondary" onClick={handleClose} disabled={isBusy}>
            Cancel
          </button>

          {existingTarget && (
            <button
              className="form-btn form-btn--secondary"
              onClick={() => handleScan()}
              disabled={isBusy || !existingTarget.id}
            >
              {scanning ? "🔄 Scanning..." : "🔍 Re-scan"}
            </button>
          )}

          <button
            className="form-btn form-btn--primary"
            onClick={handleSave}
            disabled={isBusy}
          >
            {saving ? "💾 Saving..." : existingTarget ? "💾 Update & Scan" : "💾 Save & Scan"}
          </button>
        </div>
      </div>
    </>
  );
}
