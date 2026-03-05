import { Component, lazy as solidLazy } from "solid-js";

const lazy = <T extends Component<any>>(fn: () => Promise<{ default: T }>, moduleUrl?: string) =>
  solidLazy(fn, moduleUrl);

export default lazy;
