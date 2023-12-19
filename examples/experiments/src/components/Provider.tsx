"use client";
import { createSignal } from "solid-js";
import counterContext from "./counterContext";

export default function Provider(props) {
  return (
    <counterContext.Provider value={createSignal(props.initialCount)}>
      {props.children}
    </counterContext.Provider>
  );
}
