import { HttpStatusCode } from "@solidjs/start";
import NotFound from "../components/NotFound";

export default function NotFoundRoute() {
  return (
    <main>
      <NotFound />
      <HttpStatusCode code={404} />
    </main>
  );
}
