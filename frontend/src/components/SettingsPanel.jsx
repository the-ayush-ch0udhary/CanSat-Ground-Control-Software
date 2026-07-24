import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, LogOut, User as UserIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

const SHORTCUTS = [
  { key: "Space", desc: "Start / Stop telemetry" },
  { key: "R", desc: "Reset mission (with confirmation)" },
  { key: "E", desc: "Export telemetry CSV" },
  { key: "C", desc: "Reset packet counter" },
];

export default function SettingsPanel({ autoFollow, setAutoFollow, missionId }) {
  const { user, logout } = useAuth();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          data-testid="settings-btn"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-transparent text-cyan-300 hover:bg-cyan-400/10 font-orbitron text-[10px] tracking-widest"
        >
          <Settings className="h-3 w-3 mr-1" />
          SETTINGS
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#0F1623] border-l border-white/10 text-white w-[380px]">
        <SheetHeader>
          <SheetTitle className="font-orbitron tracking-widest text-cyan-300">
            SETTINGS · MISSION CONSOLE
          </SheetTitle>
          <SheetDescription className="text-gray-400 text-xs">
            Configure display options, view keyboard shortcuts, and session details.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-md border border-white/10 bg-[#131B2B] p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-cyan-400/10 border border-cyan-400/25">
              <UserIcon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-orbitron text-xs tracking-widest text-white truncate">
                {user?.name || user?.email}
              </div>
              <div className="text-[10px] text-gray-400 font-mono-tab truncate">{user?.email}</div>
              <div className="text-[10px] text-gray-500 font-mono-tab">Role: {user?.role || "operator"}</div>
            </div>
            <Button
              data-testid="logout-btn"
              size="sm"
              variant="outline"
              onClick={logout}
              className="h-7 border-red-500/30 text-red-300 hover:bg-red-500/10 font-orbitron text-[10px] tracking-widest"
            >
              <LogOut className="h-3 w-3 mr-1" /> LOGOUT
            </Button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-orbitron mb-2">
              Display Options
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-[#131B2B] p-3">
              <div>
                <div className="text-sm text-white">Auto-follow CanSat on map</div>
                <div className="text-[10px] text-gray-500">Recenter map on latest GPS coordinates</div>
              </div>
              <Switch
                data-testid="auto-follow-switch"
                checked={autoFollow}
                onCheckedChange={setAutoFollow}
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-orbitron mb-2">
              Keyboard Shortcuts
            </div>
            <div className="rounded-md border border-white/10 bg-[#131B2B] divide-y divide-white/5">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between p-3">
                  <span className="text-xs text-gray-300">{s.desc}</span>
                  <kbd className="font-mono-tab text-[10px] px-2 py-1 rounded bg-[#0B0F19] border border-white/10 text-cyan-300">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-orbitron mb-2">
              Session
            </div>
            <div className="rounded-md border border-white/10 bg-[#131B2B] p-3 space-y-1 text-[11px] font-mono-tab">
              <div className="flex justify-between">
                <span className="text-gray-500">Mission ID</span>
                <span className="text-cyan-300">{missionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Team</span>
                <span className="text-white">AeroTech</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="text-white">Kolkata, IN (IST)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="text-white">22.5726°N · 88.3639°E</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
