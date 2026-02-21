"use client";

import { useEffect, useState, type ComponentType } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

export function MeshGradientBackground() {
  const [GradientComp, setGradientComp] = useState<AnyComponent | null>(null);

  useEffect(() => {
    import("@paper-design/shaders-react")
      .then((mod) => {
        // MeshGradient is exported from the package
        const Comp = (mod as unknown as Record<string, AnyComponent>).MeshGradient;
        if (Comp) setGradientComp(() => Comp);
      })
      .catch(() => {
        // WebGL not available — CSS fallback will show
      });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {GradientComp ? (
        <GradientComp
          color1="#1a0533"
          color2="#0a1628"
          color3="#ff1493"
          color4="#c2185b"
          speed={0.3}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #ff1493 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, #c2185b 0%, transparent 40%), #0a1628",
          }}
        />
      )}
      {/* Bottom fade overlay for smooth transition to project tabs */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background/90" />
    </div>
  );
}
