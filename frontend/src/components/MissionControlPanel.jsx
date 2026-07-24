import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Split, AlertOctagon, ShieldCheck, RotateCw, Send } from "lucide-react";
import { api } from "@/lib/api";

const CMDS = [
  { key: "MANUAL_SEPARATION", label: "Manual Separation", icon: Split, tone: "warn", desc: "Command CanSat to release payload separation mechanism." },
  { key: "EMERGENCY_PARACHUTE", label: "Emergency Parachute", icon: AlertOctagon, tone: "crit", desc: "Deploy emergency parachute. This action cannot be reversed in-flight." },
  { key: "ACTIVATE_BACKUP", label: "Activate Backup", icon: ShieldCheck, tone: "info", desc: "Switch to redundant backup avionics." },
  { key: "RESET_MISSION", label: "Reset Mission", icon: RotateCw, tone: "info", desc: "Reset packet counter, mission time, and generate a new mission ID." },
];

export default function MissionControlPanel({ onCommand, missionId }) {
  const [pending, setPending] = useState(null);
  const [customCmd, setCustomCmd] = useState("");
  const [executing, setExecuting] = useState(false);

  const executeConfirmed = async () => {
    if (!pending) return;
    const cmd = pending;
    setExecuting(true);
    // simulate flight computer round-trip latency
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    // Simulate command success/failure (90% success)
    const success = Math.random() < 0.9;
    try {
      await api.post("/command", {
        mission_id: missionId,
        command: cmd.key,
        result: success ? "success" : "failure",
      });
    } catch (e) {
      // ignore backend errors here
    }
    if (success) {
      toast.success(`${cmd.label}: ACK received`, {
        description: "Command acknowledged by onboard flight computer.",
      });
      onCommand && onCommand(cmd.key, "success");
    } else {
      toast.error(`${cmd.label}: FAILED`, {
        description: "No acknowledgement from onboard flight computer. Retry?",
      });
      onCommand && onCommand(cmd.key, "failure");
    }
    setExecuting(false);
    setPending(null);
  };

  const sendCustom = async () => {
    const trimmed = customCmd.trim();
    if (!trimmed) return;
    setExecuting(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      await api.post("/command", { mission_id: missionId, command: trimmed, result: "success" });
    } catch (e) {}
    toast.success("Custom command sent", { description: trimmed });
    onCommand && onCommand(trimmed, "success");
    setCustomCmd("");
    setExecuting(false);
  };

  return (
    <div data-testid="mission-control-panel" className="p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {CMDS.map((c) => {
          const Icon = c.icon;
          const styles =
            c.tone === "crit"
              ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-300"
              : c.tone === "warn"
              ? "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-300"
              : "bg-cyan-400/5 border-cyan-400/25 hover:bg-cyan-400/10 text-cyan-300";
          return (
            <button
              key={c.key}
              data-testid={`cmd-${c.key.toLowerCase()}-btn`}
              onClick={() => setPending(c)}
              className={`group relative rounded-md border ${styles} px-3 py-3 text-left transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                <span className="font-orbitron text-[10px] tracking-[0.18em] uppercase">
                  {c.label}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-gray-400 leading-tight">
                Requires confirmation
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-white/10 bg-[#0F1623] p-2 flex items-center gap-2">
        <input
          data-testid="custom-command-input"
          value={customCmd}
          onChange={(e) => setCustomCmd(e.target.value)}
          placeholder="Send custom command..."
          className="flex-1 bg-transparent border-none outline-none text-xs font-mono-tab text-gray-200 placeholder:text-gray-600"
        />
        <Button
          data-testid="send-custom-command-btn"
          size="sm"
          onClick={sendCustom}
          disabled={!customCmd.trim() || executing}
          className="h-7 px-2 bg-cyan-400 text-[#0B0F19] hover:bg-cyan-300 font-orbitron text-[10px] tracking-widest"
        >
          <Send className="h-3 w-3 mr-1" />
          {executing ? "SENDING" : "SEND"}
        </Button>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && !executing && setPending(null)}>
        <AlertDialogContent className="bg-[#131B2B] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-orbitron tracking-widest text-cyan-300">
              CONFIRM: {pending?.label?.toUpperCase()}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm">
              {pending?.desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="confirm-cancel-btn"
              disabled={executing}
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-execute-btn"
              onClick={executeConfirmed}
              disabled={executing}
              className="bg-red-500 hover:bg-red-400 text-white font-orbitron tracking-widest disabled:opacity-70"
            >
              {executing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  EXECUTING…
                </span>
              ) : (
                "Execute"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
