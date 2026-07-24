import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Satellite, Radio, ShieldAlert, Lock, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const HERO =
  "https://images.unsplash.com/photo-1457364887197-9150188c107b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxyb2NrZXQlMjBsYXVuY2glMjBuaWdodHxlbnwwfHx8fDE3ODQ3OTQ5OTF8MA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { login, register, error, setError } = useAuth();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("operator@aerotech.io");
  const [password, setPassword] = useState("AeroTech@2026");
  const [name, setName] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (tab === "login") {
      await login(email, password);
    } else {
      await register(email, password, name);
    }
    setLoading(false);
  };

  return (
    <div
      data-testid="login-screen"
      className="min-h-screen w-full grid lg:grid-cols-2 grid-cols-1"
    >
      {/* Left visual */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src={HERO}
          alt="Rocket launch"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,15,25,0.4), rgba(11,15,25,0.75)), linear-gradient(180deg, rgba(11,15,25,0.35), rgba(11,15,25,0.65))",
          }}
        />
        <div className="relative z-10 p-10 h-full flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md border border-cyan-400/30 bg-[#131B2B]/80">
              <Satellite className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="font-orbitron text-cyan-400 tracking-widest text-sm">
              AEROTECH · MISSION CONTROL
            </div>
          </div>
          <div>
            <div className="font-orbitron text-white text-4xl md:text-5xl leading-tight tracking-wide">
              CANSAT<span className="text-cyan-400 glow-cyan">-2026</span>
            </div>
            <p className="mt-4 max-w-md text-sm text-gray-300 leading-relaxed">
              Real-time telemetry monitoring and mission control software for
              the CanSat mission — live packets, GPS trajectory, orientation
              telemetry, and full ground station operations.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-orbitron tracking-widest">
              {["LIVE TELEMETRY", "GPS TRACKING", "3D ORIENTATION", "WEB SERIAL", "DATA LOGGING"].map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded border border-cyan-400/25 text-cyan-300/90 bg-[#0F1623]/60"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-mono-tab text-gray-500">
            KOLKATA · 22.5726°N · 88.3639°E · IST
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative flex items-center justify-center px-6 py-12 bg-[#0B0F19]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <Satellite className="h-5 w-5 text-cyan-400" />
            <div className="font-orbitron text-cyan-400 tracking-widest text-sm">
              AEROTECH · CANSAT-2026
            </div>
          </div>

          <div className="gcs-card p-8 relative overflow-hidden">
            <div className="mb-6">
              <div className="font-orbitron text-xl text-white tracking-widest">
                OPERATOR ACCESS
              </div>
              <div className="mt-1 text-xs text-gray-400 font-mono-tab">
                Secure JWT-authenticated mission console
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-[#0F1623] border border-white/10">
                <TabsTrigger
                  value="login"
                  data-testid="login-tab"
                  className="font-orbitron text-xs tracking-widest data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-300"
                >
                  LOGIN
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  data-testid="register-tab"
                  className="font-orbitron text-xs tracking-widest data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-300"
                >
                  REGISTER
                </TabsTrigger>
              </TabsList>

              <form onSubmit={submit} className="mt-5 space-y-4">
                {tab === "register" && (
                  <div>
                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-gray-400">
                      Operator name
                    </Label>
                    <div className="mt-1 relative">
                      <User className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                      <Input
                        id="name"
                        data-testid="register-name-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Flight Director"
                        className="pl-9 bg-[#0F1623] border-white/10 focus:border-cyan-400/40 focus-visible:ring-cyan-400/30"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest text-gray-400">
                    Email
                  </Label>
                  <div className="mt-1 relative">
                    <Radio className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      required
                      data-testid={tab === "login" ? "login-email-input" : "register-email-input"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@aerotech.io"
                      className="pl-9 bg-[#0F1623] border-white/10 focus:border-cyan-400/40 focus-visible:ring-cyan-400/30"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-gray-400">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      data-testid={tab === "login" ? "login-password-input" : "register-password-input"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 bg-[#0F1623] border-white/10 focus:border-cyan-400/40 focus-visible:ring-cyan-400/30"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    data-testid="auth-error"
                    className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
                  >
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  data-testid={tab === "login" ? "login-submit-btn" : "register-submit-btn"}
                  disabled={loading}
                  className="w-full font-orbitron tracking-widest bg-cyan-400 hover:bg-cyan-300 text-[#0B0F19] shadow-[0_0_24px_rgba(0,240,255,0.35)]"
                >
                  {loading ? "AUTHENTICATING..." : tab === "login" ? "ENGAGE" : "PROVISION ACCESS"}
                </Button>

                <div className="text-[10px] text-gray-500 text-center font-mono-tab pt-2">
                  Default operator seeded: operator@aerotech.io / AeroTech@2026
                </div>
              </form>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
