import { useContext } from "solid-js";
import { NoHydration, HydrationScript, isServer } from "solid-js/web";
import { StartContext } from "../server/StartContext";

function getFromManifest(manifest) {
  const match = manifest["*"];
  const entry = match.find(src => src.type === "script");
  return <script type="module" async src={entry.href} />;
}

export default function Scripts() {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(StartContext);
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
            getFromManifest(context.manifest)
          ))}
      </NoHydration>
    </>
  );
}
