import { useContext } from "solid-js";
import { HydrationScript, isServer, NoHydration } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import { InlineStyles } from "./InlineStyles";

const isDev = import.meta.env.MODE === "development";
const isSSR = import.meta.env.START_SSR;
const isIslands = import.meta.env.START_ISLANDS;

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
            // @ts-ignore
            <script type="module" async src={context!.env.manifest["entry-client"][0].href} />
          ) : import.meta.env.START_INDEX_HTML ? (
            // used in the SPA build index.html mode to create a reference to index html
            // which will be used by the client build
            <script type="module" async src={import.meta.env.START_ENTRY_CLIENT} $ServerOnly />
          ) : (
            // @ts-ignore
            <script type="module" async src={context!.env.manifest["index.html"][0].href} />
          ))}
      </NoHydration>
      {isDev && <InlineStyles />}
    </>
  );
}
