import { join } from "pathe";
import type { UserConfig } from "vite";
import {
	VITE_ENVIRONMENT_NAMES,
	type ViteEnvironmentNames,
} from "../constants.js";

export function getClientOutputDirectory(userConfig: UserConfig) {
	return getOutputDirectory(
		userConfig,
		VITE_ENVIRONMENT_NAMES.client,
		"client",
	);
}

export function getServerOutputDirectory(userConfig: UserConfig) {
	return getOutputDirectory(
		userConfig,
		VITE_ENVIRONMENT_NAMES.server,
		"server",
	);
}

export function getOutputDirectory(
	userConfig: UserConfig,
	environmentName: ViteEnvironmentNames,
	directoryName: string,
) {
	const rootOutputDirectory = userConfig.build?.outDir ?? "dist";

	return (
		userConfig.environments?.[environmentName]?.build?.outDir ??
		join(rootOutputDirectory, directoryName)
	);
}
