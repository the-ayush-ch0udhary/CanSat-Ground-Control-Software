import { useCallback, useEffect, useRef, useState } from "react";
import { parseSerialPacket } from "@/utils/telemetrySim";

/**
 * useWebSerial - manages a Web Serial API connection.
 * Not all browsers support this; we handle gracefully.
 */
export function useWebSerial({ onPacket, onLog }) {
  const [supported, setSupported] = useState(false);
  const [connected, setConnected] = useState(false);
  const [portInfo, setPortInfo] = useState(null);
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "serial" in navigator);
  }, []);

  const connect = useCallback(async (baudRate = 9600) => {
    if (!("serial" in navigator)) {
      onLog && onLog("critical", "Web Serial API not supported in this browser");
      return false;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;
      const info = port.getInfo ? port.getInfo() : {};
      setPortInfo(info);
      setConnected(true);
      onLog && onLog("success", `Serial connected @ ${baudRate} baud`);

      keepReadingRef.current = true;
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      let buffer = "";
      (async () => {
        while (keepReadingRef.current) {
          try {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              let idx;
              while ((idx = buffer.indexOf("\n")) >= 0) {
                const line = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 1);
                const pkt = parseSerialPacket(line);
                if (pkt) onPacket && onPacket(pkt);
              }
            }
          } catch (err) {
            onLog && onLog("critical", `Serial read error: ${err.message}`);
            break;
          }
        }
      })();
      return true;
    } catch (err) {
      onLog && onLog("critical", `Serial connect failed: ${err.message}`);
      return false;
    }
  }, [onPacket, onLog]);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close().catch(() => {});
        portRef.current = null;
      }
    } catch (e) {
      // ignore
    }
    setConnected(false);
    setPortInfo(null);
    onLog && onLog("warning", "Serial disconnected");
  }, [onLog]);

  return { supported, connected, portInfo, connect, disconnect };
}
