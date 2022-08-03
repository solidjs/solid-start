import { useContext } from "solid-js";
import { HydrationScript, isServer, NoHydration } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import type { PageEvent } from "../server/types";
import { InlineStyles } from "./InlineStyles";

const isDev = import.meta.env.MODE === "development";
const isSSR = import.meta.env.START_SSR;
const isIslands = import.meta.env.START_ISLANDS;

function getEntryClient(manifest: PageEvent["env"]["manifest"]) {
  const entry = manifest["entry-client"][0];
  return <script type="module" async src={entry.href} />;
}

export default function Scripts() {
  const context = useContext(ServerContext);
  return (
    <>
      {isSSR && <HydrationScript />}
      {isIslands && (
        <script>{`
        _$HY.islandMap = {};
        _$HY.island = (u, c) => _$HY.islandMap[u] = c;
      `}</script>
      )}
      <NoHydration>
        {isServer &&
          (isDev ? (
            <>
              <script type="module" src="/@vite/client" $ServerOnly></script>
              <script
                type="module"
                async
                src={"/@fs/" + import.meta.env.START_ENTRY_CLIENT}
                $ServerOnly
              ></script>
            </>
          ) : isSSR ? (
            getEntryClient(context.env.manifest)
          ) : (
            // used in the SPA build index.html mode to create a reference to index html
            // which will be used by the client build
            <script type="module" async src={import.meta.env.START_ENTRY_CLIENT} $ServerOnly />
          ))}
      </NoHydration>
      {isDev && <InlineStyles />}
    </>
  );
}
