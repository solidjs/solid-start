import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared/dev-toolbar/functions/tracker.ts", () => ({
  pushRequest: vi.fn(),
  pushResponse: vi.fn(),
}));

vi.mock("./serialization.ts", () => ({
  serializeToJSONString: vi.fn(async () => "[]"),
}));

vi.mock("./shared.ts", async importOriginal => {
  const actual = await importOriginal<typeof import("./shared.ts")>();
  return { ...actual, extractBody: vi.fn(async () => undefined) };
});

const { cloneServerReference } = await import("./client.ts");

const respondWith = (status: number, headers: Record<string, string> = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status, headers })),
  );
};

const callServerFunction = () =>
  (cloneServerReference("test-fn") as unknown as () => Promise<unknown>)();

const rejectionOf = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error("expected the server function call to reject");
};

describe("fetchServerFunction", () => {
  beforeEach(() => {
    vi.stubEnv("SERVER_BASE_URL", "http://localhost/");
  });

  it("rejects when the response is a 5xx without an X-Error header", async () => {
    respondWith(500);
    const rejection = await rejectionOf(callServerFunction());
    expect(rejection).toBeInstanceOf(Error);
    expect(rejection).toHaveProperty("message", "Server function call failed with status 500");
  });

  it("rejects with an error when an X-Error response carries no body", async () => {
    respondWith(403, { "X-Error": "true" });
    const rejection = await rejectionOf(callServerFunction());
    expect(rejection).toBeInstanceOf(Error);
    expect(rejection).toHaveProperty("message", "Server function call failed with status 403");
  });

  it("resolves normally for a successful response", async () => {
    respondWith(200);
    await expect(callServerFunction()).resolves.toBeUndefined();
  });
});

describe("server function URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const requestedUrl = () => {
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    return (call![0] as Request).url;
  };

  it("posts to the app base, not to the asset base", async () => {
    vi.stubEnv("BASE_URL", "https://cdn.example.com/");
    vi.stubEnv("SERVER_BASE_URL", "http://app.example.com/");
    respondWith(200);

    await callServerFunction();

    expect(requestedUrl()).toBe("http://app.example.com/_server");
  });

  it("exposes .url under the app base", () => {
    vi.stubEnv("BASE_URL", "https://cdn.example.com/");
    vi.stubEnv("SERVER_BASE_URL", "/app/");

    const fn = cloneServerReference("test-fn") as unknown as { url: string };

    expect(fn.url).toBe("/app/_server?id=test-fn");
  });

  it("adds the missing trailing slash to the app base", () => {
    vi.stubEnv("BASE_URL", "https://cdn.example.com/");
    vi.stubEnv("SERVER_BASE_URL", "/app");

    const fn = cloneServerReference("test-fn") as unknown as { url: string };

    expect(fn.url).toBe("/app/_server?id=test-fn");
  });
});

describe("skew protection", () => {
  let location: { reload: ReturnType<typeof vi.fn> };

  const sentBuildId = () => {
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    return (call![0] as Request).headers.get("X-Start-Build");
  };

  beforeEach(() => {
    vi.stubEnv("SERVER_BASE_URL", "http://localhost/");
    vi.stubEnv("START_BUILD_ID", "build-a");
    location = { reload: vi.fn() };
    vi.stubGlobal("location", location);
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the build ID", async () => {
    respondWith(200);
    await callServerFunction();
    expect(sentBuildId()).toBe("build-a");
  });

  it("does not send a build ID when skew protection is off", async () => {
    vi.stubEnv("START_BUILD_ID", "");
    respondWith(200);
    await callServerFunction();
    expect(sentBuildId()).toBeNull();
  });

  it("reloads the page and leaves the call pending on a skew response", async () => {
    respondWith(409, { "X-Start-Skew": "true" });
    const settled = vi.fn();
    callServerFunction().then(settled, settled);

    await vi.waitFor(() => expect(location.reload).toHaveBeenCalledTimes(1));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(settled).not.toHaveBeenCalled();
  });

  it("rejects instead of reloading again right after a reload", async () => {
    respondWith(409, { "X-Start-Skew": "true" });
    void callServerFunction();
    await vi.waitFor(() => expect(location.reload).toHaveBeenCalledTimes(1));

    const rejection = await rejectionOf(callServerFunction());
    expect(rejection).toBeInstanceOf(Error);
    expect(location.reload).toHaveBeenCalledTimes(1);
  });
});
