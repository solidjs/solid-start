// @ts-ignore
import Root from "#start/root";
import { MetaProvider } from "@solidjs/meta";
import { Router, Routes } from "@solidjs/router";
import { createAssets } from "@vinxi/solid";
import { NoHydration, Suspense } from "solid-js/web";

import { ServerContext } from "../entry-server/ServerContext";
import { FileRoutes, createRoutes } from "../root/FileRoutes";
import "./mount";

const Assets = createAssets(
	import.meta.env.MANIFEST["client"].handler,
	import.meta.env.MANIFEST["client"],
);

function Meta() {
	return (
		<>
			<NoHydration></NoHydration>
			<Suspense>
				<Assets />
			</Suspense>
		</>
	);
}

const routes = createRoutes();

export function StartClient() {
	return (
		<ServerContext.Provider value={{ tags: [], routes }}>
			<MetaProvider>
				<Router>
					<Root assets={<Meta />} scripts={<NoHydration />}>
						<Suspense>
							<Routes>
								<FileRoutes />
							</Routes>
						</Suspense>
					</Root>
				</Router>
			</MetaProvider>
		</ServerContext.Provider>
	);
}
