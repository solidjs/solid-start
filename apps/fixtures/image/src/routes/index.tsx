import { Image } from "@solidjs/image";
import { Title } from "@solidjs/meta";
import imageData from "../images/example.jpg?image";

const { src, transformer } = imageData;

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
          src={src}
          transformer={transformer}
          alt="Example"
        />
      </div>
    </main>
  );
}
