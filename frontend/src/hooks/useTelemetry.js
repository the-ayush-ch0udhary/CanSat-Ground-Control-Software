import { useEffect, useRef, useState, useCallback } from "react";
import { generatePacket } from "@/utils/telemetrySim";

const BASE_LOCATION = { lat: 22.5726, lon: 88.3639 };

/**
 * useTelemetry - drives the entire GCS state.
 * Provides packet stream, mission time, controls, and log entries.
 */
export function useTelemetry() {
  const [running, setRunning] = useState(false);
  const [missionId, setMissionId] = useState(() => `CANSAT-${Date.now().toString(36).toUpperCase()}`);
  const [missionTime, setMissionTime] = useState(0);
  const [packets, setPackets] = useState([]); // all packets this session
  const [latest, setLatest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [flags, setFlags] = useState({ emergencyParachute: false, manualSeparation: false, backupActive: false });
  const [connected, setConnected] = useState(false); // dummy generator "connected" when running
  const [source, setSource] = useState("SIM"); // SIM | SERIAL

  const startedAtRef = useRef(null); // wall clock start
  const pausedElapsedRef = useRef(0);
  const packetNumRef = useRef(0);
  const prevAltRef = useRef(null);
  const intervalRef = useRef(null);
  const flagsRef = useRef(flags);
  flagsRef.current = flags;

  const addLog = useCallback((level, message) => {
    setLogs((prev) => [{ id: `${Date.now()}-${Math.random()}`, ts: new Date(), level, message }, ...prev].slice(0, 500));
  }, []);

  const pushPacket = useCallback((pkt) => {
    setLatest(pkt);
    setPackets((prev) => {
      const next = prev.length >= 5000 ? prev.slice(-4999) : prev.slice();
      next.push(pkt);
      return next;
    });
  }, []);

  const tick = useCallback(() => {
    if (!startedAtRef.current) return;
    const now = Date.now();
    const t = (now - startedAtRef.current) / 1000 + pausedElapsedRef.current;
    setMissionTime(t);
    packetNumRef.current += 1;
    const pkt = generatePacket(t, packetNumRef.current, BASE_LOCATION, flagsRef.current, prevAltRef.current);
    prevAltRef.current = pkt.altitude;
    pushPacket(pkt);

    // Auto-emit phase change log
    setLatest((prevLatest) => {
      if (!prevLatest || prevLatest.phase !== pkt.phase) {
        addLog("info", `Phase entered: ${pkt.phase}`);
      }
      return pkt;
    });
    if (pkt.error_code !== "0000" && Math.random() < 0.05) {
      addLog("warning", `Error code: ${pkt.error_code}`);
    }
  }, [addLog, pushPacket]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    } else {
      startedAtRef.current = Date.now();
    }
    setRunning(true);
    setConnected(true);
    addLog("success", "Telemetry stream STARTED");
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, addLog]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (startedAtRef.current) {
      pausedElapsedRef.current = missionTime;
    }
    startedAtRef.current = null;
    setRunning(false);
    setConnected(false);
    addLog("warning", "Telemetry stream STOPPED");
  }, [missionTime, addLog]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startedAtRef.current = null;
    pausedElapsedRef.current = 0;
    packetNumRef.current = 0;
    prevAltRef.current = null;
    setRunning(false);
    setConnected(false);
    setMissionTime(0);
    setPackets([]);
    setLatest(null);
    setFlags({ emergencyParachute: false, manualSeparation: false, backupActive: false });
    setMissionId(`CANSAT-${Date.now().toString(36).toUpperCase()}`);
    addLog("info", "Mission RESET - new mission ID generated");
  }, [addLog]);

  const resetPacketCounter = useCallback(() => {
    packetNumRef.current = 0;
    addLog("info", "Packet counter reset");
  }, [addLog]);

  const triggerCommand = useCallback((cmd) => {
    switch (cmd) {
      case "MANUAL_SEPARATION":
        setFlags((f) => ({ ...f, manualSeparation: true }));
        addLog("critical", "COMMAND: Manual separation triggered");
        break;
      case "EMERGENCY_PARACHUTE":
        setFlags((f) => ({ ...f, emergencyParachute: true }));
        addLog("critical", "COMMAND: Emergency parachute DEPLOYED");
        break;
      case "ACTIVATE_BACKUP":
        setFlags((f) => ({ ...f, backupActive: true }));
        addLog("warning", "COMMAND: Backup system activated");
        break;
      default:
        addLog("info", `COMMAND: ${cmd}`);
    }
  }, [addLog]);

  const ingestExternalPacket = useCallback((pkt) => {
    packetNumRef.current += 1;
    const enriched = { ...pkt, packet_number: pkt.packet_number || packetNumRef.current };
    pushPacket(enriched);
    setMissionTime(enriched.mission_time || missionTime);
  }, [pushPacket, missionTime]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return {
    running,
    connected,
    missionId,
    missionTime,
    packets,
    latest,
    logs,
    flags,
    source,
    setSource,
    setConnected,
    setMissionId,
    start,
    stop,
    reset,
    resetPacketCounter,
    triggerCommand,
    addLog,
    ingestExternalPacket,
  };
}
