import { HydrationScript, isServer, NoHydration } from "solid-js/web";
import { useRequest } from "../server/ServerContext";
import { InlineStyles } from "./InlineStyles";

const isDev = import.meta.env.MODE === "development";
const isSSR = import.meta.env.START_SSR;
const isIslands = import.meta.env.START_ISLANDS;

function IslandsScript() {
  return (
    isIslands && (
      <script
        $ServerOnly
      >{`_$HY.islandMap = {};_$HY.island = (u, c) => _$HY.islandMap[u] = c;`}</script>
    )
  );
}

function DevScripts() {
  return (
    isDev && (
      <>
        {isSSR && <HydrationScript />}
        <NoHydration>
          {isServer && (
            <>
              <script type="module" src="/@vite/client" $ServerOnly></script>
              <script
                type="module"
                async
                src={"/@fs/" + import.meta.env.START_ENTRY_CLIENT}
                $ServerOnly
              ></script>
            </>
          )}
          <IslandsScript />
          <InlineStyles />
        </NoHydration>
      </>
    )
  );
}

function ProdScripts() {
  const context = useRequest();
  return (
    <>
      {isSSR && <HydrationScript />}
      <NoHydration>
        <IslandsScript />
        {isServer &&
          (isSSR ? (
            <script type="module" async src={context!.env.manifest?.["entry-client"].script.href} />
          ) : import.meta.env.START_INDEX_HTML ? (
            // used in the SPA build index.html mode to create a reference to index html
            // which will be used by the client build
            <script type="module" async src={import.meta.env.START_ENTRY_CLIENT} $ServerOnly />
          ) : (
            <script type="module" async src={context!.env.manifest?.["index.html"].script.href} />
          ))}
      </NoHydration>
    </>
  );
}

export default function Scripts() {
  return (
    <>
      <DevScripts />
      <ProdScripts />
    </>
  );
}
