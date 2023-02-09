import { Container } from "solid-bootstrap";
import { Title } from "solid-start";
import Counter from "~/components/Counter";

export default function Home() {
  return (
    <main>
      <Title>Hello World</Title>

      <Container>
        <div class="bg-light p-5 rounded">
          <h1>Hello world!</h1>
          <p class="lead">
            Visit{" "}
            <a href="https://start.solidjs.com" target="_blank">
              start.solidjs.com
            </a>{" "}
            to learn how to build SolidStart apps.
          </p>
          <Counter />
        </div>
      </Container>
    </main>
  );
}
