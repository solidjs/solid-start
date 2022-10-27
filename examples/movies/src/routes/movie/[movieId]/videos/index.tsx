import { useSearchParams } from "solid-start";
import { Videos } from "./Videos";

export default function VideosPage() {
  const [params] = useSearchParams();
  return (
    <main>
      <h1>Videos</h1>
      <Videos />
    </main>
  );
}
