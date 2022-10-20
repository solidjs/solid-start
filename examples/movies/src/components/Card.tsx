import { A } from "solid-start";
import { imageConfigDefault } from "../components/image/image-config";
import { ImageConfigContext } from "../components/image/image-config-context";
import { tmdbLoader, tmdbSizeMap } from "../services/tmdbAPI";
import Image from "./image/Image";

export function Card(props) {
  const media = () =>
    props.item.media_type ? props.item.media_type : props.item.name ? "tv" : "movie";
  return (
    <ImageConfigContext.Provider
      value={{
        ...imageConfigDefault,
        imageSizes: tmdbSizeMap.poster,
        deviceSizes: tmdbSizeMap.poster,
        loader: "custom",
        imageLoader: tmdbLoader
      }}
    >
      <div class="card">
        <A class="card__link" href={`/${media()}/${props.item.id}`}>
          <div class="card__img">
            <Image width={342} height={192} src={props.item.poster_path} alt={props.item.name} />
          </div>
          <h2>{props.item.title}</h2>
        </A>
      </div>
    </ImageConfigContext.Provider>
  );
}
