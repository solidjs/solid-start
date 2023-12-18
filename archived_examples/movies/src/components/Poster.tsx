"use client";
import { createSignal, JSX, splitProps } from "solid-js";
import styles from "./Poster.module.scss";

const lerp = (min: number, max: number, percentage: number) =>
  min * (1 - percentage) + max * percentage;

type PosterProps = JSX.ImgHTMLAttributes<HTMLImageElement> & { path: string };

export default function Poster(props: PosterProps) {
  const [local, imgProps] = splitProps(props, ["class", "path"]);
  //this might have been done with just two signals but it would've required
  //calcs in css and it would've been far less readable
  const [xOffset, setXOffset] = createSignal(0);
  const [yOffset, setYOffset] = createSignal(0);
  const [spotX, setSpotX] = createSignal(50);
  const [spotY, setSpotY] = createSignal(50);
  return (
    <div
      class={styles.wrapper}
      onPointerMove={e => {
        const { width, height, x, y } = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const percentageX = (e.clientX - x) / width;
        const percentageY = (e.clientY - y) / height;
        setXOffset(lerp(-15, 15, percentageX));
        setYOffset(lerp(-15, 15, percentageY));
        setSpotX(percentageX * 100);
        setSpotY(percentageY * 100);
      }}
      onPointerLeave={() => {
        setXOffset(0);
        setYOffset(0);
        setSpotX(50);
        setSpotY(50);
      }}
      style={{
        "--x-off": xOffset(),
        "--y-off": yOffset(),
        "--spot-x": spotX(),
        "--spot-y": spotY()
      }}
    >
      <picture>
        <source
          srcset={`https://image.tmdb.org/t/p/w342${props.path}`}
          media="(min-width: 840px)"
        />
        <source
          srcset={`https://image.tmdb.org/t/p/w185${props.path}`}
          media="(min-width: 640px)"
        />
        <source
          srcset={`https://image.tmdb.org/t/p/w342${props.path}`}
          media="(min-width: 605px)"
        />
        <source
          srcset={`https://image.tmdb.org/t/p/w185${props.path}`}
          media="(min-width: 510px)"
        />
        <source
          srcset={`https://image.tmdb.org/t/p/w154${props.path}`}
          media="(min-width: 300px)"
        />
        <img
          class={[styles.poster, local.class].join(" ")}
          {...imgProps}
          src={`https://image.tmdb.org/t/p/w92${props.path}`}
          width={342}
          height={556}
        />
      </picture>
    </div>
  );
}
