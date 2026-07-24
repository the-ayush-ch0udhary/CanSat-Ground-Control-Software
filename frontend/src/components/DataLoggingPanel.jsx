import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileJson, Search, X } from "lucide-react";
import { exportCSV, exportJSON } from "@/utils/csv";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DataLoggingPanel({ packets, missionId }) {
  const [q, setQ] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => {
    let list = packets.slice().reverse();
    if (phaseFilter !== "ALL") list = list.filter((p) => p.phase === phaseFilter);
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter((p) =>
        [p.packet_number, p.phase, p.error_code, p.altitude, p.mission_time]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }
    return list.slice(0, 500);
  }, [packets, q, phaseFilter]);

  const PHASES = ["ALL", "LAUNCH", "ASCENT", "APOGEE", "SEPARATION", "DESCENT", "LANDING", "RECOVERY"];

  return (
    <div data-testid="data-logging-panel" className="p-3 flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            data-testid="packet-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search packets (phase, #, error code)..."
            className="pl-7 h-7 text-xs bg-[#0F1623] border-white/10 focus-visible:ring-cyan-400/20"
          />
        </div>
        <select
          data-testid="phase-filter"
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="text-[10px] font-orbitron tracking-widest bg-[#0F1623] border border-white/10 rounded h-7 px-2 text-gray-300"
        >
          {PHASES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Button
          data-testid="export-csv-btn"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10 font-orbitron text-[10px] tracking-widest"
          onClick={() => exportCSV(packets, missionId)}
        >
          <Download className="h-3 w-3 mr-1" /> CSV
        </Button>
        <Button
          data-testid="export-json-btn"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10 font-orbitron text-[10px] tracking-widest"
          onClick={() => exportJSON(packets, missionId)}
        >
          <FileJson className="h-3 w-3 mr-1" /> JSON
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-md border border-white/5">
        <table className="w-full text-[10px] font-mono-tab">
          <thead className="sticky top-0 bg-[#0F1623]/95 backdrop-blur">
            <tr className="text-left text-gray-500 uppercase">
              {["#", "T (s)", "Phase", "Alt", "Pres", "Temp", "Volt", "Lat", "Lon", "Sat", "Err"].map((h) => (
                <th key={h} className="px-2 py-1.5 font-orbitron tracking-widest text-[9px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-testid="packet-table-body">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-6 text-gray-500 text-[11px]">
                  No packets received yet. Start telemetry to see data.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr
                key={p.packet_number}
                onClick={() => setDetail(p)}
                data-testid={`packet-row-${p.packet_number}`}
                className="odd:bg-white/[0.015] hover:bg-cyan-400/10 cursor-pointer"
              >
                <td className="px-2 py-1 text-cyan-300">{p.packet_number}</td>
                <td className="px-2 py-1 text-gray-300">{p.mission_time?.toFixed(1)}</td>
                <td className="px-2 py-1 text-yellow-300">{p.phase}</td>
                <td className="px-2 py-1 text-gray-200">{p.altitude?.toFixed(1)}</td>
                <td className="px-2 py-1 text-gray-200">{p.pressure?.toFixed(1)}</td>
                <td className="px-2 py-1 text-gray-200">{p.temperature?.toFixed(1)}</td>
                <td className="px-2 py-1 text-gray-200">{p.voltage?.toFixed(2)}</td>
                <td className="px-2 py-1 text-gray-400">{p.latitude?.toFixed(4)}</td>
                <td className="px-2 py-1 text-gray-400">{p.longitude?.toFixed(4)}</td>
                <td className="px-2 py-1 text-gray-300">{p.satellites}</td>
                <td className={`px-2 py-1 ${p.error_code === "0000" ? "text-emerald-400" : "text-red-400"}`}>
                  {p.error_code}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] text-gray-500 font-mono-tab">
        Showing {filtered.length} of {packets.length} packets · Click a row for full packet details
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="bg-[#131B2B] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-orbitron tracking-widest text-cyan-300">
              PACKET #{detail?.packet_number}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Full telemetry payload · T+{detail?.mission_time?.toFixed(1)}s · {detail?.phase}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {Object.entries(detail).map(([k, v]) => (
                <div key={k} className="rounded-md border border-white/5 bg-[#0F1623] px-2.5 py-1.5">
                  <div className="text-[9px] uppercase tracking-widest text-gray-500 font-orbitron">
                    {k.replace(/_/g, " ")}
                  </div>
                  <div className="font-mono-tab text-[11px] text-cyan-200 truncate">
                    {typeof v === "number" ? v.toString() : String(v)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
