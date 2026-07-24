import React from "react";
import { Satellite } from "lucide-react";

export default function LoadingScreen({ message = "INITIALIZING GROUND CONTROL" }) {
  return (
    <div
      data-testid="loading-screen"
      className="min-h-screen flex items-center justify-center bg-[#0B0F19]"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
          <div
            className="rounded-full p-6 border border-cyan-400/40 bg-[#131B2B]"
            style={{ animation: "spin-slow 6s linear infinite" }}
          >
            <Satellite className="h-10 w-10 text-cyan-400" strokeWidth={1.5} />
          </div>
        </div>
        <div className="text-center">
          <div className="font-orbitron text-cyan-400 tracking-widest text-sm glow-cyan">
            {message}
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono-tab">
            CANSAT-2026 · AEROTECH MISSION CONTROL
          </div>
        </div>
        <div className="w-56 h-1 bg-[#131B2B] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400"
            style={{ animation: "spin-slow 1.5s linear infinite", width: "40%" }}
          />
        </div>
      </div>
    </div>
  );
}
