import { useContext } from "solid-js";
import { HydrationScript, isServer, NoHydration } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import type { PageEvent } from "../server/types";
import { InlineStyles } from "./InlineStyles";

function getEntryClient(manifest: PageEvent["env"]["manifest"]) {
  const entry = manifest["entry-client"][0];
  return <script type="module" async src={entry.href} />;
}

export default function Scripts() {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(ServerContext);
  return (
    <>
      <HydrationScript />
      <NoHydration>
        {isServer &&
          (isDev ? (
            <>
              <script type="module" src="/@vite/client" $ServerOnly></script>
              <script type="module" async src="/src/entry-client" $ServerOnly></script>
            </>
          ) : (
            getEntryClient(context.env.manifest)
          ))}
      </NoHydration>
      {isDev && <InlineStyles />}
    </>
  );
}
