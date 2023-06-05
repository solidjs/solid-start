import { css } from "cssed";
import { createSignal } from "solid-js";
import { background, primary } from "./theme";

const styles = css`
  .button {
    font-family: inherit;
    font-size: 150%;
    padding: 1em 2em;
    color: ${primary};
    background-color: ${background};
    border-radius: 2em;
    border: 2px solid rgba(68, 107, 158, 0);
    outline: none;
    width: 200px;
    font-variant-numeric: tabular-nums;
  }

  .button:focus {
    border: 4px solid #2c8bff;
  }
`;
export default function Counter() {
  const [count, setCount] = createSignal(0);
  return <button class={styles.button} onClick={() => setCount(count() + 1)}>Clicks: {count()}</button>;
}
