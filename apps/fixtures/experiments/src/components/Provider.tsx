"use client";
import { createSignal } from "solid-js";
import counterContext from "./counterContext";

export default function Provider(props) {
  return (
    <counterContext value={createSignal(props.initialCount)}>
      {props.children}
    </counterContext>
  );
}
