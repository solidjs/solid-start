import { Button } from "solid-bootstrap";
import { createSignal } from "solid-js";
import "./Counter.scss";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <Button variant="primary" class="increment" size="lg"onClick={() => setCount(count() + 1)}>
      Clicks: {count()}
    </Button>
  );
}
