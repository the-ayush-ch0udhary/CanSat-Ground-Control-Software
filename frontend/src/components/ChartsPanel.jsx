import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { Download, Pause, Play } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const WINDOW = 60; // last N packets to display

const CHARTS = [
  { key: "altitude", label: "Altitude", unit: "m", color: "#00F0FF", fill: "rgba(0,240,255,0.12)" },
  { key: "temperature", label: "Temperature", unit: "°C", color: "#F59E0B", fill: "rgba(245,158,11,0.12)" },
  { key: "pressure", label: "Pressure", unit: "hPa", color: "#3B82F6", fill: "rgba(59,130,246,0.12)" },
  { key: "voltage", label: "Battery Voltage", unit: "V", color: "#10B981", fill: "rgba(16,185,129,0.12)" },
  { key: "descent_rate", label: "Descent Rate", unit: "m/s", color: "#EF4444", fill: "rgba(239,68,68,0.12)" },
];

function baseOptions(unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0F1623",
        borderColor: "rgba(0,240,255,0.3)",
        borderWidth: 1,
        titleColor: "#f3f4f6",
        bodyColor: "#9CA3AF",
        callbacks: { label: (ctx) => `${ctx.parsed.y?.toFixed(2)} ${unit}` },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280", font: { size: 10, family: "JetBrains Mono" } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: { color: "#6b7280", font: { size: 10, family: "JetBrains Mono" } },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };
}

function ChartCard({ packets, def, canvasRef }) {
  const slice = packets.slice(-WINDOW);
  const data = useMemo(
    () => ({
      labels: slice.map((p) => (p.mission_time ?? p.packet_number).toFixed?.(0) ?? String(p.packet_number)),
      datasets: [
        {
          label: def.label,
          data: slice.map((p) => p[def.key] ?? 0),
          borderColor: def.color,
          backgroundColor: def.fill,
          borderWidth: 1.6,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [slice, def]
  );
  return (
    <div className="h-full w-full">
      <Line ref={canvasRef} data={data} options={baseOptions(def.unit)} />
    </div>
  );
}

export default function ChartsPanel({ packets }) {
  const refs = useRef({});
  const [tab, setTab] = React.useState("altitude");
  const [paused, setPaused] = useState(false);
  const frozenRef = useRef(null);

  useEffect(() => {
    if (paused && frozenRef.current === null) {
      frozenRef.current = packets.slice();
    } else if (!paused) {
      frozenRef.current = null;
    }
  }, [paused, packets]);

  const displayed = paused && frozenRef.current ? frozenRef.current : packets;

  const exportPNG = (key) => {
    const chart = refs.current[key];
    if (!chart) return;
    const canvas = chart.canvas || chart;
    const url = canvas.toDataURL("image/png", 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CANSAT-2026_${key}_${Date.now()}.png`;
    a.click();
  };

  return (
    <div data-testid="charts-panel" className="p-3 h-full flex flex-col min-h-0">
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList className="bg-[#0F1623] border border-white/10 h-8">
            {CHARTS.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                data-testid={`chart-tab-${c.key}`}
                className="text-[10px] font-orbitron tracking-widest px-2 h-6 data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-300"
              >
                {c.label.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1.5">
            <Button
              data-testid="chart-pause-btn"
              size="sm"
              variant="outline"
              onClick={() => setPaused((p) => !p)}
              className={`h-7 border-white/10 bg-transparent hover:bg-white/5 font-orbitron text-[10px] tracking-widest ${paused ? "text-orange-300 border-orange-300/30" : "text-gray-300"}`}
            >
              {paused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {paused ? "RESUME" : "PAUSE"}
            </Button>
            <Button
              data-testid="export-graph-btn"
              size="sm"
              variant="outline"
              className="h-7 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200 text-[10px] font-orbitron tracking-widest"
              onClick={() => exportPNG(tab)}
            >
              <Download className="h-3 w-3 mr-1" />
              EXPORT PNG
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 mt-2 relative">
          {paused && (
            <div className="absolute top-1 right-1 z-10 px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-[9px] font-orbitron tracking-widest text-orange-300">
              PAUSED
            </div>
          )}
          {CHARTS.map((c) => (
            <TabsContent key={c.key} value={c.key} className="h-full mt-0 data-[state=inactive]:hidden">
              <ChartCard
                packets={displayed}
                def={c}
                canvasRef={(el) => (refs.current[c.key] = el)}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
