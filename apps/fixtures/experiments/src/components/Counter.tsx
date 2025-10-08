"use client";

import { useContext } from "solid-js";
import "./Counter.css";
import counterContext from "./counterContext";

export default function Counter() {
  const [count, setCount] = useContext(counterContext);
  return (
    <button class="increment" onClick={() => setCount(count() + 1)} type="button">
      Clicks: {count()}
    </button>
  );
}
