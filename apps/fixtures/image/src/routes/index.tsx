import { Image } from "@solidjs/image";
import { Title } from "@solidjs/meta";
import { type JSX, onMount, Show } from "solid-js";
import imageData from "../images/example.jpg?image";

interface PlaceholderProps {
  show: () => void;
}

function Placeholder(props: PlaceholderProps): JSX.Element {
  onMount(() => {
    props.show();
  });

  return <div>LOADING...</div>;
}

export default function Home() {
  return (
    <main>
      <Title>Image Fixture</Title>
      <h1>Image fixture</h1>
      <p>
        This fixture exercises the local image pipeline and the Start image component.
      </p>
      <div style={{ width: "60vw", "margin-left": "auto", "margin-right": "auto", background: "white", padding: "1rem" }}>
        <Image
          src={imageData}
          alt="Example"
          fallback={(visible, show) => (
            <Show when={visible()}>
              <Placeholder show={show} />
            </Show>
          )}
        />
      </div>
    </main>
  );
}
