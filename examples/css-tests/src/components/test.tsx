import { JSX } from "solid-js";

const clsx = (...args: (string | false | undefined)[]) => args.filter(Boolean).join(" ");

const integrations = {
  import: "import",
  module: "import module",
  url: "?url without render",
  link: "?url + <link>",
  mountAssets: "?url + mountAssets"
};
const Test = (props: {
  invert?: boolean;
  class?: string;
  component: string;
  file: string;
  integration?: keyof typeof integrations;
  lazy?: boolean;
  noSupport?: boolean;
  comment?: JSX.Element;
}) => (
  <div
    class={clsx(
      "grid grid-cols-subgrid col-span-full items-center rounded text-white font-medium py-1 px-2 border-4 transition-colors duration-[1.5s]",
      props.invert ? "bg-success" : "bg-error",
      props.noSupport ? "border-warn" : "border-transparent",
      props.class
    )}
  >
    <div>{props.component}</div>
    <div>{props.file}</div>
    <div>{integrations[props.integration ?? "import"]}</div>
    <div class="font-bold">{props.lazy ? <>&check;</> : null}</div>
    <div class="text-xs">{props.comment}</div>
  </div>
);

export const CommonTests = (props: { routeModuleClass?: string }) => (
  <>
    <Test
      component="Entry Server"
      file="entryServer.css"
      class="entryServer"
      noSupport
      comment="Not supported!"
    />
    <Test
      component="Entry Server"
      file="entryServerUrl.css"
      class="entryServerUrl"
      integration="link"
      noSupport
      comment="Not supported! Only works in DEV."
    />
    <Test component="Entry Client" file="entryClient.css" class="entryClient" />
    <Test component="App" file="app.css" invert />
    <Test component="Route" file="route.css" class="route" />
    <Test
      component="Route"
      file="route.module.css"
      class={props.routeModuleClass}
      integration="module"
    />
    <Test
      component="Route"
      file="url.css"
      class="url"
      integration="link"
      noSupport
      comment="<link> rendered in body results in fouc!"
    />
    <Test component="Route" file="notRendered.css" class="notRendered" integration="url" invert />
    <Test
      component="Lazy"
      file="lazy.css"
      class="lazy"
      lazy
      noSupport
      comment={
        <>
          Doesn't render on the server, ergo FOUCs. <br /> Doesn't unmount on client navigation.
        </>
      }
    />
    <Test
      component="LazyLink"
      file="lazyLink.css"
      class="lazyLink"
      integration="link"
      lazy
      noSupport
      comment="<link> rendered in body results in fouc!"
    />
    <Test
      component="LazyMountAssets"
      file="LazyMountAssets.css"
      class="lazyMountAssets"
      integration="mountAssets"
      lazy
    />
    <Test
      component="LazyLinkTmp"
      file="lazyLinkTmp.css"
      class="lazyLinkTmp"
      integration="link"
      invert
      lazy
      comment={
        <>
          Tests fallbacks, only mounted while loading.
          <br />
          Red while mounted.
        </>
      }
    />
    <Test
      component="LazyMountAssetsTmp"
      file="lazyMountAssetsTmp.css"
      class="lazyMountAssetsTmp"
      integration="mountAssets"
      invert
      lazy
      comment={
        <>
          Tests fallbacks, only mounted while loading.
          <br />
          Red while mounted.
        </>
      }
    />
  </>
);

export default Test;
