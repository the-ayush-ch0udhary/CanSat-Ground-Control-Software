import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function deg2rad(d) {
  return (d * Math.PI) / 180;
}

function CanSatModel({ roll, pitch, yaw }) {
  const group = useRef();
  useFrame(() => {
    if (!group.current) return;
    // Smooth interpolation
    const target = new THREE.Euler(deg2rad(pitch), deg2rad(yaw), deg2rad(roll), "YXZ");
    group.current.rotation.x += (target.x - group.current.rotation.x) * 0.15;
    group.current.rotation.y += (target.y - group.current.rotation.y) * 0.15;
    group.current.rotation.z += (target.z - group.current.rotation.z) * 0.15;
  });
  return (
    <group ref={group}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 1.8, 32]} />
        <meshStandardMaterial color="#0EA5B7" metalness={0.6} roughness={0.35} emissive="#0EA5B7" emissiveIntensity={0.15} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#22D3EE" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bottom cap */}
      <mesh position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0891B2" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      {/* Fins - visualize orientation */}
      {[0, 90, 180, 270].map((deg, i) => (
        <mesh
          key={i}
          rotation={[0, deg2rad(deg), 0]}
          position={[Math.sin(deg2rad(deg)) * 0.7, -0.4, Math.cos(deg2rad(deg)) * 0.7]}
        >
          <boxGeometry args={[0.02, 0.7, 0.35]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Axis lines */}
      <mesh position={[1.2, 0, 0]}>
        <boxGeometry args={[1.5, 0.02, 0.02]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.02, 1.5, 0.02]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
      <mesh position={[0, 0, 1.2]}>
        <boxGeometry args={[0.02, 0.02, 1.5]} />
        <meshBasicMaterial color="#3B82F6" />
      </mesh>
    </group>
  );
}

function HorizonRing() {
  const ring = useRef();
  useFrame((state) => {
    if (ring.current) ring.current.rotation.y = state.clock.elapsedTime * 0.05;
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.4, 0.01, 16, 64]} />
      <meshBasicMaterial color="#00F0FF" transparent opacity={0.35} />
    </mesh>
  );
}

export default function Orientation3D({ roll = 0, pitch = 0, yaw = 0 }) {
  return (
    <div data-testid="orientation-3d" className="relative h-full w-full">
      <Canvas
        camera={{ position: [3.2, 2.4, 4.2], fov: 45 }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 8, 6]} intensity={1.1} color="#ffffff" />
        <directionalLight position={[-4, -3, -5]} intensity={0.35} color="#00F0FF" />
        <HorizonRing />
        <CanSatModel roll={roll} pitch={pitch} yaw={yaw} />
      </Canvas>
      <div className="absolute bottom-2 left-2 right-2 grid grid-cols-3 gap-2 pointer-events-none">
        {[
          { label: "ROLL", v: roll, color: "text-red-400" },
          { label: "PITCH", v: pitch, color: "text-emerald-400" },
          { label: "YAW", v: yaw, color: "text-blue-400" },
        ].map((x) => (
          <div key={x.label} className="rounded-md bg-[#0F1623]/85 border border-white/10 px-2 py-1">
            <div className="text-[9px] uppercase tracking-widest text-gray-500 font-orbitron">
              {x.label}
            </div>
            <div className={`telemetry-value text-sm ${x.color}`}>{x.v?.toFixed(1)}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
