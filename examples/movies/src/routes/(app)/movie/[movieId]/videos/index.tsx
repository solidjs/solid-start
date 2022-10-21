import { unstable_island, useSearchParams } from "solid-start";

const Input = unstable_island(() => import("../Input"));
const Images = unstable_island(() => import("./Videos"));

export default function Videos() {
  const [params] = useSearchParams();
  return (
    <main>
      <h1>Videos</h1>
      <Input value={params.q} />
      <Images />
    </main>
  );
}
