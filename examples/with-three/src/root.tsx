// @refresh reload
import { Routes } from "solid-start/root";
import { ErrorBoundary } from "solid-start/error-boundary";
import { Suspense } from "solid-js";
import { Canvas } from "solid-three";
import { OrbitControls } from "solid-drei";
import "./index.css";

export default function Root() {
  return (
    <div>
      <ErrorBoundary>
        <Suspense>
          <Canvas
            camera={{ position: [2, 2, 2] }}
            shadows
            gl={{
              antialias: true
            }}
          >
            <color attach="backgroundColor" r={1} g={0} b={0} />
            <group>
              <Routes />
            </group>
            <ambientLight />
            <mesh
              receiveShadow
              position={[0, 0, 0]}
              scale={[100, 100, 1]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry />
              <meshStandardMaterial color={"white"} />
            </mesh>
            <spotLight castShadow position={[-5, 5, 5]} intensity={1} />
            <OrbitControls makeDefault />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
