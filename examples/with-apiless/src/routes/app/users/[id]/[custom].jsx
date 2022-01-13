import { useNavigate, useParams } from "solid-app-router";

export default function Main() {
  const navigate = useNavigate();
  const params = useParams();
  return (
    <div>
      <button onClick={() => navigate(`/users/${params.id}`)}>Click</button>
      Hi {params.id} {params.custom}
    </div>
  );
}
