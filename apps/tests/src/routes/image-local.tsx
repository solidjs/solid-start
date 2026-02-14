import { StartImage as Image } from "@solidjs/start/image";
import { type JSX, onMount, Show } from "solid-js";
import exampleImage from "../images/example.jpg?image";

interface PlaceholderProps {
  show: () => void;
}

function Placeholder(props: PlaceholderProps): JSX.Element {
  onMount(() => {
    props.show();
  });

  return <div>Loading...</div>;
}

export default function App(): JSX.Element {
  return (
    <div style={{ width: "50vw" }}>
      <Image
        {...exampleImage}
        alt="example"
        fallback={(visible, show) => (
          <Show when={visible()}>
            <Placeholder show={show} />
          </Show>
        )}
      />
    </div>
  );
}
