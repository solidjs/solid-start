import type { ResponseStub } from "./types.ts";

// according to https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages
const validRedirectStatuses = new Set([301, 302, 303, 307, 308]);

export function getExpectedRedirectStatus(response: ResponseStub): number {
	if (response.status && validRedirectStatuses.has(response.status)) {
		return response.status;
	}

	return 302;
}
