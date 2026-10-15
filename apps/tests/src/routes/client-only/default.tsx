import { clientOnly } from "@solidjs/start";

const DefaultClientOnly = clientOnly(() => import("./_default"));

export default function ClientOnlyDefault() {
  return <DefaultClientOnly fallback={<p id="client-only-fallback">CLIENT_ONLY_FALLBACK</p>} />;
}
