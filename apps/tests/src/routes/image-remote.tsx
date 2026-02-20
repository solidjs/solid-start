import { StartImage as Image } from "@solidjs/start/image";
import { type JSX, onMount, Show } from "solid-js";
// local
// import exampleImage from './example.jpg?image';

// remote
import exampleImage from "image:foobar";

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
