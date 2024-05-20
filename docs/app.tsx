// @refresh reload
import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import {
  ColorModeProvider,
  ColorModeScript,
  cookieStorageManagerSSR,
} from "@kobalte/core";
import { getCookie } from "vinxi/http";
import { isServer } from "solid-js/web";
import "./root.css";

function getServerCookies() {
  "use server";
  const colorMode = getCookie("kb-color-mode");
  return colorMode ? `kb-color-mode=${colorMode}` : "";
}

export default function App() {
  const storageManager = cookieStorageManagerSSR(
    isServer ? getServerCookies() : document.cookie
  );

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <ColorModeScript storageType={storageManager.type} />
          <ColorModeProvider storageManager={storageManager}>
            <Title>SolidStart</Title>
            <Suspense>{props.children}</Suspense>
          </ColorModeProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
