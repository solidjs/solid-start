import Counter from "~/components/Counter";
import { Link } from "solid-app-router";

export default function NotFound() {
  return (
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxBufferGeometry />
      <meshStandardMaterial color={"orange"} />
    </mesh>
  );
}
