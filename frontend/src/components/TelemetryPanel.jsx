import React, { useEffect, useRef, useState } from "react";

function TValue({ label, value, unit, color = "text-cyan-300", testId }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 300);
      prev.current = value;
      return () => clearTimeout(id);
    }
  }, [value]);
  return (
    <div className="rounded-md bg-[#0F1623] border border-white/5 p-2.5 min-w-0">
      <div className="text-[9px] uppercase tracking-widest text-gray-500 font-orbitron">
        {label}
      </div>
      <div
        data-testid={testId}
        className={`mt-1 telemetry-value truncate ${color} ${flash ? "value-flash" : ""}`}
        style={{ fontSize: "clamp(14px, 1.5vw, 20px)" }}
      >
        {value}
        {unit && <span className="ml-1 text-[10px] text-gray-400 font-mono-tab align-middle">{unit}</span>}
      </div>
    </div>
  );
}

function fmt(v, digits = 2, fallback = "---") {
  if (v === undefined || v === null || (typeof v === "number" && !isFinite(v))) return fallback;
  if (typeof v === "number") return v.toFixed(digits);
  return String(v);
}

export default function TelemetryPanel({ latest, packetCount }) {
  const p = latest || {};
  const battColor =
    (p.battery ?? 100) > 60 ? "text-emerald-400" : (p.battery ?? 100) > 30 ? "text-orange-400" : "text-red-400";

  return (
    <div data-testid="telemetry-panel" className="p-3 grid grid-cols-3 gap-2 auto-rows-min">
      <TValue label="Packet #" value={fmt(p.packet_number, 0, "0")} testId="tv-packet-number" />
      <TValue label="Mission T" value={fmt(p.mission_time, 1, "0.0")} unit="s" testId="tv-mission-time" />
      <TValue label="Phase" value={p.phase || "IDLE"} color="text-yellow-300" testId="tv-phase" />

      <TValue label="Altitude" value={fmt(p.altitude, 1)} unit="m" testId="tv-altitude" />
      <TValue label="Pressure" value={fmt(p.pressure, 1)} unit="hPa" testId="tv-pressure" />
      <TValue label="Temp" value={fmt(p.temperature, 1)} unit="°C" testId="tv-temperature" />

      <TValue label="Humidity" value={fmt(p.humidity, 1)} unit="%" testId="tv-humidity" />
      <TValue label="Voltage" value={fmt(p.voltage, 2)} unit="V" testId="tv-voltage" />
      <TValue label="Battery" value={fmt(p.battery, 0)} unit="%" color={battColor} testId="tv-battery" />

      <TValue label="GPS Lat" value={fmt(p.latitude, 5)} unit="°" testId="tv-latitude" />
      <TValue label="GPS Lon" value={fmt(p.longitude, 5)} unit="°" testId="tv-longitude" />
      <TValue label="Sats" value={fmt(p.satellites, 0)} testId="tv-satellites" />

      <TValue label="Roll" value={fmt(p.roll, 1)} unit="°" testId="tv-roll" />
      <TValue label="Pitch" value={fmt(p.pitch, 1)} unit="°" testId="tv-pitch" />
      <TValue label="Yaw" value={fmt(p.yaw, 1)} unit="°" testId="tv-yaw" />

      <TValue label="Descent" value={fmt(p.descent_rate, 2)} unit="m/s" testId="tv-descent-rate" />
      <TValue label="Velocity" value={fmt(p.velocity, 2)} unit="m/s" testId="tv-velocity" />
      <TValue label="Accel Z" value={fmt(p.accel_z, 2)} unit="m/s²" testId="tv-accel-z" />

      <TValue label="Accel X" value={fmt(p.accel_x, 2)} unit="m/s²" testId="tv-accel-x" />
      <TValue label="Accel Y" value={fmt(p.accel_y, 2)} unit="m/s²" testId="tv-accel-y" />
      <TValue label="Total Rx" value={fmt(packetCount, 0, "0")} testId="tv-packet-count" />

      <TValue label="Container" value={p.container_status || "---"} color="text-orange-300" testId="tv-container-status" />
      <TValue label="Payload" value={p.payload_status || "---"} color="text-fuchsia-300" testId="tv-payload-status" />
      <TValue label="Err Code" value={p.error_code || "----"} color={(p.error_code && p.error_code !== "0000") ? "text-red-400" : "text-emerald-400"} testId="tv-error-code" />
    </div>
  );
}
