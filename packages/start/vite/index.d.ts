import { Plugin } from "node_modules/vite";
import { Options } from "./plugin";

export type Adapter = {
  start(options: Options): Promise<void>;
  build(options: Options): Promise<void>;
  dev(options: Options): Promise<void>;
  name: string;
};

export default function (opts?: Partial<Options>): Plugin[];
