import { Alert, Container } from "solid-bootstrap";
import { Title } from "solid-start";
import { HttpStatusCode } from "solid-start/server";

export default function NotFound() {
  return (
    <main>
      <Title>Not Found</Title>
      <Container>
        <HttpStatusCode code={404} />

        <Alert variant="danger">
          <Alert.Heading>Page Not Found</Alert.Heading>
          <p>
            Visit{" "}
            <a href="https://start.solidjs.com" target="_blank">
              start.solidjs.com
            </a>{" "}
            to learn how to build SolidStart apps.
          </p>
        </Alert>
      </Container>
    </main>
  );
}
