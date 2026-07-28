import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import { SOCS } from "@/lib/interactions/socs";
import { severityMeta, type Severity } from "@/lib/interactions/types";

const SEVERITY_HEX: Record<Severity, string> = {
  safe: "#34d399",
  minor: "#38bdf8",
  moderate: "#fbbf24",
  major: "#fb7185",
  contraindicated: "#f43f5e",
};

function Body() {
  const c = "#7dd3fc";
  return (
    <group>
      {[
        { p: [0, 1.5, 0] as const, a: [0.24, 32, 32] as const },
        { p: [0, 1.18, 0] as const, a: [0.09, 0.11, 0.22, 16] as const, cyl: true },
        { p: [0, 0.4, 0] as const, a: [0.42, 0.34, 0.95, 24] as const, cyl: true },
        { p: [0, -0.28, 0] as const, a: [0.34, 0.3, 0.42, 24] as const, cyl: true },
        { p: [-0.56, 0.35, 0] as const, a: [0.09, 0.07, 0.95, 16] as const, cyl: true },
        { p: [0.56, 0.35, 0] as const, a: [0.09, 0.07, 0.95, 16] as const, cyl: true },
        { p: [-0.19, -1.05, 0] as const, a: [0.13, 0.09, 1.14, 16] as const, cyl: true },
        { p: [0.19, -1.05, 0] as const, a: [0.13, 0.09, 1.14, 16] as const, cyl: true },
      ].map((part, i) => (
        <mesh key={i} position={part.p as unknown as [number, number, number]}>
          {"cyl" in part ? (
            <cylinderGeometry args={part.a as unknown as [number, number, number, number]} />
          ) : (
            <sphereGeometry args={part.a as unknown as [number, number, number]} />
          )}
          <meshStandardMaterial
            color={c}
            transparent
            opacity={0.09}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function OrganNode({
  id,
  label,
  position,
  radius,
  color,
  affected,
  highlighted,
  onHover,
  onSelect,
}: {
  id: string;
  label: string;
  position: [number, number, number];
  radius: number;
  color: string;
  affected: boolean;
  highlighted: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const target = highlighted ? 1.28 : affected ? 1 + Math.sin(t * 2 + position[1]) * 0.05 : 1;
    ref.current.scale.lerp({ x: target, y: target, z: target } as never, 0.14);
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <sphereGeometry args={[radius, 28, 28]} />
        <meshStandardMaterial
          color={affected ? color : "#94a3b8"}
          emissive={affected ? color : "#1e293b"}
          emissiveIntensity={highlighted ? 1.5 : affected ? 0.75 : 0.05}
          transparent
          opacity={affected ? 0.92 : 0.3}
          roughness={0.25}
        />
      </mesh>
      {highlighted && (
        <Html center distanceFactor={5} zIndexRange={[10, 0]}>
          <div className="whitespace-nowrap rounded-full border border-primary/40 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-lg backdrop-blur">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({
  impacts,
  hovered,
  onHover,
  onSelect,
}: {
  impacts: Record<string, Severity>;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const group = useRef<Group>(null);
  useFrame((_, d) => {
    if (group.current) group.current.rotation.y += d * 0.06;
  });

  const anchored = useMemo(() => SOCS.filter((s) => s.anchor), []);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <pointLight position={[-4, 1, -3]} intensity={0.6} color="#38bdf8" />
      <group ref={group} position={[0, -0.15, 0]}>
        <Body />
        {anchored.map((soc) => {
          const sev = impacts[soc.id];
          return (
            <OrganNode
              key={soc.id}
              id={soc.id}
              label={soc.short}
              position={soc.anchor!.position}
              radius={soc.anchor!.radius}
              color={sev ? SEVERITY_HEX[sev] : "#94a3b8"}
              affected={Boolean(sev)}
              highlighted={hovered === soc.id}
              onHover={onHover}
              onSelect={onSelect}
            />
          );
        })}
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={2.6}
        maxDistance={6}
        target={[0, 0.1, 0]}
        enableDamping
      />
    </>
  );
}

export default function Anatomy3D({
  impacts,
  hovered,
  onHover,
  onSelect,
}: {
  impacts: Record<string, Severity>;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const [ready, setReady] = useState(false);
  return (
    <div className="relative h-[420px] w-full sm:h-[520px]">
      <Canvas
        camera={{ position: [0, 0.4, 4], fov: 45 }}
        dpr={[1, 2]}
        onCreated={() => setReady(true)}
      >
        <Scene impacts={impacts} hovered={hovered} onHover={onHover} onSelect={onSelect} />
      </Canvas>
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          Preparing anatomical model…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground">
        Drag to rotate · scroll to zoom · click an organ for detail
      </div>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
        {(Object.keys(severityMeta) as Severity[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: SEVERITY_HEX[s] }}
            />
            {severityMeta[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
