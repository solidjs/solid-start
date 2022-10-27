import { useSearchParams } from "solid-start";
import Images from "./Videos";

export default function Videos() {
  const [params] = useSearchParams();
  return (
    <main>
      <h1>Videos</h1>
      <Images />
    </main>
  );
}
