import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plug, PlugZap } from "lucide-react";

const BAUDS = [9600, 19200, 38400, 57600, 115200];

export default function SerialPanel({ webSerial, onLog }) {
  const [baud, setBaud] = useState(9600);
  return (
    <div data-testid="serial-panel" className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-orbitron">
          Web Serial API
        </div>
        <div className="flex items-center gap-1.5">
          <span className={webSerial.connected ? "pulse-dot on" : webSerial.supported ? "pulse-dot warn" : "pulse-dot off"} />
          <span className="text-[10px] font-orbitron tracking-widest">
            {webSerial.connected ? "CONNECTED" : webSerial.supported ? "READY" : "UNSUPPORTED"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          data-testid="baud-select"
          value={baud}
          onChange={(e) => setBaud(parseInt(e.target.value, 10))}
          className="text-[10px] font-mono-tab bg-[#0F1623] border border-white/10 rounded h-7 px-2 text-gray-200"
        >
          {BAUDS.map((b) => (
            <option key={b} value={b}>{b} baud</option>
          ))}
        </select>
        {!webSerial.connected ? (
          <Button
            data-testid="serial-connect-btn"
            size="sm"
            disabled={!webSerial.supported}
            onClick={() => webSerial.connect(baud)}
            className="h-7 bg-cyan-400 hover:bg-cyan-300 text-[#0B0F19] font-orbitron text-[10px] tracking-widest flex-1"
          >
            <Plug className="h-3 w-3 mr-1" /> CONNECT
          </Button>
        ) : (
          <Button
            data-testid="serial-disconnect-btn"
            size="sm"
            variant="outline"
            onClick={webSerial.disconnect}
            className="h-7 border-red-500/40 text-red-300 hover:bg-red-500/10 font-orbitron text-[10px] tracking-widest flex-1"
          >
            <PlugZap className="h-3 w-3 mr-1" /> DISCONNECT
          </Button>
        )}
      </div>
      <div className="text-[10px] text-gray-500 font-mono-tab leading-relaxed">
        Expected packet format: <span className="text-cyan-300">packet,alt,press,temp,volt,lat,lon,sats,roll,pitch,yaw,descent</span>
      </div>
      {!webSerial.supported && (
        <div className="text-[10px] text-orange-400 font-mono-tab">
          Web Serial API is not supported. Use Chrome/Edge on desktop over HTTPS.
        </div>
      )}
    </div>
  );
}
