import { unstable_island } from "solid-start";

const Input = unstable_island(() => import("../Input"));
const Images = unstable_island(() => import("./Images"));

export default function Photos() {
  return (
    <main>
      <h1>Photos</h1>
      <Input />
      <Images />
    </main>
  );
}
