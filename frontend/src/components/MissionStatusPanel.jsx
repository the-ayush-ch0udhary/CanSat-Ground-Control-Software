import React from "react";
import { Rocket, TrendingUp, CircleDot, Split, Wind, Anchor, PackageCheck, Power } from "lucide-react";
import { PHASES } from "@/utils/telemetrySim";

const PHASE_META = {
  IDLE: { icon: Power, color: "text-gray-400", ring: "ring-gray-400/40", bg: "bg-gray-400/10", label: "IDLE" },
  LAUNCH: { icon: Rocket, color: "text-orange-400", ring: "ring-orange-400/40", bg: "bg-orange-400/10", label: "LAUNCH" },
  ASCENT: { icon: TrendingUp, color: "text-cyan-400", ring: "ring-cyan-400/40", bg: "bg-cyan-400/10", label: "ASCENT" },
  APOGEE: { icon: CircleDot, color: "text-yellow-300", ring: "ring-yellow-300/40", bg: "bg-yellow-300/10", label: "APOGEE" },
  SEPARATION: { icon: Split, color: "text-fuchsia-400", ring: "ring-fuchsia-400/40", bg: "bg-fuchsia-400/10", label: "SEPARATION" },
  DESCENT: { icon: Wind, color: "text-blue-400", ring: "ring-blue-400/40", bg: "bg-blue-400/10", label: "DESCENT" },
  LANDING: { icon: Anchor, color: "text-emerald-400", ring: "ring-emerald-400/40", bg: "bg-emerald-400/10", label: "LANDING" },
  RECOVERY: { icon: PackageCheck, color: "text-green-500", ring: "ring-green-500/40", bg: "bg-green-500/10", label: "RECOVERY" },
};

export default function MissionStatusPanel({ currentPhase = "IDLE" }) {
  const currentIdx = PHASES.indexOf(currentPhase);
  return (
    <div data-testid="mission-status-panel" className="p-4">
      <div className="flex flex-col gap-2">
        {PHASES.map((p, i) => {
          const meta = PHASE_META[p];
          const Icon = meta.icon;
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div
              key={p}
              data-testid={`phase-${p.toLowerCase()}`}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md border transition-colors",
                isActive
                  ? `border-white/10 ${meta.bg} ring-1 ${meta.ring}`
                  : isDone
                  ? "border-white/5 bg-white/[0.02]"
                  : "border-white/5 bg-transparent opacity-60",
              ].join(" ")}
            >
              <div
                className={[
                  "p-1.5 rounded-md border",
                  isActive ? `${meta.color} border-white/10` : isDone ? "text-emerald-500 border-white/10" : "text-gray-500 border-white/5",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div
                  className={[
                    "font-orbitron text-xs tracking-[0.18em]",
                    isActive ? meta.color : isDone ? "text-emerald-400/80" : "text-gray-400",
                  ].join(" ")}
                >
                  {meta.label}
                </div>
                <div className="text-[10px] font-mono-tab text-gray-500">
                  Phase {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              {isActive && <span className="pulse-dot on" />}
              {isDone && (
                <span className="text-[10px] font-mono-tab text-emerald-400/80">DONE</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
