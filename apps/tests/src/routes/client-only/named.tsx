import { clientOnly } from "@solidjs/start";

const NamedClientOnly = clientOnly(() => import("./_named").then(m => m.NamedClientOnly));

export default function ClientOnlyNamed() {
  return <NamedClientOnly fallback={<p id="client-only-fallback">CLIENT_ONLY_FALLBACK</p>} />;
}
