import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Circle, Square, Download, Maximize2 } from "lucide-react";
import { toast } from "sonner";

export default function CameraPanel({ onLog }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [active, setActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  const loadDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      if (cams.length && !selectedId) setSelectedId(cams[0].deviceId);
    } catch (e) {
      // ignore
    }
  }, [selectedId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const start = async () => {
    setError("");
    try {
      const constraints = {
        video: selectedId ? { deviceId: { exact: selectedId } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      onLog && onLog("success", "Camera stream started");
      loadDevices();
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stop();
        toast.warning("Camera disconnected");
      });
    } catch (e) {
      setError(e.message || "Camera access denied");
      onLog && onLog("critical", `Camera error: ${e.message}`);
      toast.error("Cannot access camera", { description: e.message });
    }
  };

  const stop = () => {
    if (recording) stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    onLog && onLog("warning", "Camera stream stopped");
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9" });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CANSAT-2026_camera_${Date.now()}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
        toast.success("Recording saved", { description: "WebM download started" });
      };
      mr.start();
      setRecording(true);
      onLog && onLog("info", "Camera recording started");
    } catch (e) {
      toast.error("Recording not supported in this browser");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    onLog && onLog("info", "Camera recording stopped");
  };

  const goFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  useEffect(() => () => stop(), []); // cleanup

  return (
    <div data-testid="camera-panel" className="p-3 flex flex-col gap-2 h-full">
      <div className="relative flex-1 min-h-0 rounded-md overflow-hidden bg-black border border-white/5">
        <video
          ref={videoRef}
          data-testid="camera-video"
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#0F1623]">
            <Camera className="h-8 w-8 text-gray-600" />
            <div className="text-[11px] font-orbitron tracking-widest text-gray-500">
              CAMERA OFFLINE
            </div>
            {error && <div className="text-[10px] text-red-400 px-4 text-center">{error}</div>}
          </div>
        )}
        {recording && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50">
            <span className="pulse-dot crit" />
            <span className="text-[10px] font-orbitron tracking-widest text-red-300">REC</span>
          </div>
        )}
        <div className="absolute top-2 right-2 text-[10px] font-orbitron tracking-widest">
          <span className={active ? "text-emerald-400" : "text-gray-500"}>
            {active ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <select
          data-testid="camera-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="text-[10px] font-mono-tab bg-[#0F1623] border border-white/10 rounded px-2 py-1 text-gray-200 min-w-0 flex-1"
        >
          {devices.length === 0 && <option>No cameras</option>}
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
            </option>
          ))}
        </select>
        {!active ? (
          <Button
            data-testid="camera-start-btn"
            size="sm"
            className="h-7 bg-emerald-500 hover:bg-emerald-400 text-[#0B0F19] font-orbitron text-[10px] tracking-widest"
            onClick={start}
          >
            <Camera className="h-3 w-3 mr-1" /> START
          </Button>
        ) : (
          <Button
            data-testid="camera-stop-btn"
            size="sm"
            variant="outline"
            className="h-7 border-white/10 bg-transparent text-gray-300 hover:bg-white/5 font-orbitron text-[10px] tracking-widest"
            onClick={stop}
          >
            <CameraOff className="h-3 w-3 mr-1" /> STOP
          </Button>
        )}
        {active && !recording && (
          <Button
            data-testid="camera-record-btn"
            size="sm"
            className="h-7 bg-red-500 hover:bg-red-400 text-white font-orbitron text-[10px] tracking-widest"
            onClick={startRecording}
          >
            <Circle className="h-3 w-3 mr-1" /> REC
          </Button>
        )}
        {recording && (
          <Button
            data-testid="camera-stop-record-btn"
            size="sm"
            variant="outline"
            className="h-7 border-red-500/40 text-red-300 hover:bg-red-500/10 font-orbitron text-[10px] tracking-widest"
            onClick={stopRecording}
          >
            <Square className="h-3 w-3 mr-1" /> STOP REC
          </Button>
        )}
        {active && (
          <Button
            data-testid="camera-fullscreen-btn"
            size="sm"
            variant="outline"
            className="h-7 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10 font-orbitron text-[10px] tracking-widest"
            onClick={goFullscreen}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
