import { Title } from "@solidjs/meta";
import Layout from "../components/layout";
import { CommonTests } from "../components/test";

export default function Others() {
  return (
    <main>
      <Title>Unstyled</Title>
      <Layout title="Unstyled">
        <CommonTests />
      </Layout>
    </main>
  );
}
