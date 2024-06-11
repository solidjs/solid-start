import { HttpStatusCode } from "@solidjs/start";

type Props = {
  code: "404";
};
export function ErrorComponent(props: Props) {
  return (
    <main>
      <HttpStatusCode code={Number(props.code)} />
      <p>oops. it went wrong.</p>
    </main>
  );
}
