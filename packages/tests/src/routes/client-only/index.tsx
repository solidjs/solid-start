import { clientOnly } from "@solidjs/start";

const Component = clientOnly(() => import('./_component'))

export default function App() {

  return (
    <>
        <Component />
    </>
  );
}
