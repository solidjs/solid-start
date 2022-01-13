import { useParams } from "solid-app-router";

export default function () {
  const params = useParams();
  console.log("d", params.all);
  return <h2>Something went wrong.</h2>;
}
