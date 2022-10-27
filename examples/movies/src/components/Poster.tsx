"use client";
import { createSignal, JSX, splitProps } from "solid-js";
import styles from "./Poster.module.scss";

const lerp = (min: number, max: number, percentage: number) =>
  min * (1 - percentage) + max * percentage;

type PosterProps = JSX.ImgHTMLAttributes<HTMLImageElement> & {};

export default function Poster(props: PosterProps) {
  const [local, imgProps] = splitProps(props, ["class"]);
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
      <img class={[styles.poster, local.class].join(" ")} {...imgProps} />
    </div>
  );
}
