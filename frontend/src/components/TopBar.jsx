import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Download,
  RotateCcw,
  Timer,
  Satellite,
  Radio,
  Clock,
  Moon,
  Sun,
} from "lucide-react";
import { formatMissionTime, formatClock, formatDate } from "@/utils/format";
import SettingsPanel from "@/components/SettingsPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TopBar({
  missionId,
  missionTime,
  packetCount,
  connected,
  running,
  onStart,
  onStop,
  onExport,
  onResetCounter,
  onResetMission,
  autoFollow,
  setAutoFollow,
  onSyncPCTime,
  nightMode,
  onToggleTheme,
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur border-b border-white/5">
      <div className="px-4 py-2 flex items-center gap-4">
        {/* Left: brand + mission */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md border border-cyan-400/30 bg-[#131B2B]">
            <Satellite className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="font-orbitron text-[13px] tracking-widest text-white leading-tight">
              CANSAT<span className="text-cyan-400">-2026</span>{" "}
              <span className="text-gray-500">·</span>{" "}
              <span className="text-gray-300">AEROTECH</span>
            </div>
            <div
              data-testid="topbar-mission-id"
              className="text-[10px] text-gray-500 font-mono-tab truncate"
            >
              MISSION: {missionId}
            </div>
          </div>
        </div>

        {/* Center: stats */}
        <div className="hidden md:flex items-center gap-3">
          <StatChip
            testId="topbar-mission-time"
            label="MET"
            value={formatMissionTime(missionTime)}
            icon={Timer}
            color="text-cyan-300"
          />
          <StatChip
            testId="topbar-packet-count"
            label="PACKETS"
            value={String(packetCount).padStart(5, "0")}
            icon={Radio}
            color="text-emerald-400"
          />
          <StatChip
            testId="topbar-clock"
            label={formatDate(now)}
            value={formatClock(now)}
            icon={Clock}
            color="text-white"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-[#131B2B]">
            <span className={connected ? "pulse-dot on" : "pulse-dot off"} />
            <span
              data-testid="topbar-connection-status"
              className={`font-orbitron text-[10px] tracking-widest ${connected ? "text-emerald-400" : "text-gray-500"}`}
            >
              {connected ? "LINK · OK" : "LINK · OFF"}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {!running ? (
            <Button
              data-testid="start-telemetry-btn"
              size="sm"
              onClick={onStart}
              className="h-7 bg-emerald-500 hover:bg-emerald-400 text-[#0B0F19] font-orbitron text-[10px] tracking-widest shadow-[0_0_18px_rgba(16,185,129,0.35)]"
            >
              <Play className="h-3 w-3 mr-1" /> START
            </Button>
          ) : (
            <Button
              data-testid="stop-telemetry-btn"
              size="sm"
              onClick={onStop}
              className="h-7 bg-red-500 hover:bg-red-400 text-white font-orbitron text-[10px] tracking-widest"
            >
              <Square className="h-3 w-3 mr-1" /> STOP
            </Button>
          )}

          <Button
            data-testid="topbar-export-csv-btn"
            size="sm"
            variant="outline"
            onClick={onExport}
            className="h-7 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10 font-orbitron text-[10px] tracking-widest"
          >
            <Download className="h-3 w-3 mr-1" /> CSV
          </Button>

          <Button
            data-testid="topbar-reset-counter-btn"
            size="sm"
            variant="outline"
            onClick={onResetCounter}
            className="h-7 border-white/10 bg-transparent text-orange-300 hover:bg-orange-500/10 font-orbitron text-[10px] tracking-widest"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> RESET CNT
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-testid="topbar-reset-mission-btn"
                size="sm"
                variant="outline"
                className="h-7 border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10 font-orbitron text-[10px] tracking-widest"
              >
                RESET MISSION
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#131B2B] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-orbitron tracking-widest text-red-300">
                  RESET MISSION?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400 text-sm">
                  This will stop telemetry, clear packet history, and generate a new mission ID.
                  Locally stored packets will be cleared.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  data-testid="reset-mission-cancel-btn"
                  className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-testid="reset-mission-confirm-btn"
                  onClick={onResetMission}
                  className="bg-red-500 hover:bg-red-400 text-white font-orbitron tracking-widest"
                >
                  Confirm Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            data-testid="topbar-sync-time-btn"
            size="sm"
            variant="outline"
            onClick={onSyncPCTime}
            className="h-7 border-white/10 bg-transparent text-gray-300 hover:bg-white/5 font-orbitron text-[10px] tracking-widest"
          >
            SYNC PC
          </Button>

          <Button
            data-testid="theme-toggle-btn"
            size="sm"
            variant="outline"
            onClick={onToggleTheme}
            title={nightMode ? "Switch to Standard dark theme" : "Switch to Night mission mode"}
            className="h-7 w-7 p-0 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10"
          >
            {nightMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          <SettingsPanel autoFollow={autoFollow} setAutoFollow={setAutoFollow} missionId={missionId} />
        </div>
      </div>
    </header>
  );
}

function StatChip({ label, value, icon: Icon, color, testId }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-[#131B2B]">
      {Icon && <Icon className="h-3 w-3 text-gray-500" />}
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-orbitron">
          {label}
        </span>
        <span data-testid={testId} className={`font-mono-tab text-[12px] ${color}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
