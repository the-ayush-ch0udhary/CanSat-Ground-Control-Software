import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const cansatIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(0,240,255,0.25);animation:cansatpulse 1.6s ease-out infinite;"></div>
    <div style="position:absolute;inset:6px;border-radius:9999px;background:#00F0FF;box-shadow:0 0 12px #00F0FF;"></div>
  </div>
  <style>@keyframes cansatpulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.4);opacity:0}}</style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function AutoFollow({ position, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, enabled, map]);
  return null;
}

const BASE = [22.5726, 88.3639];

export default function GPSMap({ packets, latest, autoFollow = true }) {
  const path = useMemo(() => packets.filter((p) => p.latitude && p.longitude).map((p) => [p.latitude, p.longitude]), [packets]);
  const current = latest && latest.latitude ? [latest.latitude, latest.longitude] : BASE;

  return (
    <div data-testid="gps-map" className="relative h-full w-full">
      <MapContainer
        center={BASE}
        zoom={15}
        scrollWheelZoom={true}
        className="h-full w-full"
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <CircleMarker center={BASE} radius={4} pathOptions={{ color: "#3B82F6", fillOpacity: 0.9 }}>
          <Popup>Launch Pad · Kolkata</Popup>
        </CircleMarker>
        {path.length > 1 && (
          <Polyline positions={path} pathOptions={{ color: "#00F0FF", weight: 2, opacity: 0.85 }} />
        )}
        <Marker position={current} icon={cansatIcon}>
          <Popup>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>CANSAT-2026</div>
              <div>LAT: {current[0].toFixed(6)}</div>
              <div>LON: {current[1].toFixed(6)}</div>
              <div>ALT: {latest?.altitude?.toFixed(1) ?? "---"} m</div>
              <div>SPD: {latest ? Math.abs(latest.velocity || 0).toFixed(2) : "---"} m/s</div>
              <div>SAT: {latest?.satellites ?? "---"}</div>
              <div>PHS: {latest?.phase ?? "---"}</div>
            </div>
          </Popup>
        </Marker>
        <AutoFollow position={current} enabled={autoFollow} />
      </MapContainer>
      <div className="absolute top-2 left-2 z-[500] px-2 py-1 rounded bg-[#0F1623]/85 border border-white/10 text-[10px] font-orbitron tracking-widest text-cyan-300">
        LIVE · {current[0].toFixed(4)}, {current[1].toFixed(4)}
      </div>
    </div>
  );
}
