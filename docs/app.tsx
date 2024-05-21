// @refresh reload
import {
  ColorModeProvider,
  ColorModeScript,
  cookieStorageManagerSSR
} from "@kobalte/core/color-mode";
import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { isServer } from "solid-js/web";
import { getCookie } from "vinxi/http";
import "./root.css";

function getServerCookies() {
  "use server";
  const colorMode = getCookie("kb-color-mode");
  return colorMode ? `kb-color-mode=${colorMode}` : "";
}

export default function App() {
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <Router
      root={props => (
        <MetaProvider>
          <ColorModeScript storageType={storageManager.type} />
          <ColorModeProvider storageManager={storageManager}>
            <Title>SolidStart: Fine-Grained Reactivity goes fullstack</Title>
            <Meta
              property="og:title"
              content="SolidStart: Fine-Grained Reactivity goes fullstack"
            />
            <Meta name="keywords" content="SolidStart, Solid, SolidJS, Solid.js, JavaScript" />
            <Meta
              name="description"
              content="SolidStart is a JavaScript Framework designed to build SolidJS apps and deploy them to a variety of providers."
            />
            <Meta
              property="og:description"
              content="SolidStart is a JavaScript Framework designed to build SolidJS apps and deploy them to a variety of providers."
            />
            <Meta property="og:site_name" content="SolidStart" />
            <Meta property="og:type" content="website" />
            <Meta name="twitter:card" content="summary_large_image" />
            <Meta name="twitter:site" content="@solid_js" />
            <Meta property="og:image" content="https://start.solidjs.com/start_og.png" />
            <Meta property="twitter:image" content="https://start.solidjs.com/start_og.png" />
            <Suspense>{props.children}</Suspense>
          </ColorModeProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
