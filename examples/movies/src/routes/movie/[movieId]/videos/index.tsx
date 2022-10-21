import { unstable_island, useSearchParams } from "solid-start";

const Images = unstable_island(() => import("./Videos"));

export default function Videos() {
  const [params] = useSearchParams();
  return (
    <main>
      <h1>Videos</h1>
      <Images />
    </main>
  );
}
