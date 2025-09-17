import { mountAssets } from "@solidjs/start/client";
import url from "../styles/lazyMountAssetsTmp.css?url";

const Lazy = () => {
  mountAssets([
    {
      tag: "link",
      attrs: {
        href: url,
        rel: "stylesheet"
      }
    }
  ]);

  return <></>
}

export default Lazy;
