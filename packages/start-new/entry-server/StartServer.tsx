// @ts-ignore
import Root from "#start/root";
import { MetaProvider } from "@solidjs/meta";
import { Router, Routes } from "@solidjs/router";
import { renderAsset } from "@vinxi/solid";
import { join } from "path";
import { HydrationScript, NoHydration, Suspense } from "solid-js/web";

import { FileRoutes } from "../root/FileRoutes";
import { Meta } from "../root/Meta";
import { ServerContext } from "./ServerContext";

export function StartServer(props) {
	const context = props.context;
	return (
		<ServerContext.Provider value={context}>
			<MetaProvider tags={context.tags}>
				<Router
					out={{}}
					url={join(import.meta.env.BASE_URL, context.event.path)}
					base={import.meta.env.BASE_URL}
				>
					<Root
						assets={
							<>
								<NoHydration>
									<Meta />
								</NoHydration>
								<Suspense>{context.assets.map((m) => renderAsset(m))}</Suspense>
							</>
						}
						scripts={
							<NoHydration>
								<HydrationScript />
								<script
									innerHTML={`window.manifest = ${JSON.stringify(
										context.manifest,
									)}`}
								></script>
								<script
									type="module"
									src={
										import.meta.env.MANIFEST["client"].inputs[
											import.meta.env.MANIFEST["client"].handler
										].output.path
									}
								/>
							</NoHydration>
						}
					>
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
