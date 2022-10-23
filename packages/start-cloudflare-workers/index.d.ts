import { Miniflare, MiniflareOptions } from "miniflare";

export default function (
  props: MiniflareOptions & {
    init?: (mf: Miniflare) => void;
  }
): import("solid-start/vite").Adapter;
