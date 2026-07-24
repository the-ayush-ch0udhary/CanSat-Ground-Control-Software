import React from "react";

const LEVEL_STYLE = {
  info: "text-cyan-300",
  success: "text-emerald-400",
  warning: "text-orange-300",
  critical: "text-red-400",
};

export default function MissionLog({ logs }) {
  return (
    <div data-testid="mission-log" className="p-3 h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-auto rounded-md border border-white/5 bg-[#0F1623]/60">
        {logs.length === 0 && (
          <div className="p-4 text-center text-[11px] text-gray-500 font-mono-tab">
            No log entries yet.
          </div>
        )}
        {logs.map((l) => (
          <div
            key={l.id}
            data-testid="log-entry"
            className="px-3 py-1.5 border-b border-white/5 last:border-b-0 flex items-start gap-2 text-[10px] font-mono-tab"
          >
            <span className="text-gray-500 shrink-0">{l.ts.toTimeString().slice(0, 8)}</span>
            <span className={`shrink-0 uppercase font-orbitron tracking-widest ${LEVEL_STYLE[l.level] || "text-gray-300"}`}>
              {l.level}
            </span>
            <span className="text-gray-200 truncate">{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
