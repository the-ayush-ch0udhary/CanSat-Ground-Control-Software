import React, { useCallback, useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useWebSerial } from "@/hooks/useWebSerial";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import GcsCard from "@/components/GcsCard";
import MissionStatusPanel from "@/components/MissionStatusPanel";
import MissionControlPanel from "@/components/MissionControlPanel";
import TelemetryPanel from "@/components/TelemetryPanel";
import ErrorCodePanel from "@/components/ErrorCodePanel";
import ChartsPanel from "@/components/ChartsPanel";
import GPSMap from "@/components/GPSMap";
import Orientation3D from "@/components/Orientation3D";
import CameraPanel from "@/components/CameraPanel";
import DataLoggingPanel from "@/components/DataLoggingPanel";
import SerialPanel from "@/components/SerialPanel";
import MissionLog from "@/components/MissionLog";
import { exportCSV } from "@/utils/csv";
import { api } from "@/lib/api";
import {
  Activity,
  Radar,
  Rocket,
  Gauge,
  AlertTriangle,
  Map as MapIcon,
  Compass,
  Video,
  Database,
  Cable,
  Terminal,
  LineChart,
} from "lucide-react";

export default function Dashboard() {
  const t = useTelemetry();
  const [autoFollow, setAutoFollow] = useState(true);
  const [nightMode, setNightMode] = useState(() => localStorage.getItem("cansat_night") === "1");

  React.useEffect(() => {
    const root = document.documentElement;
    if (nightMode) {
      root.classList.add("night-mode");
      localStorage.setItem("cansat_night", "1");
    } else {
      root.classList.remove("night-mode");
      localStorage.setItem("cansat_night", "0");
    }
  }, [nightMode]);

  const webSerial = useWebSerial({
    onPacket: (pkt) => t.ingestExternalPacket(pkt),
    onLog: (level, msg) => t.addLog(level, msg),
  });

  // Batch save to backend every 10 packets + local storage backup
  React.useEffect(() => {
    if (t.packets.length === 0) return;
    // localStorage backup (last 500 packets under mission id)
    try {
      const backup = t.packets.slice(-500);
      localStorage.setItem(`cansat_backup_${t.missionId}`, JSON.stringify(backup));
      localStorage.setItem("cansat_last_mission", t.missionId);
    } catch (e) {
      // storage quota - ignore
    }
    if (t.packets.length % 10 !== 0) return;
    const batch = t.packets.slice(-10).map((p) => ({ ...p, mission_id: t.missionId }));
    api.post("/telemetry/batch", batch).catch(() => {});
  }, [t.packets.length, t.missionId, t.packets]);

  const onSyncPCTime = useCallback(() => {
    toast.success("PC time synchronized", {
      description: `Local system time: ${new Date().toLocaleTimeString()}`,
    });
    t.addLog("info", `PC time synced: ${new Date().toISOString()}`);
  }, [t]);

  const onExport = useCallback(() => {
    if (t.packets.length === 0) {
      toast.warning("No packets to export yet");
      return;
    }
    exportCSV(t.packets, t.missionId);
    toast.success("CSV exported", { description: `${t.packets.length} packets` });
  }, [t.packets, t.missionId]);

  useKeyboardShortcuts({
    onToggle: () => (t.running ? t.stop() : t.start()),
    onExport,
    onCounterReset: t.resetPacketCounter,
    // reset with confirm handled via topbar dialog
  });

  return (
    <div className="min-h-screen w-full flex flex-col">
      <TopBar
        missionId={t.missionId}
        missionTime={t.missionTime}
        packetCount={t.packets.length}
        connected={t.connected || webSerial.connected}
        running={t.running}
        onStart={t.start}
        onStop={t.stop}
        onExport={onExport}
        onResetCounter={t.resetPacketCounter}
        onResetMission={t.reset}
        autoFollow={autoFollow}
        setAutoFollow={setAutoFollow}
        onSyncPCTime={onSyncPCTime}
        nightMode={nightMode}
        onToggleTheme={() => setNightMode((n) => !n)}
      />

      {/* Bento Grid */}
      <div className="flex-1 p-3 grid grid-cols-12 gap-3 min-h-0">
        {/* LEFT column (col-span-3) */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-3">
          <GcsCard title="Mission Phase" icon={Rocket} testId="card-mission-status" active>
            <MissionStatusPanel currentPhase={t.latest?.phase || (t.running ? "LAUNCH" : "IDLE")} />
          </GcsCard>
          <GcsCard title="Mission Control" icon={AlertTriangle} testId="card-mission-control">
            <MissionControlPanel onCommand={t.triggerCommand} missionId={t.missionId} />
          </GcsCard>
          <GcsCard title="Error Codes" icon={Radar} testId="card-error-codes">
            <ErrorCodePanel errorCode={t.latest?.error_code || "0000"} />
          </GcsCard>
          <GcsCard title="Serial Link" icon={Cable} testId="card-serial">
            <SerialPanel webSerial={webSerial} onLog={t.addLog} />
          </GcsCard>
        </div>

        {/* CENTER column (col-span-5) */}
        <div className="col-span-12 xl:col-span-5 flex flex-col gap-3 min-h-0">
          <GcsCard title="GPS Trajectory" icon={MapIcon} testId="card-gps-map" className="h-[340px]">
            <GPSMap packets={t.packets} latest={t.latest} autoFollow={autoFollow} />
          </GcsCard>
          <div className="grid grid-cols-2 gap-3 min-h-[240px]">
            <GcsCard title="3D Orientation" icon={Compass} testId="card-orientation">
              <Orientation3D
                roll={t.latest?.roll || 0}
                pitch={t.latest?.pitch || 0}
                yaw={t.latest?.yaw || 0}
              />
            </GcsCard>
            <GcsCard title="Live Camera" icon={Video} testId="card-camera">
              <CameraPanel onLog={t.addLog} />
            </GcsCard>
          </div>
          <GcsCard title="Real-Time Charts" icon={LineChart} testId="card-charts" className="h-[300px]">
            <ChartsPanel packets={t.packets} />
          </GcsCard>
        </div>

        {/* RIGHT column (col-span-4) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-3 min-h-0">
          <GcsCard title="Telemetry Stream" icon={Activity} testId="card-telemetry">
            <TelemetryPanel latest={t.latest} packetCount={t.packets.length} />
          </GcsCard>
          <GcsCard title="Data Logging" icon={Database} testId="card-data-logging" className="h-[280px]">
            <DataLoggingPanel packets={t.packets} missionId={t.missionId} />
          </GcsCard>
          <GcsCard title="Mission Log" icon={Terminal} testId="card-mission-log" className="h-[220px]">
            <MissionLog logs={t.logs} />
          </GcsCard>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 border-t border-white/5 text-[10px] font-mono-tab text-gray-500 flex flex-wrap justify-between gap-2">
        <div>
          CANSAT-2026 · AEROTECH GROUND CONTROL SOFTWARE · Kolkata · IST
        </div>
        <div className="flex items-center gap-3">
          <span>Shortcuts: <kbd className="text-cyan-300">Space</kbd> Start/Stop · <kbd className="text-cyan-300">E</kbd> Export · <kbd className="text-cyan-300">C</kbd> Reset Counter</span>
        </div>
      </footer>
    </div>
  );
}
