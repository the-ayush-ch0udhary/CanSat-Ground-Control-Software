import React from "react";
import { CircleDot } from "lucide-react";

const CONFIG = [
  { label: "Descent Rate", ok: "OK", bad: "Fault" },
  { label: "GPS", ok: "Available", bad: "Lost" },
  { label: "Separation", ok: "Success", bad: "Failure" },
  { label: "Parachute", ok: "Inactive", bad: "Activated" },
];

export default function ErrorCodePanel({ errorCode = "0000" }) {
  const digits = (errorCode || "0000").padStart(4, "0").split("").slice(0, 4);
  return (
    <div data-testid="error-code-panel" className="p-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-orbitron">
          4-Digit Error Code
        </div>
        <div
          data-testid="error-code-value"
          className={`font-orbitron text-lg tracking-widest ${errorCode === "0000" ? "text-emerald-400 glow-green" : "text-red-400 glow-red"}`}
        >
          {digits.join("")}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {CONFIG.map((c, i) => {
          const isOk = digits[i] === "0";
          return (
            <div
              key={c.label}
              data-testid={`err-digit-${i}`}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#0F1623] border border-white/5"
            >
              <div className="flex items-center gap-2">
                <span className={isOk ? "pulse-dot on" : "pulse-dot crit"} />
                <span className="text-[11px] text-gray-300 font-mono-tab">{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-[10px] tracking-widest text-gray-500">
                  D{i + 1}
                </span>
                <span
                  className={`font-orbitron text-[11px] tracking-widest ${isOk ? "text-emerald-400" : "text-red-400"}`}
                >
                  {isOk ? c.ok.toUpperCase() : c.bad.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
