import { useNavigate } from "solid-app-router";

export default function Home() {
  const navigate = useNavigate();
  return (
    <mesh position={[0, 0.5, 0]} castShadow onClick={() => navigate("/")}>
      <cylinderBufferGeometry />
      <meshStandardMaterial color={"orange"} />
    </mesh>
  );
}
