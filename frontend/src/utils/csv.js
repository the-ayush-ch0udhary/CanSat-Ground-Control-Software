export const TELEMETRY_COLUMNS = [
  "packet_number",
  "mission_time",
  "phase",
  "altitude",
  "pressure",
  "temperature",
  "humidity",
  "voltage",
  "battery",
  "latitude",
  "longitude",
  "satellites",
  "roll",
  "pitch",
  "yaw",
  "descent_rate",
  "velocity",
  "accel_x",
  "accel_y",
  "accel_z",
  "container_status",
  "payload_status",
  "error_code",
];

export function packetsToCSV(packets) {
  const header = TELEMETRY_COLUMNS.join(",");
  const rows = packets.map((p) =>
    TELEMETRY_COLUMNS.map((c) => {
      const v = p[c];
      if (v === undefined || v === null) return "";
      return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadBlob(content, filename, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function exportCSV(packets, missionName = "CANSAT-2026") {
  const csv = packetsToCSV(packets);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  downloadBlob(csv, `${missionName}_telemetry_${ts}.csv`, "text/csv");
}

export function exportJSON(packets, missionName = "CANSAT-2026") {
  const json = JSON.stringify(packets, null, 2);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  downloadBlob(json, `${missionName}_telemetry_${ts}.json`, "application/json");
}
