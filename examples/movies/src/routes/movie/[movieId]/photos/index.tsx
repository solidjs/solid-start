import { unstable_island, useParams } from "solid-start";
import { useMovie } from "../useMovie";

const Images = unstable_island(() => import("./Images"));

export default function Photos() {
  const params = useParams();
  const data = useMovie(params);
  return (
    <main>
      <Images title={"Backdrops"} images={data()?.item.images.backdrops} />
      <Images title={"Posters"} images={data()?.item.images.posters} />
    </main>
  );
}
