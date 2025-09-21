import { Title } from "@solidjs/meta";
import { useAuth } from "~/components/Context";

export default function Home() {
  const { session } = useAuth();

  return (
    <main>
      <Title>Home</Title>
      <h1 class="text-center">Hello World</h1>
      <img src="/favicon.svg" alt="logo" class="w-28" />
      You are signed in as <b class="font-medium">{session()?.email}</b>
    </main>
  );
}
