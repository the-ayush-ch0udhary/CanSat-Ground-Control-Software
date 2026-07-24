import { useEffect } from "react";

/**
 * useKeyboardShortcuts:
 *   Space: start/stop telemetry
 *   R: reset mission (with confirmation via callback)
 *   E: export CSV
 *   C: reset packet counter
 */
export function useKeyboardShortcuts({ onToggle, onReset, onExport, onCounterReset }) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore when typing in inputs
      const tag = (e.target?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

      if (e.code === "Space") {
        e.preventDefault();
        onToggle && onToggle();
      } else if (e.key === "r" || e.key === "R") {
        onReset && onReset();
      } else if (e.key === "e" || e.key === "E") {
        onExport && onExport();
      } else if (e.key === "c" || e.key === "C") {
        onCounterReset && onCounterReset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onToggle, onReset, onExport, onCounterReset]);
}
