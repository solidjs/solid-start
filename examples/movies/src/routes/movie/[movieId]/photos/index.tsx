import { useParams } from "solid-start";
import { useMovie } from "../useMovie";
import { ImagesSection } from "./Images";

export default function Photos() {
  const params = useParams();
  const data = useMovie(params);
  return (
    <main $ServerOnly>
      <ImagesSection title={"Backdrops"} images={data()?.item.images.backdrops} />
      <ImagesSection title={"Posters"} images={data()?.item.images.posters} />
    </main>
  );
}
